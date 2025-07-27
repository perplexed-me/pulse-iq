import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Search, 
  Filter,
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
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

const PatientTestResults = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState<TestResultStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchTestResults();
    fetchStats();
  }, []);

  const fetchTestResults = async () => {
    try {
      const response = await apiCall(API_CONFIG.TEST_RESULTS.MY_TESTS, {
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
      const response = await apiCall(API_CONFIG.TEST_RESULTS.MY_STATS, {
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

  // Get the most recent test type instead of most frequent
  const getLastTestType = () => {
    if (testResults.length === 0) return 'No tests';
    // Tests are already sorted by uploadedAt desc from the backend
    return testResults[0].testType;
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
                         result.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || filterType === 'all' || result.testType === filterType;
    const matchesStatus = !filterStatus || filterStatus === 'all' || result.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const uniqueTestTypes = [...new Set(testResults.map(result => result.testType))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Test Results</h3>
          <p className="text-gray-600">Please wait while we fetch your medical reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50 via-white to-cyan-50 min-h-screen">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          Test Results Dashboard
        </h1>
        <p className="text-lg text-gray-600">View and download your medical test reports</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Tests</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalTests}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Completed</p>
                  <p className="text-3xl font-bold text-green-900">{stats.completedTests}</p>
                </div>
                <div className="bg-green-500 p-3 rounded-xl">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">This Month</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.testsThisMonth}</p>
                </div>
                <div className="bg-purple-500 p-3 rounded-xl">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Last Test Type</p>
                  <p className="text-sm font-bold text-orange-900">{getLastTestType()}</p>
                </div>
                <div className="bg-orange-500 p-3 rounded-xl">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
          <CardTitle className="text-gray-800 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-cyan-600" />
            Search & Filter
          </CardTitle>
          <CardDescription className="text-gray-600">Find specific test results quickly</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search test results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48 border-gray-300 focus:border-blue-500">
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
              <SelectTrigger className="w-full md:w-48 border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Test Results List */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
          <CardTitle className="text-gray-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Your Test Results
          </CardTitle>
          <CardDescription className="text-gray-600">
            View and download your medical test reports
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-blue-500" />
              </div>
              <p className="text-gray-500 text-lg font-medium">
                {testResults.length === 0 
                  ? "No test results found." 
                  : "No test results match your search criteria."
                }
              </p>
              <p className="text-gray-400 text-sm mt-2">Check back later or adjust your filters</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredResults.map((result) => (
                <div
                  key={result.testId}
                  className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-white to-gray-50/50 hover:from-blue-50/30 hover:to-cyan-50/30 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="font-bold text-xl text-gray-900">{result.testName}</h3>
                        <Badge variant="outline" className={`${getStatusColor(result.status)} px-3 py-1 font-medium`}>
                          {result.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                          <p className="flex items-center">
                            <span className="font-semibold text-gray-700 mr-2">Test Type:</span> 
                            <span className="text-blue-600 font-medium">{result.testType}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="font-semibold text-gray-700 mr-2">Doctor:</span> 
                            <span className="text-gray-800">{result.doctorName || result.doctorId}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="font-semibold text-gray-700 mr-2">Technician:</span> 
                            <span className="text-gray-800">{result.technicianName || result.technicianId}</span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="flex items-center">
                            <span className="font-semibold text-gray-700 mr-2">Test Date:</span> 
                            <span className="text-purple-600 font-medium">{result.testDate ? formatDate(result.testDate) : 'N/A'}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="font-semibold text-gray-700 mr-2">Uploaded:</span> 
                            <span className="text-gray-800">{formatDate(result.uploadedAt)}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="font-semibold text-gray-700 mr-2">File Size:</span> 
                            <span className="text-green-600 font-medium">{formatFileSize(result.fileSize)}</span>
                          </p>
                        </div>
                      </div>

                      {result.description && (
                        <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-blue-700">Description:</span> {result.description}
                          </p>
                        </div>
                      )}

                      {result.notes && (
                        <div className="mt-3 p-3 bg-green-50/50 rounded-lg border-l-4 border-green-400">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-green-700">Notes:</span> {result.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => downloadPdf(result.testId, result.pdfFilename)}
                      disabled={downloadingId === result.testId}
                      className="ml-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-3"
                      size="lg"
                    >
                      {downloadingId === result.testId ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      <span className="ml-2 font-medium">Download</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientTestResults;
