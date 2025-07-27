import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Calendar, User, Stethoscope } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_CONFIG, apiCall } from '@/config/api';

interface TestUploadFormData {
  testName: string;
  testType: string;
  description: string;
  patientId: string;
  doctorId: string;
  testDate: string;
  notes: string;
  pdfFile: File | null;
}

const TestResultUpload = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<TestUploadFormData>({
    testName: '',
    testType: '',
    description: '',
    patientId: '',
    doctorId: '',
    testDate: '',
    notes: '',
    pdfFile: null
  });

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [doctorInputType, setDoctorInputType] = useState<'select' | 'text'>('select');
  const [availablePatients, setAvailablePatients] = useState<Array<{
    id: string;
    name: string;
    email: string;
  }>>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Array<{
    id: string;
    name: string;
    specialization: string;
  }>>([]);

  const testTypes = [
    'Blood Test',
    'Urine Test',
    'X-Ray',
    'CT Scan',
    'MRI',
    'Ultrasound',
    'ECG',
    'Echo',
    'Pathology',
    'Microbiology',
    'Biochemistry',
    'Hematology'
  ];

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      // Fetch patients
      const patientsResponse = await apiCall(API_CONFIG.USERS.PATIENTS, {
        method: 'GET'
      });
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setAvailablePatients(patientsData);
      }

      // Fetch doctors
      const doctorsResponse = await apiCall(API_CONFIG.USERS.DOCTORS, {
        method: 'GET'
      });
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setAvailableDoctors(doctorsData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleInputChange = (field: keyof TestUploadFormData, value: string) => {
    // Handle the "none" value for doctor selection
    if (field === 'doctorId' && value === 'none') {
      setFormData(prev => ({ ...prev, [field]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setMessage('Please select a PDF file only.');
        setUploadStatus('error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setMessage('File size must be less than 10MB.');
        setUploadStatus('error');
        return;
      }
      setFormData(prev => ({ ...prev, pdfFile: file }));
      setUploadStatus('idle');
      setMessage('');
    }
  };

  const sendTestUploadNotifications = async (doctorId: string, patientId: string, testName: string, testType: string) => {
    try {
      // Create notifications for both doctor and patient
      const notifications = [
        {
          recipientId: doctorId,
          recipientType: 'DOCTOR',
          message: `New ${testType} test result uploaded for patient. Test: ${testName}`,
          type: 'TEST_UPLOAD'
        },
        {
          recipientId: patientId,
          recipientType: 'PATIENT', 
          message: `Your ${testType} test result has been uploaded and is ready for review. Test: ${testName}`,
          type: 'TEST_UPLOAD'
        }
      ];

      // Send notifications via API (this would be implemented on the backend)
      for (const notification of notifications) {
        try {
          await apiCall('/api/notifications', {
            method: 'POST',
            body: JSON.stringify(notification)
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }
      
      // For now, we'll use local storage to simulate real-time notifications
      // This is a simple implementation - in production, you'd use WebSockets or Server-Sent Events
      const existingNotifications = JSON.parse(localStorage.getItem('testUploadNotifications') || '[]');
      const newNotifications = notifications.map(notif => ({
        ...notif,
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        read: false
      }));
      
      localStorage.setItem('testUploadNotifications', JSON.stringify([...existingNotifications, ...newNotifications]));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('testUploadNotification', { 
        detail: { notifications: newNotifications } 
      }));
      
    } catch (error) {
      console.error('Error sending test upload notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pdfFile) {
      setMessage('Please select a PDF file.');
      setUploadStatus('error');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');

    try {
      const token = sessionStorage.getItem('token');
      const uploadFormData = new FormData();
      
      uploadFormData.append('testName', formData.testName);
      uploadFormData.append('testType', formData.testType);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('patientId', formData.patientId);
      
      // Doctor ID validation based on input type
      if (doctorInputType === 'select' && formData.doctorId && formData.doctorId !== 'none') {
        // Check if doctorId exists in availableDoctors when using select mode
        const doctorExists = availableDoctors.some(doc => doc.id === formData.doctorId);
        if (!doctorExists) {
          setUploadStatus('error');
          setMessage(`Doctor not found with ID: ${formData.doctorId}`);
          setUploading(false);
          return;
        }
        uploadFormData.append('doctorId', formData.doctorId);
        console.log('Sending doctor ID (select mode):', formData.doctorId);
      } else if (doctorInputType === 'text' && formData.doctorId) {
        // If user typed a custom doctor value, still send as doctorId but backend should handle it as custom text
        const cleanDoctorId = formData.doctorId.trim();
        uploadFormData.append('doctorId', cleanDoctorId);
        console.log('Original doctorId:', formData.doctorId);
        console.log('Cleaned doctorId:', cleanDoctorId);
        console.log('Sending custom doctor name (text mode):', cleanDoctorId);
      }
      
      console.log('Doctor input type:', doctorInputType);
      console.log('Form data doctorId:', formData.doctorId);
      
      uploadFormData.append('pdfFile', formData.pdfFile);
      
      if (formData.testDate) {
        // Convert to LocalDateTime format (ISO without 'Z' suffix)
        const testDateTime = new Date(formData.testDate);
        const localISOString = new Date(testDateTime.getTime() - testDateTime.getTimezoneOffset() * 60000)
          .toISOString().slice(0, -1); // Remove 'Z' suffix
        uploadFormData.append('testDate', localISOString);
      }
      if (formData.notes) {
        uploadFormData.append('notes', formData.notes);
      }

      const response = await fetch(API_CONFIG.TEST_RESULTS.UPLOAD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setMessage('Test result uploaded successfully!');
        
        // Send notifications only if doctor ID is provided and valid
        if (formData.doctorId && formData.patientId) {
          await sendTestUploadNotifications(formData.doctorId, formData.patientId, formData.testName, formData.testType);
        }
        
        // Reset form
        setFormData({
          testName: '',
          testType: '',
          description: '',
          patientId: '',
          doctorId: '',
          testDate: '',
          notes: '',
          pdfFile: null
        });
        setDoctorInputType('select');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadStatus('error');
        setMessage(result.error || 'Upload failed. Please try again.');
      }
    } catch (error) {
      setUploadStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-5xl mx-auto border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl shadow-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">Upload Test Result</CardTitle>
              <CardDescription className="text-indigo-100 text-sm">
                Upload a PDF test result for a patient. All fields marked with * are required.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Status Message */}
            {message && (
              <div className={`flex items-center gap-3 p-4 rounded-xl shadow-md ${
                uploadStatus === 'success' 
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200'
              }`}>
                {uploadStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{message}</span>
              </div>
            )}

            {/* Test Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                Test Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Test Name */}
                <div className="space-y-2">
                  <Label htmlFor="testName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Test Name *
                  </Label>
                  <Input
                    id="testName"
                    value={formData.testName}
                    onChange={(e) => handleInputChange('testName', e.target.value)}
                    placeholder="e.g., Complete Blood Count"
                    required
                    className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-200 bg-white shadow-sm"
                  />
                </div>

                {/* Test Type */}
                <div className="space-y-2">
                  <Label htmlFor="testType" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Test Type *
                  </Label>
                  <Select 
                    value={formData.testType} 
                    onValueChange={(value) => handleInputChange('testType', value)}
                  >
                    <SelectTrigger className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-200 bg-white shadow-sm">
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      {testTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Patient & Doctor Information Section */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 shadow-sm">
              <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Patient & Doctor Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient ID */}
                <div className="space-y-2">
                  <Label htmlFor="patientId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Patient ID *
                  </Label>
                  <Select value={formData.patientId} onValueChange={(value) => handleInputChange('patientId', value)}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200 bg-white shadow-sm">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePatients.length === 0 ? (
                        <SelectItem value="no-patients" disabled>No patients available</SelectItem>
                      ) : (
                        availablePatients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} ({patient.id})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Doctor ID - Flexible Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doctorId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      Doctor (Optional)
                    </Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDoctorInputType('select')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          doctorInputType === 'select' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoctorInputType('text')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          doctorInputType === 'text' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        Type
                      </button>
                    </div>
                  </div>
                  
                  {doctorInputType === 'select' ? (
                    <Select 
                      value={formData.doctorId || 'none'} 
                      onValueChange={(value) => handleInputChange('doctorId', value)}
                    >
                      <SelectTrigger className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200 bg-white shadow-sm">
                        <SelectValue placeholder="Select doctor (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No doctor selected</SelectItem>
                        {availableDoctors.length === 0 ? (
                          <SelectItem value="no-doctors" disabled>No doctors available</SelectItem>
                        ) : (
                          availableDoctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} ({doctor.id}) - {doctor.specialization}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="doctorId"
                      value={formData.doctorId}
                      onChange={(e) => handleInputChange('doctorId', e.target.value)}
                      placeholder="Enter doctor name or ID"
                      className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200 bg-white shadow-sm"
                    />
                  )}
                  <p className="text-xs text-gray-500">
                    Choose from available doctors or type custom doctor information
                  </p>
                </div>
              </div>
            </div>

            {/* Test Details Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Test Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Test Date */}
                <div className="space-y-2">
                  <Label htmlFor="testDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    Test Date
                  </Label>
                  <Input
                    id="testDate"
                    type="datetime-local"
                    value={formData.testDate}
                    onChange={(e) => handleInputChange('testDate', e.target.value)}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-200 bg-white shadow-sm"
                  />
                </div>

                {/* PDF File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="pdfFile" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    PDF Report *
                  </Label>
                  <div className="space-y-2">
                    <Input
                      id="pdfFile"
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      className="border-amber-200 focus:border-amber-500 focus:ring-amber-200 bg-white shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                    />
                    {formData.pdfFile && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200 shadow-sm">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <FileText className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{formData.pdfFile.name}</p>
                          <p className="text-xs text-gray-500">Size: {(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          PDF
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Notes Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 shadow-sm">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Additional Information
              </h3>
              <div className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the test..."
                    rows={3}
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-200 bg-white shadow-sm resize-none"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional notes or instructions..."
                    rows={3}
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-200 bg-white shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={uploading} 
                className="min-w-48 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Test Result
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestResultUpload;
