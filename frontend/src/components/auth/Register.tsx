import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, UserPlus, ArrowLeft, User, Stethoscope, Heart, Shield, Lock, Eye, EyeOff, Activity, FileText, Plus, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG, apiCall } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  confirmPassword: string;
  // Patient-specific fields
  age: string;
  gender: string;
  bloodGroup: string;
  // Doctor-specific fields
  specialization: string;
  degree: string;
  licenseNumber: string;
  consultationFee: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
    // Patient-specific fields
    age: '',
    gender: '',
    bloodGroup: '',
    // Doctor-specific fields
    specialization: '',
    degree: '',
    licenseNumber: '',
    consultationFee: ''
  });

  // Clear form data when component unmounts for security
  useEffect(() => {
    // Create animated particles
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 10 + 3,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: (Math.random() - 0.5) * 1.5,
          opacity: Math.random() * 0.8 + 0.2,
          color: ['sky', 'blue', 'cyan', 'indigo', 'purple', 'emerald', 'pink', 'amber'][Math.floor(Math.random() * 8)]
        });
      }
      setParticles(newParticles);
    };

    // Animate particles
    const animateParticles = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + particle.speedX;
          let newY = particle.y + particle.speedY;
          
          // Wrap around screen edges
          if (newX > 100) newX = 0;
          if (newX < 0) newX = 100;
          if (newY > 100) newY = 0;
          if (newY < 0) newY = 100;
          
          return {
            ...particle,
            x: newX,
            y: newY
          };
        })
      );
    };

    createParticles();
    const particleInterval = setInterval(animateParticles, 25);

    return () => {
      clearInterval(particleInterval);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        password: '',
        confirmPassword: '',
        age: '',
        gender: '',
        bloodGroup: '',
        specialization: '',
        degree: '',
        licenseNumber: '',
        consultationFee: ''
      });
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Please ensure both passwords match",
        variant: "destructive"
      });
      return;
    }

    // Role-specific validation
    if (formData.role === 'patient') {
      if (!formData.age || !formData.gender) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required patient information",
          variant: "destructive"
        });
        return;
      }
    } else if (formData.role === 'doctor') {
      if (!formData.specialization || !formData.degree || !formData.licenseNumber || !formData.consultationFee) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required doctor information",
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
          consultationFee: parseFloat(formData.consultationFee)
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

      if (response.ok) {
        if (formData.role === 'patient') {
          // For patients, try to auto-login using AuthContext
          const loginResult = await login({
            identifier: formData.email,
            password: formData.password,
          });

          if (loginResult.success) {
            // Clear form data to prevent autofill for next user
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              role: '',
              password: '',
              confirmPassword: '',
              age: '',
              gender: '',
              bloodGroup: '',
              specialization: '',
              degree: '',
              licenseNumber: '',
              consultationFee: ''
            });
            
            toast({
              title: "Welcome to PulseIQ!",
              description: "Registration successful. You are now logged in.",
            });
            
            navigate('/patient/dashboard');
          } else {
            // Clear sensitive data even on failed auto-login
            setFormData(prev => ({
              ...prev,
              password: '',
              confirmPassword: ''
            }));
            
            toast({
              title: "Registration Successful",
              description: "Please log in to access your dashboard.",
            });
            navigate('/login');
          }
        } else {
          // For doctors and technicians, redirect to login with success message
          const result = await response.json();
          
          // Clear form data to prevent autofill for next user
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            role: '',
            password: '',
            confirmPassword: '',
            age: '',
            gender: '',
            bloodGroup: '',
            specialization: '',
            degree: '',
            licenseNumber: '',
            consultationFee: ''
          });
          
          toast({
            title: "Registration Successful",
            description: "Your account has been created and is pending admin approval",
          });
          
          navigate('/login');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
    } catch (error: unknown) {
      // Clear sensitive data on error
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              backgroundColor: `hsl(${particle.color === 'sky' ? '200' : particle.color === 'blue' ? '220' : particle.color === 'cyan' ? '180' : particle.color === 'indigo' ? '240' : particle.color === 'purple' ? '270' : particle.color === 'emerald' ? '150' : particle.color === 'pink' ? '330' : '45'}, 70%, 70%)`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(0.5px)',
              transition: 'all 0.025s linear'
            }}
          />
        ))}

        {/* Floating Medical Icons */}
        <div className="absolute top-20 left-10 text-blue-200 animate-bounce">
          <Heart className="w-8 h-8" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        </div>
        <div className="absolute top-32 right-16 text-sky-200 animate-bounce">
          <Stethoscope className="w-10 h-10" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        </div>
        <div className="absolute bottom-40 left-20 text-purple-200 animate-bounce">
          <Shield className="w-6 h-6" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
        </div>
        <div className="absolute bottom-20 right-32 text-emerald-200 animate-bounce">
          <Activity className="w-8 h-8" style={{ animationDelay: '0.5s', animationDuration: '3.2s' }} />
        </div>
        <div className="absolute top-40 left-1/2 text-indigo-200 animate-bounce">
          <Users className="w-7 h-7" style={{ animationDelay: '1.5s', animationDuration: '3.8s' }} />
        </div>
        <div className="absolute bottom-60 right-20 text-pink-200 animate-bounce">
          <FileText className="w-6 h-6" style={{ animationDelay: '2.5s', animationDuration: '3.3s' }} />
        </div>

        {/* Rotating Plus Signs */}
        <div className="absolute top-16 right-1/4 text-cyan-200 animate-spin">
          <Plus className="w-5 h-5" style={{ animationDuration: '8s' }} />
        </div>
        <div className="absolute bottom-32 left-1/3 text-amber-200 animate-spin">
          <Plus className="w-4 h-4" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
        </div>
        <div className="absolute top-1/2 right-10 text-violet-200 animate-spin">
          <Plus className="w-6 h-6" style={{ animationDuration: '10s' }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl relative z-10">
        <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/95">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-end mb-6">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 text-white hover:bg-white/20 hover:text-white border-white/30 border transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Button>
              </div>
              <div className="flex flex-col items-center text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Join PulseIQ
                </h1>
                <p className="text-blue-100 text-lg">Your healthcare journey starts here</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6" autoComplete="off" noValidate>
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                    First Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      placeholder="Enter your first name"
                      autoComplete="off"
                      autoFocus={false}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                    Last Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      placeholder="Enter your last name"
                      autoComplete="off"
                      autoFocus={false}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    placeholder="Enter your email address"
                    autoComplete="off"
                    autoFocus={false}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Phone Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10 h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Select Your Role</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'patient', label: 'Patient', icon: Heart, color: 'from-red-500 to-pink-500', description: 'Receive healthcare services' },
                  { value: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'from-green-500 to-emerald-500', description: 'Provide medical expertise' },
                  { value: 'technician', label: 'Technician', icon: Shield, color: 'from-blue-500 to-cyan-500', description: 'Support healthcare operations' }
                ].map(({ value, label, icon: Icon, color, description }) => (
                  <div
                    key={value}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all duration-300 ${
                      formData.role === value
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleInputChange('role', value)}
                  >
                    <div className="p-4 text-center">
                      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">{label}</h3>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={formData.role === value}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="absolute top-4 right-4"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Role-specific fields */}
            {formData.role === 'patient' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Patient Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-semibold text-gray-700">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      placeholder="Enter your age"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300">
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
                  <Label htmlFor="bloodGroup" className="text-sm font-semibold text-gray-700">Blood Group *</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => handleInputChange('bloodGroup', value)}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300">
                      <SelectValue placeholder="Select blood group" />
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
              </div>
            )}

            {formData.role === 'doctor' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Doctor Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="text-sm font-semibold text-gray-700">Specialization *</Label>
                    <Input
                      id="specialization"
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      className="h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      placeholder="Enter your specialization"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="degree" className="text-sm font-semibold text-gray-700">Degree *</Label>
                      <Input
                        id="degree"
                        type="text"
                        value={formData.degree}
                        onChange={(e) => handleInputChange('degree', e.target.value)}
                        className="h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                        placeholder="Enter your degree"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber" className="text-sm font-semibold text-gray-700">License Number *</Label>
                      <Input
                        id="licenseNumber"
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                        className="h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                        placeholder="Enter license number"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="consultationFee" className="text-sm font-semibold text-gray-700">Consultation Fee *</Label>
                    <Input
                      id="consultationFee"
                      type="number"
                      step="0.01"
                      value={formData.consultationFee}
                      onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                      className="h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      placeholder="Enter consultation fee"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.role === 'technician' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Technician Information</h2>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm font-semibold text-gray-700">Specialization *</Label>
                  <Input
                    id="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    className="h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    placeholder="Enter your specialization"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Security</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      placeholder="Enter your password"
                      autoComplete="new-password"
                      autoFocus={false}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {/* {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} */}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pl-10 pr-10 h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      autoFocus={false}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {/* {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} */}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </div>
                )}
              </Button>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;