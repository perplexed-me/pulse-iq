import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
    setFormData(prev => ({ ...prev, [field]: value }));
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
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      
      uploadFormData.append('testName', formData.testName);
      uploadFormData.append('testType', formData.testType);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('patientId', formData.patientId);
      uploadFormData.append('doctorId', formData.doctorId);
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Test Result
        </CardTitle>
        <CardDescription>
          Upload a PDF test result for a patient. All fields marked with * are required.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Message */}
          {message && (
            <div className={`flex items-center gap-2 p-4 rounded-md ${
              uploadStatus === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {uploadStatus === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test Name */}
            <div>
              <Label htmlFor="testName">Test Name *</Label>
              <Input
                id="testName"
                value={formData.testName}
                onChange={(e) => handleInputChange('testName', e.target.value)}
                placeholder="e.g., Complete Blood Count"
                required
              />
            </div>

            {/* Test Type */}
            <div>
              <Label htmlFor="testType">Test Type *</Label>
              <Select 
                value={formData.testType} 
                onValueChange={(value) => handleInputChange('testType', value)}
              >
                <SelectTrigger>
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

            {/* Patient ID */}
            <div>
              <Label htmlFor="patientId">Patient ID *</Label>
              <Select value={formData.patientId} onValueChange={(value) => handleInputChange('patientId', value)}>
                <SelectTrigger>
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

            {/* Doctor ID */}
            <div>
              <Label htmlFor="doctorId">Doctor ID *</Label>
              <Select value={formData.doctorId} onValueChange={(value) => handleInputChange('doctorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            {/* Test Date */}
            <div>
              <Label htmlFor="testDate">Test Date</Label>
              <Input
                id="testDate"
                type="datetime-local"
                value={formData.testDate}
                onChange={(e) => handleInputChange('testDate', e.target.value)}
              />
            </div>

            {/* PDF File Upload */}
            <div>
              <Label htmlFor="pdfFile">PDF Report *</Label>
              <div className="mt-1">
                <Input
                  id="pdfFile"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                {formData.pdfFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{formData.pdfFile.name}</span>
                    <Badge variant="secondary">
                      {(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the test..."
              rows={3}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes or instructions..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={uploading} className="min-w-32">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Test Result
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TestResultUpload;
