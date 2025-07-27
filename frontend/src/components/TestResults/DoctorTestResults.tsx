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
  Edit,
  Loader2,
  AlertCircle,
  Stethoscope,
  Eye
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

const DoctorTestResults = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPatient, setFilterPatient] = useState('');

  useEffect(() => {
    fetchTestResults();
  }, []);

  const fetchTestResults = async () => {
    try {
      const response = await apiCall(API_CONFIG.TEST_RESULTS.MY_ORDERS, {
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

  const updateTestStatus = async (testId: number, newStatus: string) => {
    setUpdatingId(testId);
    try {
      const response = await apiCall(API_CONFIG.TEST_RESULTS.UPDATE_STATUS(testId, newStatus), {
        method: 'PUT'
      });

      if (response.ok) {
        // Refresh the list
        await fetchTestResults();
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

  const getUrgencyLevel = (status: string, uploadedDate: string) => {
    const daysSinceUpload = Math.floor((new Date().getTime() - new Date(uploadedDate).getTime()) / (1000 * 3600 * 24));
    
    if (status === 'COMPLETED' && daysSinceUpload > 2) {
      return { level: 'high', text: 'Needs Review', color: 'bg-red-50 text-red-700 border-red-200' };
    } else if (status === 'COMPLETED' && daysSinceUpload > 1) {
      return { level: 'medium', text: 'Review Soon', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    } else if (status === 'REVIEWED') {
      return { level: 'low', text: 'Reviewed', color: 'bg-green-50 text-green-700 border-green-200' };
    }
    return null;
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
                         result.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || filterType === 'all' || result.testType === filterType;
    const matchesStatus = !filterStatus || filterStatus === 'all' || result.status === filterStatus;
    const matchesPatient = !filterPatient || result.patientId.toLowerCase().includes(filterPatient.toLowerCase());

    return matchesSearch && matchesType && matchesStatus && matchesPatient;
  });

  const uniqueTestTypes = [...new Set(testResults.map(result => result.testType))];
  const uniquePatients = [...new Set(testResults.map(result => result.patientId))];

  // Calculate statistics
  const stats = {
    total: testResults.length,
    needsReview: testResults.filter(r => r.status === 'COMPLETED').length,
    reviewed: testResults.filter(r => r.status === 'REVIEWED').length,
    pending: testResults.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading test results...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Number of Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Needs Review</p>
                <p className="text-2xl font-bold text-orange-600">{stats.needsReview}</p>
              </div>
              <Eye className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-green-600">{stats.reviewed}</p>
              </div>
              <Stethoscope className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search test results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Needs Review</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Filter by Patient ID..."
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Results List */}
      <Card>
        <CardHeader>
          <CardTitle>Ordered Test Results</CardTitle>
          <CardDescription>
            Review and manage test results for your patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {testResults.length === 0 
                  ? "No test results found." 
                  : "No test results match your search criteria."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => {
                const urgency = getUrgencyLevel(result.status, result.uploadedAt);
                
                return (
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
                          {urgency && (
                            <Badge variant="outline" className={urgency.color}>
                              {urgency.text}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">Test Type:</span> {result.testType}</p>
                            <p><span className="font-medium">Patient ID:</span> {result.patientId}</p>
                            <p><span className="font-medium">Technician:</span> {result.technicianName || result.technicianId}</p>
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

                        {result.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Notes:</span> {result.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {result.status === 'COMPLETED' && (
                          <Button
                            onClick={() => updateTestStatus(result.testId, 'REVIEWED')}
                            disabled={updatingId === result.testId}
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorTestResults;
