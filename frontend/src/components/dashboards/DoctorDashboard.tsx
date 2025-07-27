import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Calendar, Clock, User, LogOut, Edit2, Save, X, Pill, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DoctorProfilePicture from '../DoctorProfilePicture';
import AppointmentList from '../appointments/AppointmentList';
import DoctorPatientList from './DoctorPatientList';
import NotificationDropdown from '../ui/NotificationDropdown';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, apiCall } from '@/config/api';

interface TestResult {
  testId: number;
  testName: string;
  testType: string;
  testDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'CANCELLED';
}

interface DoctorProfile {
  doctorId: string;
  firstName: string;
  lastName: string;
  degree: string;
  specialization: string;
  licenseNumber: string;
  consultationFee: number;
  email: string;
  phone: string;
  availableDays: string;
  availableTimeStart: string;
  availableTimeEnd: string;
}

interface UpcomingAppointment {
  appointmentId: number;
  patientName: string;
  appointmentDate: string;
  reason?: string;
  status: string;
}

const DoctorDashboard = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('dashboard');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<DoctorProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<DoctorProfile | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
  const [totalFuturePatients, setTotalFuturePatients] = useState(0);

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

  useEffect(() => {
    if (user?.id) {
      setProfilePictureUrl(`/api/doctors/${user.id}/profile-picture`);
      fetchProfileData();
      fetchUpcomingAppointments();
      fetchAppointmentStats();
      console.log('DoctorDashboard: user.id =', user.id);
      console.log('DoctorDashboard: profilePictureUrl =', `/api/doctors/${user.id}/profile-picture`);

      // Set up auto-refresh for appointments every 30 seconds
      const interval = setInterval(() => {
        fetchUpcomingAppointments();
        fetchAppointmentStats();
      }, 5000);
      
      setRefreshInterval(interval);

      // Cleanup interval on component unmount
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cleanup interval when component unmounts
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const fetchProfileData = async () => {
    try {
      const response = await apiCall(API_CONFIG.DOCTORS.PROFILE(user?.id || ''), {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setEditedProfile(data);
      } else {
        console.error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
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

  const fetchAppointmentStats = async () => {
    try {
      const response = await apiCall(API_CONFIG.DOCTORS.APPOINTMENT_STATS(user?.id || ''), {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setTodayAppointmentsCount(data.todayAppointments);
        setTotalFuturePatients(data.totalFuturePatients);
      } else {
        console.error('Failed to fetch appointment stats');
      }
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    try {
      console.log('=== SAVING PROFILE UPDATE ===');
      console.log('Edited profile data being sent:', editedProfile);
      console.log('Specialization being sent:', editedProfile.specialization);
      console.log('Degree being sent:', editedProfile.degree);
      
      const response = await apiCall(API_CONFIG.DOCTORS.PROFILE(user?.id || ''), {
        method: 'PUT',
        body: JSON.stringify(editedProfile)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        console.log('Updated profile received from backend:', updatedProfile);
        console.log('Updated specialization:', updatedProfile.specialization);
        console.log('Updated degree:', updatedProfile.degree);
        
        setProfileData(updatedProfile);
        setEditedProfile(updatedProfile);
        setIsEditing(false);
        // Update the user context immediately
        updateUserProfile({
          name: updatedProfile.firstName && updatedProfile.lastName 
            ? `${updatedProfile.firstName} ${updatedProfile.lastName}` 
            : updatedProfile.firstName || updatedProfile.lastName || user?.name,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          specialization: updatedProfile.specialization,
          degree: updatedProfile.degree
        });
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        console.error('Profile update failed, status:', response.status);
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profileData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const refreshProfilePicture = () => {
    if (user?.id) {
      setProfilePictureUrl(`/api/doctors/${user.id}/profile-picture?${Date.now()}`);
    }
  };

  // Remove 'Pending Reviews' from stats
  const stats = [
    { title: "Today's Appointments", value: todayAppointmentsCount.toString(), icon: Calendar, color: 'bg-green-500' },
    { title: "Appointments After Today", value: totalFuturePatients.toString(), icon: Users, color: 'bg-green-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full animate-float animation-delay-0"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-cyan-200/30 rounded-full animate-float animation-delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-200/30 rounded-full animate-float animation-delay-2000"></div>
      <div className="absolute bottom-40 right-1/3 w-18 h-18 bg-blue-300/30 rounded-full animate-float animation-delay-3000"></div>
      </div>

      {/* Professional Medical Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-blue-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  PulseIQ Medical Center
                </h1>
                <p className="text-sm text-gray-500">Dr. {user?.name} • Online</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Enhanced Notification Dropdown */}
              <div className="relative">
                <NotificationDropdown />
              </div>
              
              {/* Professional Navigation Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <Button 
                  onClick={() => setActiveView('dashboard')} 
                  variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  className={activeView === 'dashboard' ? 
                    'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300' : 
                    'hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200'
                  }
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  onClick={() => setActiveView('patients')} 
                  variant={activeView === 'patients' ? 'default' : 'ghost'}
                  size="sm"
                  className={activeView === 'patients' ? 
                    'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300' : 
                    'hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200'
                  }
                >
                  <Users className="w-4 h-4 mr-2" />
                  My Patients
                </Button>
                <Button 
                  onClick={() => setActiveView('appointments')} 
                  variant={activeView === 'appointments' ? 'default' : 'ghost'}
                  size="sm"
                  className={activeView === 'appointments' ? 
                    'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300' : 
                    'hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200'
                  }
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Appointments
                </Button>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300 hover:shadow-lg"
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
        {/* Professional Welcome Section */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Welcome back, Dr. {user?.name}! ✨
            </h2>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg blur opacity-25"></div>
          </div>
          <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
            Your medical expertise combined with advanced technology creates exceptional patient care experiences.
          </p>
        </div>

        {/* Enhanced Profile Picture Section */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="relative bg-white rounded-2xl p-4 border-2 border-black">
              {user?.id && (
                <DoctorProfilePicture
                  doctorId={user.id}
                  profilePictureUrl={profilePictureUrl}
                  onPictureChange={refreshProfilePicture}
                />
              )}
            </div>
          </div>
        </div>
        
        {activeView === 'dashboard' && (
          <div className="flex justify-center mb-8">
            <div className="relative inline-block">
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Here's your patient overview for today ✨
              </p>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-lg blur opacity-25"></div>
            </div>
          </div>
        )}
        
        {activeView === 'dashboard' ? (
          <>
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className={`${index === 0 ? 'bg-blue-50/80 border-blue-200' : 'bg-green-50/80 border-green-200'} backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`${stat.color} p-4 rounded-xl shadow-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm font-medium ${index === 0 ? 'text-blue-700' : 'text-green-700'}`}>{stat.title}</p>
                        <p className={`text-lg font-bold ${index === 0 ? 'text-blue-900' : 'text-green-900'}`}>{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Enhanced Dashboard Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-cyan-50/80 backdrop-blur-sm border-cyan-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-cyan-100 to-cyan-50 rounded-t-lg border-b border-cyan-200/50">
                  <CardTitle className="text-cyan-800 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-cyan-600" />
                    Today's Appointments
                  </CardTitle>
                  <CardDescription className="text-cyan-600">Your scheduled patient consultations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.appointmentId} className="flex justify-between items-center p-4 border border-cyan-200 rounded-lg bg-gradient-to-r from-cyan-50/70 to-transparent hover:from-cyan-100 hover:to-cyan-50/50 transition-all duration-200">
                        <div>
                          <p className="font-semibold text-cyan-800">{appointment.patientName}</p>
                          <p className="text-sm text-cyan-600 font-medium">
                            📅 {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                            {new Date(appointment.appointmentDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {appointment.reason && (
                            <p className="text-sm text-cyan-600/80 mt-1">"{appointment.reason}"</p>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                          {appointment.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-r from-cyan-100 to-cyan-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Calendar className="w-10 h-10 text-cyan-500" />
                      </div>
                      <p className="text-cyan-600 font-semibold text-lg mb-2">No appointments scheduled for today</p>
                      <p className="text-sm text-cyan-500">Your schedule is clear</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-purple-50/80 backdrop-blur-sm border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-t-lg border-b border-purple-200/50">
                  <CardTitle className="text-purple-800 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-600" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-purple-600">Essential medical tools and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                    onClick={() => setActiveView('appointments')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View All Appointments
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                    onClick={() => setActiveView('patients')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View My Patients
                  </Button>
                  <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                        <User className="w-4 h-4 mr-2" />
                        View Profile Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-0 shadow-2xl">
                      <DialogHeader className="pb-4 border-b border-gray-200/60">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          Doctor Profile
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 text-sm mt-2">
                          View and update your professional information
                        </DialogDescription>
                      </DialogHeader>
                      
                      {profileData && (
                        <div className="flex flex-col h-[calc(85vh-120px)]">
                          <ScrollArea className="flex-1 pr-4">
                            <div className="grid gap-6 py-4">
                            {/* Professional Information Section */}
                            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-blue-50/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-blue-100/70">
                              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Professional Information
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="doctorId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
                                    Doctor ID
                                  </Label>
                                  <Input
                                    id="doctorId"
                                    value={profileData.doctorId}
                                    disabled
                                    className="bg-gradient-to-r from-white/90 to-blue-50/70 border-gray-200 text-gray-600 font-medium text-sm h-9"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></span>
                                    License Number
                                  </Label>
                                  <Input
                                    id="licenseNumber"
                                    value={isEditing ? editedProfile?.licenseNumber || '' : profileData.licenseNumber}
                                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, licenseNumber: e.target.value} : null)}
                                    disabled={!isEditing}
                                    className={`text-sm h-9 ${!isEditing ? "bg-gradient-to-r from-white/90 to-blue-50/70 border-gray-200" : "border-blue-300 focus:border-blue-500 focus:ring-blue-500/20"}`}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Personal Information Section */}
                            <div className="bg-gradient-to-r from-purple-50/80 via-violet-50/60 to-purple-50/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-purple-100/70">
                              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                Personal Information
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></span>
                                    First Name
                                  </Label>
                                  <Input
                                    id="firstName"
                                    value={isEditing ? editedProfile?.firstName || '' : profileData.firstName}
                                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, firstName: e.target.value} : null)}
                                    disabled={!isEditing}
                                    className={`text-sm h-9 ${!isEditing ? "bg-gradient-to-r from-white/90 to-purple-50/70 border-gray-200" : "border-purple-300 focus:border-purple-500 focus:ring-purple-500/20"}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-gradient-to-b from-pink-500 to-rose-600 rounded-full"></span>
                                    Last Name
                                  </Label>
                                  <Input
                                    id="lastName"
                                    value={isEditing ? editedProfile?.lastName || '' : profileData.lastName}
                                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, lastName: e.target.value} : null)}
                                    disabled={!isEditing}
                                    className={`text-sm h-9 ${!isEditing ? "bg-gradient-to-r from-white/90 to-pink-50/70 border-gray-200" : "border-pink-300 focus:border-pink-500 focus:ring-pink-500/20"}`}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Academic & Specialization Section */}
                            <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-emerald-100/70">
                              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                Academic & Specialization
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="degree" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
                                    Degree
                                  </Label>
                                  <Input
                                    id="degree"
                                    value={isEditing ? editedProfile?.degree || '' : profileData.degree}
                                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, degree: e.target.value} : null)}
                                    disabled={!isEditing}
                                    className={`text-sm h-9 ${!isEditing ? "bg-gradient-to-r from-white/90 to-emerald-50/70 border-gray-200" : "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20"}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="specialization" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></span>
                                    Specialization
                                  </Label>
                                  <Input
                                    id="specialization"
                                    value={isEditing ? editedProfile?.specialization || '' : profileData.specialization}
                                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, specialization: e.target.value} : null)}
                                    disabled={!isEditing}
                                    className={`text-sm h-9 ${!isEditing ? "bg-gradient-to-r from-white/90 to-teal-50/70 border-gray-200" : "border-teal-300 focus:border-teal-500 focus:ring-teal-500/20"}`}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Business Information Section */}
                            <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-amber-100/70">
                              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                Business Information
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="consultationFee" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></span>
                                    Consultation Fee
                                  </Label>
                                  <Input
                                    id="consultationFee"
                                    type="number"
                                    value={isEditing ? editedProfile?.consultationFee || 0 : profileData.consultationFee}
                                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, consultationFee: parseFloat(e.target.value) || 0} : null)}
                                    disabled={!isEditing}
                                    className={`text-sm h-9 ${!isEditing ? "bg-white/90 border-amber-200" : "border-amber-300 focus:border-amber-500 focus:ring-amber-200"} transition-all duration-200`}
                                  />
                                </div>
                              </div>
                            </div>

                        {/* Contact Information Section */}
                        <div className="bg-gradient-to-r from-cyan-50/80 via-sky-50/60 to-blue-50/80 p-4 rounded-xl border border-cyan-100/70 space-y-3 shadow-md">
                          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            Contact Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <span className="w-1 h-3 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></span>
                                Email Address
                              </Label>
                              <Input
                                id="email"
                                value={isEditing ? editedProfile?.email || '' : profileData.email}
                                onChange={(e) => setEditedProfile(prev => prev ? {...prev, email: e.target.value} : null)}
                                disabled={!isEditing}
                                className={`text-sm h-9 ${!isEditing ? "bg-white/90 border-cyan-200" : "border-cyan-300 focus:border-cyan-500 focus:ring-cyan-200"} transition-all duration-200`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <span className="w-1 h-3 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></span>
                                Phone Number
                              </Label>
                              <Input
                                id="phone"
                                value={isEditing ? editedProfile?.phone || '' : profileData.phone}
                                onChange={(e) => setEditedProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                                disabled={!isEditing}
                                className={`text-sm h-9 ${!isEditing ? "bg-white/90 border-cyan-200" : "border-cyan-300 focus:border-cyan-500 focus:ring-cyan-200"} transition-all duration-200`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Availability Section */}
                        <div className="bg-gradient-to-r from-teal-50/80 via-emerald-50/60 to-green-50/80 p-4 rounded-xl border border-teal-100/70 space-y-3 shadow-md">
                          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                            Availability Schedule
                          </h3>
                            
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor="availableDays" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <span className="w-1 h-3 bg-gradient-to-b from-teal-500 to-emerald-600 rounded-full"></span>
                                  Available Days
                                </Label>
                                {isEditing ? (
                                  <div className="flex flex-wrap gap-2 p-3 bg-white/70 rounded-lg border border-teal-200">
                                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => (
                                      <label key={day} className="flex items-center space-x-2 bg-white rounded-lg p-2 border border-teal-100 hover:border-teal-300 transition-colors cursor-pointer text-xs">
                                        <input
                                          type="checkbox"
                                          checked={editedProfile?.availableDays?.split(',').includes(day) || false}
                                          onChange={(e) => {
                                            const currentDays = editedProfile?.availableDays?.split(',').filter(d => d.trim()) || [];
                                            const newDays = e.target.checked 
                                              ? [...currentDays, day]
                                              : currentDays.filter(d => d !== day);
                                            setEditedProfile(prev => prev ? {...prev, availableDays: newDays.join(',') } : null);
                                          }}
                                          className="rounded border-teal-300 text-teal-600 focus:ring-teal-200 w-3 h-3"
                                        />
                                        <span className="text-xs font-medium text-gray-700">{day.charAt(0) + day.slice(1).toLowerCase()}</span>
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <Input
                                    value={profileData.availableDays || 'Not set'}
                                    disabled
                                    className="bg-white/90 border-teal-200 text-sm h-9"
                                  />
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="availableTimeStart" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-gradient-to-b from-teal-500 to-emerald-600 rounded-full"></span>
                                    Start Time
                                  </Label>
                                  <Input
                                    id="availableTimeStart"
                                    type="time"
                                    value={isEditing ? editedProfile?.availableTimeStart || '' : profileData.availableTimeStart}
                                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, availableTimeStart: e.target.value} : null)}
                                    disabled={!isEditing}
                                    className={`text-sm h-9 ${!isEditing ? "bg-white/90 border-teal-200" : "border-teal-300 focus:border-teal-500 focus:ring-teal-200"} transition-all duration-200`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="availableTimeEnd" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-gradient-to-b from-teal-500 to-emerald-600 rounded-full"></span>
                                    End Time
                                  </Label>
                                  <Input
                                    id="availableTimeEnd"
                                    type="time"
                                    value={isEditing ? editedProfile?.availableTimeEnd || '' : profileData.availableTimeEnd}
                                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, availableTimeEnd: e.target.value} : null)}
                                    disabled={!isEditing}
                                    className={`text-sm h-9 ${!isEditing ? "bg-white/90 border-teal-200" : "border-teal-300 focus:border-teal-500 focus:ring-teal-200"} transition-all duration-200`}
                                  />
                                </div>
                              </div>
                            </div>
                            </div>
                            </div>
                          </ScrollArea>                          {/* Enhanced Action Buttons - Fixed at bottom */}
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white/90 backdrop-blur-sm">
                            {isEditing ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  onClick={handleCancelEdit}
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 h-9 px-4 text-sm"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleSaveProfile}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9 px-4 text-sm"
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Changes
                                </Button>
                              </>
                            ) : (
                              <Button 
                                onClick={() => setIsEditing(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9 px-4 text-sm"
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Profile
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </>
        ) : activeView === 'patients' ? (
          <DoctorPatientList />
        ) : (
          <AppointmentList userRole="doctor" />
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;
