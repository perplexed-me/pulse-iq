import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Phone, UserPlus } from 'lucide-react';
import { API_CONFIG } from '@/config/api';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
    // Patient specific fields
    age: '',
    gender: '',
    bloodGroup: '',
    // Doctor specific fields
    specialization: '',
    degree: '',
    licenseNumber: '',
    // Technician specific fields (uses specialization from doctor fields)
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.role || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Role-specific validation
    if (formData.role === 'patient') {
      if (!formData.age || !formData.gender) {
        toast({
          title: "Error",
          description: "Age and gender are required for patient registration",
          variant: "destructive"
        });
        return;
      }
    } else if (formData.role === 'doctor') {
      if (!formData.specialization || !formData.degree || !formData.licenseNumber) {
        toast({
          title: "Error",
          description: "Specialization, degree, and license number are required for doctor registration",
          variant: "destructive"
        });
        return;
      }
    } else if (formData.role === 'technician') {
      if (!formData.specialization) {
        toast({
          title: "Error",
          description: "Specialization is required for technician registration",
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // Prepare the registration data based on role
      let registrationData;
      let endpoint;

      if (formData.role === 'patient') {
        registrationData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          age: parseInt(formData.age),
          gender: formData.gender,
          bloodGroup: formData.bloodGroup || null
        };
        endpoint = API_CONFIG.AUTH.REGISTER_PATIENT;
      } else if (formData.role === 'doctor') {
        registrationData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          specialization: formData.specialization,
          degree: formData.degree,
          licenseNumber: formData.licenseNumber,
          assistantName: null,
          assistantNumber: null,
          consultationFee: null
        };
        endpoint = API_CONFIG.AUTH.REGISTER_DOCTOR;
      } else if (formData.role === 'technician') {
        registrationData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          specialization: formData.specialization
        };
        endpoint = API_CONFIG.AUTH.REGISTER_TECHNICIAN;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Registration failed');
      }
      
      if(formData.role!== 'patient'){
        toast({
          title: "Registration Successful",
          description: "Your account has been created and is pending approval.",
        });
      }
      else{
        toast({
          title: "Registration Successful",
        });
      }
      navigate('/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-sky-600 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Join PulseIQ</CardTitle>
          <CardDescription>Create your healthcare management account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Patient-specific fields */}
            {formData.role === 'patient' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => handleInputChange('bloodGroup', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A_POSITIVE">A+</SelectItem>
                      <SelectItem value="A_NEGATIVE">A-</SelectItem>
                      <SelectItem value="B_POSITIVE">B+</SelectItem>
                      <SelectItem value="B_NEGATIVE">B-</SelectItem>
                      <SelectItem value="AB_POSITIVE">AB+</SelectItem>
                      <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
                      <SelectItem value="O_POSITIVE">O+</SelectItem>
                      <SelectItem value="O_NEGATIVE">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Doctor-specific fields */}
            {formData.role === 'doctor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g., Cardiology"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree *</Label>
                  <Input
                    id="degree"
                    placeholder="e.g., MBBS, MD"
                    value={formData.degree}
                    onChange={(e) => handleInputChange('degree', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                    id="licenseNumber"
                    placeholder="Medical license number"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Technician-specific fields */}
            {formData.role === 'technician' && (
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  placeholder="e.g., Radiology, Laboratory"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sky-600 hover:text-sky-700 font-medium"
              >
                Sign in here
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;