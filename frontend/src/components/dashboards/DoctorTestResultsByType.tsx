import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Lock, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, apiCall, getAuthHeaders } from '@/config/api';

interface TestResult {
  testId: number;
  testName: string;
  testType: string;
  testDate: string;
  uploadedAt: string;
  status: string;
  pdfFilename: string;
  fileSize: number;
  doctorId: string;
  technicianId: string;
}

interface DoctorTestResultsByTypeProps {
  patientId: string;
  patientName: string;
}

const DoctorTestResultsByType: React.FC<DoctorTestResultsByTypeProps> = ({ patientId, patientName }) => {
  const { toast } = useToast();
  const [testTypes, setTestTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [viewingResults, setViewingResults] = useState(false);
  const [testResultsByType, setTestResultsByType] = useState<{[key: string]: TestResult[]}>({});

  useEffect(() => {
    fetchTestTypes();
  }, [patientId]);

  const fetchTestTypes = async () => {
    try {
      setLoading(true);
      const response = await apiCall(API_CONFIG.TEST_RESULTS.GET_TEST_TYPES_BY_PATIENT(patientId), {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setTestTypes(data.testTypes || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch test types",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching test types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch test types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestAccessToAllTestTypes = async () => {
    try {
      setRequestingAccess(true);
      
      // Debug: Log authentication details
      const token = sessionStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Patient ID:', patientId);
      console.log('API Endpoint:', API_CONFIG.DOCTORS.REQUEST_OTP);
      
      // Use direct fetch like DoctorPatientList.tsx does
      const response = await fetch(API_CONFIG.DOCTORS.REQUEST_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({
          patientId: patientId
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        // Check if response has content before parsing JSON
        const text = await response.text();
        console.log('Success response text:', text);
        let data = {};
        
        if (text.trim()) {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.warn('Response is not valid JSON:', text);
          }
        }
        
        setOtpDialogOpen(true);
        toast({
          title: "OTP Sent",
          description: "OTP has been sent to patient for all test results access",
        });
      } else {
        // Handle error response
        const text = await response.text();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          text: text
        });
        
        let errorMessage = `Failed to send OTP (${response.status}: ${response.statusText})`;
        try {
          if (text.trim()) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.warn('Error response is not valid JSON:', text);
          if (response.status === 403) {
            errorMessage = "Access denied. You may not have permission to request OTP for this patient.";
          } else if (response.status === 404) {
            errorMessage = "Endpoint not found. The OTP service may not be available.";
          }
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      toast({
        title: "Error",
        description: "Failed to send OTP. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setRequestingAccess(false);
    }
  };

  const verifyOtpAndViewResults = async () => {
    if (!otp.trim()) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }

    try {
      setOtpLoading(true);
      const token = sessionStorage.getItem('token');
      
      // Use direct fetch like DoctorPatientList.tsx does
      const response = await fetch(API_CONFIG.DOCTORS.VERIFY_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({
          patientId: patientId,
          otp: otp.trim()
        })
      });

      if (response.ok) {
        // Check if response has content before parsing JSON
        const text = await response.text();
        let data = { testResults: [] };
        
        if (text.trim()) {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.warn('Response is not valid JSON:', text);
          }
        }
        
        setTestResults(data.testResults || []);
        
        // Group test results by type
        const groupedResults: {[key: string]: TestResult[]} = {};
        data.testResults?.forEach((result: TestResult) => {
          if (!groupedResults[result.testType]) {
            groupedResults[result.testType] = [];
          }
          groupedResults[result.testType].push(result);
        });
        setTestResultsByType(groupedResults);
        
        setViewingResults(true);
        setOtpDialogOpen(false);
        setOtp('');
        toast({
          title: "Success",
          description: "Access granted to all test results",
        });
      } else {
        // Handle error response
        let errorMessage = "Invalid OTP";
        try {
          const text = await response.text();
          if (text.trim()) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.warn('Error response is not valid JSON');
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const cancelOtp = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(API_CONFIG.DOCTORS.CANCEL_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({
          patientId: patientId
        })
      });
      
      // Don't throw error for cancel operation, just log if needed
      if (!response.ok) {
        console.warn('Cancel OTP request failed, but continuing...');
      }
    } catch (error) {
      console.warn('Error cancelling OTP (non-critical):', error);
    }
    setOtpDialogOpen(false);
    setOtp('');
  };

  const downloadTestResult = async (testResult: TestResult, testType: string) => {
    if (!otp || !viewingResults) {
      toast({
        title: "Error",
        description: "Please verify OTP first to download test results",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      
      // Use the test-type-specific download endpoint for multiple test scenarios
      const response = await fetch(API_CONFIG.DOCTORS.DOWNLOAD_WITH_TEST_TYPE_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({
          testId: testResult.testId.toString(),
          patientId: patientId,
          testType: testType, // Pass the specific test type
          otp: otp
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = testResult.pdfFilename || `test-result-${testResult.testId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "Test result downloaded successfully",
        });
      } else {
        const errorText = await response.text();
        let errorMessage = "Failed to download test result";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('Error response is not valid JSON:', errorText);
        }

        toast({
          title: "Download Error", 
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading test result:', error);
      toast({
        title: "Error",
        description: "Failed to download test result. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading test types...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 p-6 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Test Results by Type
          </h3>
          <p className="text-gray-600 mt-1">for <span className="font-semibold text-blue-600">{patientName}</span></p>
        </div>
        {viewingResults && (
          <Button
            variant="outline"
            onClick={() => {
              setViewingResults(false);
              setTestResults([]);
              setTestResultsByType({});
            }}
            className="bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-gray-50/80 transition-all duration-300"
          >
            ← Back to Test Types
          </Button>
        )}
      </div>

      {!viewingResults ? (
        // Test Types Overview with Unified Access
        <div className="space-y-8">
          {testTypes.length > 0 ? (
            <>
              {/* Test Types Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testTypes.map((testType, index) => (
                  <Card key={testType} className={`
                    ${index % 3 === 0 ? 'bg-gradient-to-br from-red-50/80 to-red-100/80 border-red-200' :
                      index % 3 === 1 ? 'bg-gradient-to-br from-green-50/80 to-green-100/80 border-green-200' :
                      'bg-gradient-to-br from-orange-50/80 to-orange-100/80 border-orange-200'}
                    backdrop-blur-sm hover:shadow-lg transition-all duration-300
                  `}>
                    <CardHeader className={`
                      ${index % 3 === 0 ? 'bg-gradient-to-r from-red-100/50 to-red-50/50 border-b border-red-200/50' :
                        index % 3 === 1 ? 'bg-gradient-to-r from-green-100/50 to-green-50/50 border-b border-green-200/50' :
                        'bg-gradient-to-r from-orange-100/50 to-orange-50/50 border-b border-orange-200/50'}
                      rounded-t-lg pb-4
                    `}>
                      <CardTitle className={`flex items-center gap-3 text-lg
                        ${index % 3 === 0 ? 'text-red-800' :
                          index % 3 === 1 ? 'text-green-800' : 'text-orange-800'}
                      `}>
                        <div className={`
                          ${index % 3 === 0 ? 'bg-red-500' :
                            index % 3 === 1 ? 'bg-green-500' : 'bg-orange-500'}
                          p-3 rounded-xl shadow-lg
                        `}>
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-bold">{testType}</div>
                          <div className={`text-xs font-normal
                            ${index % 3 === 0 ? 'text-red-600' :
                              index % 3 === 1 ? 'text-green-600' : 'text-orange-600'}
                          `}>
                            Medical Test Results Available
                          </div>
                        </div>
                      </CardTitle>
                      <CardDescription className={`
                        ${index % 3 === 0 ? 'text-red-600' :
                          index % 3 === 1 ? 'text-green-600' : 'text-orange-600'}
                        text-sm mt-2
                      `}>
                        {/* Test results are available for this type */}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {/* Unified Access Section */}
              <Card className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 border-blue-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-100/50 to-purple-100/50 border-b border-blue-200/50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl shadow-lg">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold">Request Access to All Test Results</div>
                      <div className="text-sm font-normal text-blue-600">
                        Get access to all {testTypes.length} test types at once
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-blue-600 text-sm mt-2">
                    Click below to request OTP access for all test result types. The patient will receive an OTP to grant you access to view and download all test results.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold py-4 text-lg"
                    onClick={requestAccessToAllTestTypes}
                    disabled={requestingAccess}
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    {requestingAccess ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending OTP...
                      </span>
                    ) : (
                      'Request Access to All Test Results'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 border-gray-200">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Test Results Found</h3>
                <p className="text-gray-500 text-lg">This patient doesn't have any test results uploaded yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Test Results View - Grouped by Type
        <div className="space-y-8">
          <div className="flex items-center gap-4 mb-6">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg px-4 py-2 font-bold shadow-lg">
              All Test Results
            </Badge>
            <span className="text-gray-600 font-medium">({testResults.length} total results found)</span>
          </div>

          {Object.keys(testResultsByType).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(testResultsByType).map(([testType, results], typeIndex) => (
                <div key={testType} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className={`
                      ${typeIndex % 3 === 0 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        typeIndex % 3 === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        'bg-gradient-to-r from-orange-500 to-orange-600'}
                      text-white text-lg px-4 py-2 font-bold shadow-lg
                    `}>
                      {testType}
                    </Badge>
                    <span className="text-gray-600 font-medium">({results.length} results)</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {results.map((result, index) => (
                      <Card key={result.testId} className={`
                        ${typeIndex % 3 === 0 ? 'bg-gradient-to-r from-red-50/80 to-red-100/80 border-red-200' :
                          typeIndex % 3 === 1 ? 'bg-gradient-to-r from-green-50/80 to-green-100/80 border-green-200' :
                          'bg-gradient-to-r from-orange-50/80 to-orange-100/80 border-orange-200'}
                        backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                      `}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className={`
                                  ${typeIndex % 3 === 0 ? 'bg-red-500' :
                                    typeIndex % 3 === 1 ? 'bg-green-500' : 'bg-orange-500'}
                                  p-2 rounded-lg shadow-lg
                                `}>
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className={`font-bold text-lg
                                    ${typeIndex % 3 === 0 ? 'text-red-800' :
                                      typeIndex % 3 === 1 ? 'text-green-800' : 'text-orange-800'}
                                  `}>
                                    {result.testName}
                                  </h4>
                                  <Badge className={`
                                    ${result.status === 'COMPLETED' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}
                                    text-white font-semibold mt-1
                                  `}>
                                    {result.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className={`
                                ${typeIndex % 3 === 0 ? 'bg-red-50 border-red-200' :
                                  typeIndex % 3 === 1 ? 'bg-green-50 border-green-200' :
                                  'bg-orange-50 border-orange-200'}
                                p-4 rounded-lg border space-y-2
                              `}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className={`
                                    ${typeIndex % 3 === 0 ? 'text-red-700' :
                                      typeIndex % 3 === 1 ? 'text-green-700' : 'text-orange-700'}
                                    font-medium
                                  `}>
                                    <span className="font-semibold">Test Date:</span> {new Date(result.testDate).toLocaleDateString()}
                                  </div>
                                  <div className={`
                                    ${typeIndex % 3 === 0 ? 'text-red-700' :
                                      typeIndex % 3 === 1 ? 'text-green-700' : 'text-orange-700'}
                                    font-medium
                                  `}>
                                    <span className="font-semibold">Uploaded:</span> {new Date(result.uploadedAt).toLocaleDateString()}
                                  </div>
                                  <div className={`
                                    ${typeIndex % 3 === 0 ? 'text-red-700' :
                                      typeIndex % 3 === 1 ? 'text-green-700' : 'text-orange-700'}
                                    font-medium md:col-span-2
                                  `}>
                                    <span className="font-semibold">File:</span> {result.pdfFilename} ({formatFileSize(result.fileSize)})
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-6">
                              <Button
                                onClick={() => downloadTestResult(result, testType)}
                                className={`
                                  ${typeIndex % 3 === 0 ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' :
                                    typeIndex % 3 === 1 ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' :
                                    'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'}
                                  text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold px-6 py-3
                                `}
                              >
                                <Download className="w-5 h-5 mr-2" />
                                Download PDF
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 border-gray-200">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Test Results Found</h3>
                <p className="text-gray-500">No test results available for this patient.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Enhanced OTP Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={(open) => !open && cancelOtp()}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 backdrop-blur-sm">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enter OTP for All Test Results Access
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              An OTP has been sent to the patient's email for <span className="font-semibold text-blue-600">all test results</span> access.
              <br />
              <span className="text-sm text-amber-600 font-medium">⏰ The OTP will expire in 10 minutes.</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            <div className="space-y-3">
              <Label htmlFor="otp" className="text-gray-700 font-semibold">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-bold border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
              />
            </div>
            
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={cancelOtp}
                className="bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-gray-50/80 px-6"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={verifyOtpAndViewResults} 
                disabled={otpLoading || otp.length !== 6}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 font-semibold"
              >
                {otpLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </span>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    View Results
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorTestResultsByType;
