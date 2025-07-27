import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, FileText, Lock, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, apiCall } from '@/config/api';

interface TestResult {
  testId: number;
  testName: string;
  testType: string;
  testDate: string;
  status: string;
  pdfFilename: string;
  fileSize: number;
  notes?: string;
}

interface TestTypeViewerProps {
  patientId: string;
  patientName: string;
}

const TestTypeViewer: React.FC<TestTypeViewerProps> = ({ patientId, patientName }) => {
  const { toast } = useToast();
  const [testTypes, setTestTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestType, setSelectedTestType] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [currentTestType, setCurrentTestType] = useState<string>('');

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
        const types = await response.json();
        setTestTypes(types);
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

  const handleViewTestType = async (testType: string) => {
    setCurrentTestType(testType);
    setSelectedTestType(testType);
    setShowOtpDialog(true);
    
    // Auto-request OTP
    await requestOtpForTestType(testType);
  };

  const requestOtpForTestType = async (testType: string) => {
    try {
      setOtpLoading(true);
      const response = await apiCall(API_CONFIG.TEST_RESULTS.REQUEST_OTP_FOR_TEST_TYPE(patientId, testType), {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        setOtpRequested(true);
        toast({
          title: "OTP Sent",
          description: `Verification code sent to patient for ${testType} results`,
        });
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || `Failed to send OTP for ${testType}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      toast({
        title: "Error",
        description: `Failed to request OTP for ${testType}`,
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
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
      const response = await apiCall(API_CONFIG.TEST_RESULTS.VERIFY_OTP_FOR_TEST_TYPE(patientId, currentTestType), {
        method: 'POST',
        body: JSON.stringify({ otp: otp.trim() })
      });

      if (response.ok) {
        // Fetch test results for this type
        await fetchTestResultsForType(currentTestType);
        setShowOtpDialog(false);
        setOtp('');
        setOtpRequested(false);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Invalid or expired OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const fetchTestResultsForType = async (testType: string) => {
    try {
      const response = await apiCall(
        `${API_CONFIG.USER_APPOINTMENT_BASE_URL}/api/test-results/patient/${patientId}/test-type/${testType}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const results = await response.json();
        setTestResults(results);
        toast({
          title: "Success",
          description: `Loaded ${results.length} ${testType} test results`,
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to fetch ${testType} results`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
      toast({
        title: "Error",
        description: `Failed to fetch ${testType} results`,
        variant: "destructive",
      });
    }
  };

  const downloadTestResult = async (testId: number, filename: string) => {
    try {
      const response = await apiCall(API_CONFIG.TEST_RESULTS.DOWNLOAD_WITH_OTP(testId), {
        method: 'GET'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: `Downloaded ${filename}`,
        });
      } else {
        toast({
          title: "Error", 
          description: "Failed to download test result",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading test result:', error);
      toast({
        title: "Error",
        description: "Failed to download test result",
        variant: "destructive",
      });
    }
  };

  const cancelOtp = async () => {
    try {
      await apiCall(API_CONFIG.TEST_RESULTS.CANCEL_OTP_FOR_TEST_TYPE(patientId, currentTestType), {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error cancelling OTP:', error);
    }
    
    setShowOtpDialog(false);
    setOtp('');
    setOtpRequested(false);
    setCurrentTestType('');
  };

  const closeTestResults = () => {
    setSelectedTestType(null);
    setTestResults([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading test types...</p>
        </div>
      </div>
    );
  }

  if (testTypes.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No test results found for {patientName}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Test Results for {patientName}</h3>
        <p className="text-sm text-gray-600">Click on a test type to request access and view results</p>
      </div>

      {/* Test Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testTypes.map((testType) => (
          <Card key={testType} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {testType}
              </CardTitle>
              <CardDescription>
                Click to request access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => handleViewTestType(testType)}
                className="w-full"
                size="sm"
              >
                <Lock className="w-4 h-4 mr-2" />
                Request Access
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Results View */}
      {selectedTestType && testResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedTestType} Results
              </CardTitle>
              <Button variant="outline" size="sm" onClick={closeTestResults}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              {testResults.length} test result(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result) => (
                <div key={result.testId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{result.testName}</h4>
                    <p className="text-sm text-gray-500">
                      Date: {new Date(result.testDate).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{result.status}</Badge>
                      <span className="text-xs text-gray-400">
                        {(result.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    {result.notes && (
                      <p className="text-sm text-gray-600 mt-1">{result.notes}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => downloadTestResult(result.testId, result.pdfFilename)}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Access {currentTestType} Results</DialogTitle>
            <DialogDescription>
              Enter the verification code sent to {patientName}'s email
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {otpRequested && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Verification code sent to patient's email for {currentTestType} results access
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={verifyOtpAndViewResults}
                disabled={otpLoading || !otp.trim()}
                className="flex-1"
              >
                {otpLoading ? "Verifying..." : "Verify & View Results"}
              </Button>
              <Button
                onClick={cancelOtp}
                variant="outline"
                disabled={otpLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestTypeViewer;
