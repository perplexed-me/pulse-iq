import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, FileText, Download, Shield, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, apiCall } from '@/config/api';
import DoctorTestResultsByType from './DoctorTestResultsByType';

interface CompletedPatient {
  patientId: string;
  patientName: string;
  lastAppointmentDate: string;
  completedAppointments: number;
}

interface TestResult {
  testId: number;
  testName: string;
  testType: string;
  testDate: string;
  status: string;
}

const DoctorPatientList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<CompletedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<CompletedPatient | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCompletedPatients();
    }
  }, [user]);

  const fetchCompletedPatients = async () => {
    try {
      const response = await apiCall(API_CONFIG.DOCTORS.COMPLETED_PATIENTS(user?.id || ''), {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        console.error('Failed to fetch completed patients');
        toast({
          title: "Error",
          description: "Failed to load patient list",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching completed patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patient list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (patientId: string) => {
    try {
      const token = sessionStorage.getItem('token');
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

      if (response.ok) {
        const data = await response.json();
        setOtpRequested(true);
        toast({
          title: "OTP Sent",
          description: data.message,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      toast({
        title: "Error",
        description: "Failed to send OTP",
        variant: "destructive",
      });
    }
  };

  const verifyOtpAndGetResults = async () => {
    if (!selectedPatient || !otp) return;

    setVerifyingOtp(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(API_CONFIG.DOCTORS.VERIFY_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({
          patientId: selectedPatient.patientId,
          otp: otp
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data.testResults);
        toast({
          title: "Success",
          description: "OTP verified! Test results loaded.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Invalid OTP",
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
      setVerifyingOtp(false);
    }
  };

  const downloadTestResult = async (testId: number) => {
    if (!selectedPatient || !otp) {
      toast({
        title: "Error",
        description: "Please verify OTP first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the token for authorization
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(API_CONFIG.DOCTORS.DOWNLOAD_WITH_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: new URLSearchParams({
          testId: testId.toString(),
          patientId: selectedPatient.patientId,
          otp: otp
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-result-${testId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Test result downloaded successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to download test result",
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

  const openPatientDialog = (patient: CompletedPatient) => {
    setSelectedPatient(patient);
    setOtp('');
    setOtpRequested(false);
    setTestResults([]);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedPatient(null);
    setOtp('');
    setOtpRequested(false);
    setTestResults([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 rounded-full animate-pulse"></div>
        <div className="absolute top-60 right-32 w-24 h-24 bg-purple-200/20 rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-28 h-28 bg-cyan-200/20 rounded-full animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              My Patients ✨
            </h2>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-lg blur opacity-25"></div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive patient management with secure access to medical records and test results
          </p>
        </div>

        {patients.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-2xl">
            <CardContent className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                No Patients Yet
              </h3>
              <p className="text-gray-600 text-lg">
                You haven't completed any appointments yet. Your patient list will appear here once you complete consultations.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {patients.map((patient, index) => (
              <Card key={patient.patientId} className={`
                ${index % 3 === 0 ? 'bg-gradient-to-br from-blue-50/80 to-blue-100/80 border-blue-200' : 
                  index % 3 === 1 ? 'bg-gradient-to-br from-purple-50/80 to-purple-100/80 border-purple-200' : 
                  'bg-gradient-to-br from-cyan-50/80 to-cyan-100/80 border-cyan-200'}
                backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105
              `}>
                <CardHeader className={`
                  ${index % 3 === 0 ? 'bg-gradient-to-r from-blue-100/50 to-blue-50/50 border-b border-blue-200/50' :
                    index % 3 === 1 ? 'bg-gradient-to-r from-purple-100/50 to-purple-50/50 border-b border-purple-200/50' :
                    'bg-gradient-to-r from-cyan-100/50 to-cyan-50/50 border-b border-cyan-200/50'}
                  rounded-t-lg
                `}>
                  <CardTitle className={`flex items-center gap-3 text-lg
                    ${index % 3 === 0 ? 'text-blue-800' : 
                      index % 3 === 1 ? 'text-purple-800' : 'text-cyan-800'}
                  `}>
                    <div className={`
                      ${index % 3 === 0 ? 'bg-blue-500' : 
                        index % 3 === 1 ? 'bg-purple-500' : 'bg-cyan-500'}
                      p-2 rounded-lg shadow-lg
                    `}>
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    {patient.patientName}
                  </CardTitle>
                  <CardDescription className={`
                    ${index % 3 === 0 ? 'text-blue-600' : 
                      index % 3 === 1 ? 'text-purple-600' : 'text-cyan-600'}
                    font-medium
                  `}>
                    Patient ID: {patient.patientId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-4">
                    <div className={`
                      ${index % 3 === 0 ? 'bg-blue-50 border-blue-200' :
                        index % 3 === 1 ? 'bg-purple-50 border-purple-200' :
                        'bg-cyan-50 border-cyan-200'}
                      p-4 rounded-lg border
                    `}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium
                          ${index % 3 === 0 ? 'text-blue-700' :
                            index % 3 === 1 ? 'text-purple-700' : 'text-cyan-700'}
                        `}>Last Appointment:</span>
                        <span className={`text-sm font-bold
                          ${index % 3 === 0 ? 'text-blue-900' :
                            index % 3 === 1 ? 'text-purple-900' : 'text-cyan-900'}
                        `}>
                          {new Date(patient.lastAppointmentDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`
                      ${index % 3 === 0 ? 'bg-blue-50 border-blue-200' :
                        index % 3 === 1 ? 'bg-purple-50 border-purple-200' :
                        'bg-cyan-50 border-cyan-200'}
                      p-4 rounded-lg border
                    `}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium
                          ${index % 3 === 0 ? 'text-blue-700' :
                            index % 3 === 1 ? 'text-purple-700' : 'text-cyan-700'}
                        `}>Completed Visits:</span>
                        <Badge className={`
                          ${index % 3 === 0 ? 'bg-blue-500 hover:bg-blue-600' :
                            index % 3 === 1 ? 'bg-purple-500 hover:bg-purple-600' :
                            'bg-cyan-500 hover:bg-cyan-600'}
                          text-white px-3 py-1 font-bold
                        `}>
                          {patient.completedAppointments}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Dialog open={isDialogOpen && selectedPatient?.patientId === patient.patientId} onOpenChange={(open) => open ? openPatientDialog(patient) : closeDialog()}>
                    <DialogTrigger asChild>
                      <Button className={`
                        w-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                        ${index % 3 === 0 ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' :
                          index % 3 === 1 ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' :
                          'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800'}
                        text-white font-semibold py-3
                      `}>
                        <FileText className="w-5 h-5 mr-2" />
                        View Test Results
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm">
                      <DialogHeader className="border-b border-gray-200/50 pb-4">
                        <DialogTitle className="flex items-center gap-3 text-2xl">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Medical Test Results
                          </span>
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 text-lg">
                          Secure access to test results by type for <span className="font-semibold text-blue-600">{patient.patientName}</span>
                        </DialogDescription>
                      </DialogHeader>
                      
                      <DoctorTestResultsByType 
                        patientId={patient.patientId}
                        patientName={patient.patientName}
                      />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatientList;
