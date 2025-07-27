import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, FileText, User, LogOut, Clock, Edit2, Save, X, MessageSquare, Bot, Plus, Home, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PatientTestResults from '../TestResults/PatientTestResults';
import AppointmentList from '../appointments/AppointmentList';
import PrescriptionList from '../prescriptions/PrescriptionList';
import NotificationDropdown from '../ui/NotificationDropdown';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, apiCall } from '@/config/api';

interface TestResult {
  testId: number;
  testName: string;
  testType: string;
  testDate: string;
  status: string;
}

interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  bloodGroup: string | null;
  email: string;
  phone: string;
}

interface UpcomingAppointment {
  appointmentId: number;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  status: string;
}

const PatientDashboard = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('dashboard');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);

  // Add custom styles for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-10px) rotate(1deg); }
        66% { transform: translateY(5px) rotate(-1deg); }
      }
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      .animation-delay-1000 {
        animation-delay: 1s;
      }
      .animation-delay-2000 {
        animation-delay: 2s;
      }
      .animation-delay-3000 {
        animation-delay: 3s;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTestResults();
    fetchProfileData();
    fetchUpcomingAppointments();

    // Set up auto-refresh for appointments every 30 seconds
    const interval = setInterval(() => {
      fetchUpcomingAppointments();
    }, 5000);
    
    setRefreshInterval(interval);

    // Cleanup interval on component unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Cleanup interval when component unmounts
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

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

  const fetchProfileData = async () => {
    try {
      console.log('Fetching profile data...');
      
      const response = await apiCall(API_CONFIG.AUTH.PROFILE, {
        method: 'GET'
      });

      console.log('Profile response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        setProfileData(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch profile data:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await apiCall(API_CONFIG.APPOINTMENTS.UPCOMING, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setUpcomingAppointments(data);
      } else {
        console.error('Failed to fetch upcoming appointments');
      }
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
    }
  };

  // Get the most recent test type
  const getLastTestType = () => {
    if (testResults.length === 0) return 'No tests';
    const sortedTests = [...testResults].sort((a, b) => 
      new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
    );
    return sortedTests[0].testType;
  };

  // Get the number of lab results
  const getLabResultsCount = () => {
    return testResults.length;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    console.log('=== PROFILE CARD CLICKED ===');
    console.log('Profile data:', profileData);
    
    if (profileData) {
      console.log('Profile data exists, opening dialog');
      setEditedProfile({ ...profileData });
      setIsProfileDialogOpen(true);
    } else {
      console.log('No profile data available, fetching...');
      toast({
        title: "Loading Profile",
        description: "Fetching your profile data...",
      });
      fetchProfileData().then(() => {
        console.log('After fetch, profile data:', profileData);
        if (profileData) {
          setEditedProfile({ ...profileData });
          setIsProfileDialogOpen(true);
        } else {
          toast({
            title: "Error",
            description: "Failed to load profile data",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && profileData) {
      setEditedProfile({ ...profileData });
    }
  };

  const handleProfileSave = async () => {
    if (!editedProfile) return;

    try {
      const response = await apiCall(API_CONFIG.AUTH.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(editedProfile)
      });

      if (response.ok) {
        setProfileData(editedProfile);
        setIsEditing(false);
        // Update the user context immediately
        updateUserProfile({
          name: editedProfile.firstName && editedProfile.lastName 
            ? `${editedProfile.firstName} ${editedProfile.lastName}` 
            : editedProfile.firstName || editedProfile.lastName || user?.name,
          email: editedProfile.email,
          phone: editedProfile.phone
        });
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-200/30 rounded-full animate-float animation-delay-0"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-200/30 rounded-full animate-float animation-delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-200/30 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 w-18 h-18 bg-emerald-300/30 rounded-full animate-float animation-delay-3000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-emerald-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-green-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  PulseIQ - Patient Portal
                </h1>
                <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
              </div>
            </div>
              <div className="flex items-center gap-4">
                {/* Single Notification Dropdown */}
                <div className="relative">
                  <NotificationDropdown />
                </div>
                
                {/* Navigation Buttons with Enhanced Design */}
                <div className="hidden md:flex items-center gap-2">
                  <Button 
                    onClick={() => setActiveView('dashboard')} 
                    variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                    size="sm"
                    className={activeView === 'dashboard' ? 
                      'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300' : 
                      'hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200'
                    }
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    onClick={() => setActiveView('appointments')} 
                    variant={activeView === 'appointments' ? 'default' : 'ghost'}
                    size="sm"
                    className={activeView === 'appointments' ? 
                      'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300' : 
                      'hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200'
                    }
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Appointments
                  </Button>
                  <Button 
                    onClick={() => setActiveView('test-results')} 
                    variant={activeView === 'test-results' ? 'default' : 'ghost'}
                    size="sm"
                    className={activeView === 'test-results' ? 
                      'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300' : 
                      'hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200'
                    }
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Test Results
                  </Button>
                  <Button 
                    onClick={() => setActiveView('prescriptions')} 
                    variant={activeView === 'prescriptions' ? 'default' : 'ghost'}
                    size="sm"
                    className={activeView === 'prescriptions' ? 
                      'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300' : 
                      'hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200'
                    }
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Prescriptions
                  </Button>
                </div>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeView === 'dashboard' ? (
          <>
            {/* Welcome Section with Enhanced Design */}
            <div className="mb-8 text-center">
              <div className="relative inline-block">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  Welcome back, {user?.name}! ✨
                </h2>
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-lg blur opacity-25"></div>
              </div>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
                Manage your healthcare and stay connected with your care team through our comprehensive portal.
              </p>
            </div>

            {/* Quick Stats with Enhanced Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-800">Next Appointment</p>
                      <p className="text-lg font-bold text-blue-900">
                        {upcomingAppointments.length > 0 
                          ? new Date(upcomingAppointments[0].appointmentDate).toLocaleDateString()
                          : 'Not scheduled'
                        }
                      </p>
                      {upcomingAppointments.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {new Date(upcomingAppointments[0].appointmentDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-xl shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-800">Lab Results</p>
                      <p className="text-lg font-bold text-green-900">
                        {loading ? (
                          <div className="animate-pulse bg-green-200 h-6 w-12 rounded"></div>
                        ) : (
                          getLabResultsCount()
                        )}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Available for review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group" 
                onClick={handleProfileClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-800">Profile</p>
                      <button 
                        className="text-lg font-bold text-yellow-900 hover:text-orange-600 transition-colors duration-200 cursor-pointer group-hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick();
                        }}
                      >
                        View Details ➜
                      </button>
                      <p className="text-xs text-yellow-600 mt-1">Manage your information</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Content with Enhanced Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
                  <CardTitle className="text-gray-800 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Upcoming Appointments
                  </CardTitle>
                  <CardDescription className="text-gray-600">Your scheduled healthcare visits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.appointmentId} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg bg-gradient-to-r from-blue-50/50 to-transparent hover:from-blue-50 hover:to-blue-50/30 transition-all duration-200">
                        <div>
                          <p className="font-semibold text-gray-800">Dr. {appointment.doctorName}</p>
                          <p className="text-sm text-gray-600">{appointment.doctorSpecialization}</p>
                          <p className="text-sm text-blue-600 font-medium">
                            📅 {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                            {new Date(appointment.appointmentDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                          {appointment.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-gray-500 font-medium">No upcoming appointments scheduled</p>
                      <p className="text-sm text-gray-400 mt-2">Book an appointment to see it here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-lg">
                  <CardTitle className="text-gray-800 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-emerald-600" />
                    Health Actions
                  </CardTitle>
                  <CardDescription className="text-gray-600">Manage your healthcare needs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                    onClick={() => navigate('/book-appointment')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book New Appointment
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                    onClick={() => setActiveView('appointments')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View All Appointments
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                    onClick={() => setActiveView('test-results')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Test Results
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                    onClick={() => setActiveView('prescriptions')}
                  >
                    <Pill className="w-4 h-4 mr-2" />
                    View Prescriptions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : activeView === 'appointments' ? (
          <AppointmentList userRole="patient" />
        ) : activeView === 'prescriptions' ? (
          <PrescriptionList userRole="patient" />
        ) : (
          <PatientTestResults />
        )}

        {/* Enhanced Profile Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 border-2 border-emerald-200 shadow-2xl">
            <DialogHeader className="bg-gradient-to-r from-emerald-50 to-green-50 -m-6 mb-6 p-6 rounded-t-lg border-b border-emerald-100">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent flex items-center">
                <User className="w-6 h-6 mr-3 text-emerald-600" />
                Patient Profile
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                View and manage your profile information with ease.
              </DialogDescription>
            </DialogHeader>

            {profileData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Label htmlFor="patientId" className="text-sm font-semibold text-gray-700">Patient ID</Label>
                    <Input
                      id="patientId"
                      value={profileData.userId || ''}
                      disabled={true}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 font-mono text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name</Label>
                    <Input
                      id="firstName"
                      value={isEditing ? (editedProfile?.firstName || '') : (profileData.firstName || '')}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? 
                        "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500" : 
                        "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                      }
                    />
                  </div>

                  <div className="relative">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name</Label>
                    <Input
                      id="lastName"
                      value={isEditing ? (editedProfile?.lastName || '') : (profileData.lastName || '')}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? 
                        "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500" : 
                        "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                      }
                    />
                  </div>

                  <div className="relative">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                    <Input
                      id="email"
                      value={isEditing ? (editedProfile?.email || '') : (profileData.email || '')}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? 
                        "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500" : 
                        "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                      }
                    />
                  </div>

                  <div className="relative">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone</Label>
                    <Input
                      id="phone"
                      value={isEditing ? (editedProfile?.phone || '') : (profileData.phone || '')}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? 
                        "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500" : 
                        "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Label htmlFor="age" className="text-sm font-semibold text-gray-700">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={isEditing ? (editedProfile?.age || '') : (profileData.age || '')}
                      onChange={(e) => handleInputChange('age', Number(e.target.value))}
                      disabled={!isEditing}
                      className={isEditing ? 
                        "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500" : 
                        "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                      }
                    />
                  </div>

                  <div className="relative">
                    <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">Gender</Label>
                    {isEditing ? (
                      <Select
                        value={editedProfile?.gender || ''}
                        onValueChange={(value) => handleInputChange('gender', value)}
                      >
                        <SelectTrigger className="border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="gender"
                        value={profileData.gender || ''}
                        disabled={true}
                        className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                      />
                    )}
                  </div>

                  <div className="relative">
                    <Label htmlFor="bloodGroup" className="text-sm font-semibold text-gray-700">Blood Group</Label>
                    {isEditing ? (
                      <Select
                        value={editedProfile?.bloodGroup || ''}
                        onValueChange={(value) => handleInputChange('bloodGroup', value)}
                      >
                        <SelectTrigger className="border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500">
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
                    ) : (
                      <Input
                        id="bloodGroup"
                        value={profileData.bloodGroup || 'Not specified'}
                        disabled={true}
                        className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {!profileData && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading profile data...</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsProfileDialogOpen(false);
                  setIsEditing(false);
                }}
                className="border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              {profileData && (
                <>
                  <Button 
                    onClick={handleEditToggle} 
                    variant="outline"
                    className={isEditing ? 
                      "border-red-300 text-red-600 hover:bg-red-50 transition-colors duration-200" : 
                      "border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                    }
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Update Profile
                      </>
                    )}
                  </Button>
                  {isEditing && (
                    <Button 
                      onClick={handleProfileSave}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
      
      {/* Enhanced AI Health Assistant Section */}
      <Card className="mt-6 mx-4 sm:mx-6 lg:mx-8 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 border-0 shadow-xl overflow-hidden relative">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gray-100 rounded-full"></div>
        </div>
        
        <CardContent className="p-4 relative z-10">
          <div className="flex flex-col items-center gap-3 w-full max-w-xl mx-auto text-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-white/20 rounded-xl blur-sm"></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-2 rounded-xl border border-white/20">
                <Bot className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white mb-1">
                PulseIQ Health Assistant
              </h3>
              <p className="text-sm text-blue-100 leading-relaxed">
                Get instant health insights and recommendations. Ask about symptoms, conditions, and get helpful guidance 24/7.
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/health-chat')}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 group"
              size="sm"
            >
              <MessageSquare className="h-4 w-4 mr-2 group-hover:animate-bounce" />
              Start Health Chat ✨
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;
