import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Search, 
  Edit,
  Loader2,
  AlertCircle,
  Upload,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TestResultUpload from './TestResultUpload';
import { API_CONFIG, apiCall } from '@/config/api';

interface TestResult {
  testId: number;
  testName: string;
  testType: string;
  description: string;
  pdfFilename: string;
  fileSize: number;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  technicianId: string;
  technicianName: string;
  uploadedAt: string;
  testDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'CANCELLED';
  notes: string;
}

interface TestResultStats {
  totalTests: number;
  completedTests: number;
  pendingTests: number;
  reviewedTests: number;
  cancelledTests: number;
  mostFrequentTestType: string;
  testsThisMonth: number;
  testsThisYear: number;
}

const TechnicianTestResults = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState<TestResultStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchTestResults();
    fetchStats();
  }, []);

  const fetchTestResults = async () => {
    try {
      const response = await apiCall(API_CONFIG.TEST_RESULTS.MY_UPLOADS, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data);
      } else {
        console.error('Failed to fetch test results');
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiCall(API_CONFIG.TEST_RESULTS.MY_UPLOAD_STATS, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateTestStatus = async (testId: number, newStatus: string) => {
    setUpdatingId(testId);
    try {
      const response = await apiCall(API_CONFIG.TEST_RESULTS.UPDATE_STATUS(testId, newStatus), {
        method: 'PUT'
      });

      if (response.ok) {
        // Refresh the list
        await fetchTestResults();
        await fetchStats();
      } else {
        console.error('Failed to update test status');
      }
    } catch (error) {
      console.error('Error updating test status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const downloadPdf = async (testId: number, filename: string) => {
    setDownloadingId(testId);
    try {
      const response = await apiCall(API_CONFIG.TEST_RESULTS.DOWNLOAD(testId), {
        method: 'GET'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REVIEWED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredResults = testResults.filter(result => {
    const matchesSearch = result.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.doctorId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || filterType === 'all' || result.testType === filterType;
    const matchesStatus = !filterStatus || filterStatus === 'all' || result.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const uniqueTestTypes = [...new Set(testResults.map(result => result.testType))];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="uploads" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="uploads">My Uploads</TabsTrigger>
          <TabsTrigger value="upload-new">Upload New</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Upload New Tab */}
        <TabsContent value="upload-new">
          <TestResultUpload />
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          {stats && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Upload Statistics
                  </CardTitle>
                  <CardDescription>Your test upload performance and analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Uploads</p>
                          <p className="text-2xl font-bold text-blue-900">{stats.totalTests}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Completed</p>
                          <p className="text-2xl font-bold text-green-900">{stats.completedTests}</p>
                        </div>
                        <Upload className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">This Month</p>
                          <p className="text-2xl font-bold text-purple-900">{stats.testsThisMonth}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Most Common</p>
                          <p className="text-sm font-bold text-orange-900">{stats.mostFrequentTestType}</p>
                        </div>
                        <User className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                      <p className="text-xl font-bold text-yellow-900">{stats.pendingTests}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-600">Reviewed</p>
                      <p className="text-xl font-bold text-blue-900">{stats.reviewedTests}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-600">This Year</p>
                      <p className="text-xl font-bold text-gray-900">{stats.testsThisYear}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* My Uploads Tab */}
        <TabsContent value="uploads">
          <div className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search uploads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueTestTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="REVIEWED">Reviewed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Test Results List */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Test Results</CardTitle>
                <CardDescription>
                  Manage test results you have uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="ml-2">Loading uploads...</span>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {testResults.length === 0 
                        ? "No uploads found." 
                        : "No uploads match your search criteria."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredResults.map((result) => (
                      <div
                        key={result.testId}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{result.testName}</h3>
                              <Badge variant="outline" className={getStatusColor(result.status)}>
                                {result.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p><span className="font-medium">Test Type:</span> {result.testType}</p>
                                <p><span className="font-medium">Patient ID:</span> {result.patientId}</p>
                                <p><span className="font-medium">Doctor ID:</span> {result.doctorId}</p>
                              </div>
                              <div>
                                <p><span className="font-medium">Test Date:</span> {result.testDate ? formatDate(result.testDate) : 'N/A'}</p>
                                <p><span className="font-medium">Uploaded:</span> {formatDate(result.uploadedAt)}</p>
                                <p><span className="font-medium">File Size:</span> {formatFileSize(result.fileSize)}</p>
                              </div>
                            </div>

                            {result.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                <span className="font-medium">Description:</span> {result.description}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            {result.status === 'COMPLETED' && (
                              <Button
                                onClick={() => updateTestStatus(result.testId, 'REVIEWED')}
                                disabled={updatingId === result.testId}
                                variant="outline"
                                size="sm"
                              >
                                {updatingId === result.testId ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Edit className="w-4 h-4" />
                                )}
                                <span className="ml-2 hidden sm:inline">Mark Reviewed</span>
                              </Button>
                            )}

                            <Button
                              onClick={() => downloadPdf(result.testId, result.pdfFilename)}
                              disabled={downloadingId === result.testId}
                              variant="outline"
                              size="sm"
                            >
                              {downloadingId === result.testId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              <span className="ml-2 hidden sm:inline">Download</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TechnicianTestResults;
