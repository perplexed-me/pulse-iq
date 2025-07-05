import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, FileText, User, LogOut, Clock, Edit2, Save, X, MessageSquare, Bot, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PatientTestResults from '../TestResults/PatientTestResults';
import AppointmentList from '../appointments/AppointmentList';
import { useToast } from '@/hooks/use-toast';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://132.196.64.104:8085";

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
  const { user, logout } = useAuth();
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

  useEffect(() => {
    fetchTestResults();
    fetchProfileData();
    fetchUpcomingAppointments();
  }, []);

  const fetchTestResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/test-results/my-tests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('token');
      console.log('Fetching profile data with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`${BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/appointments/upcoming`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedProfile)
      });

      if (response.ok) {
        setProfileData(editedProfile);
        setIsEditing(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">PulseIQ - Patient Portal</h1>
                <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Navigation Buttons */}
              <Button 
                onClick={() => setActiveView('dashboard')} 
                variant={activeView === 'dashboard' ? 'default' : 'outline'}
                size="sm"
              >
                Dashboard
              </Button>
              <Button 
                onClick={() => setActiveView('appointments')} 
                variant={activeView === 'appointments' ? 'default' : 'outline'}
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Appointments
              </Button>
              <Button 
                onClick={() => setActiveView('test-results')} 
                variant={activeView === 'test-results' ? 'default' : 'outline'}
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Test Results
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' ? (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
              <p className="text-gray-600">Manage your healthcare and stay connected with your care team.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Next Appointment</p>
                      <p className="text-lg font-bold text-gray-900">
                        {upcomingAppointments.length > 0 
                          ? new Date(upcomingAppointments[0].appointmentDate).toLocaleDateString()
                          : 'Not scheduled'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-green-500 p-3 rounded-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Lab Results</p>
                      <p className="text-lg font-bold text-gray-900">{loading ? 'Loading...' : getLabResultsCount()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200" 
                onClick={handleProfileClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-yellow-500 p-3 rounded-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Profile</p>
                      <button 
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick();
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled healthcare visits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.appointmentId} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Dr. {appointment.doctorName}</p>
                          <p className="text-sm text-gray-500">{appointment.doctorSpecialization}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                            {new Date(appointment.appointmentDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">{appointment.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No upcoming appointments scheduled</p>
                      <p className="text-sm text-gray-400 mt-2">Book an appointment to see it here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Health Actions</CardTitle>
                  <CardDescription>Manage your healthcare needs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start cursor-pointer" 
                    variant="outline"
                    onClick={() => navigate('/book-appointment')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book New Appointment
                  </Button>
                  <Button 
                    className="w-full justify-start cursor-pointer" 
                    variant="outline"
                    onClick={() => setActiveView('appointments')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View All Appointments
                  </Button>
                  <Button 
                    className="w-full justify-start cursor-pointer" 
                    variant="outline"
                    onClick={() => setActiveView('test-results')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Test Results
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : activeView === 'appointments' ? (
          <AppointmentList userRole="patient" />
        ) : (
          <PatientTestResults />
        )}

        {/* Profile Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>
                View and manage your profile information.
              </DialogDescription>
            </DialogHeader>

            {profileData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    value={profileData.userId || ''}
                    disabled={true}
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={isEditing ? (editedProfile?.firstName || '') : (profileData.firstName || '')}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={isEditing ? (editedProfile?.lastName || '') : (profileData.lastName || '')}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={isEditing ? (editedProfile?.email || '') : (profileData.email || '')}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={isEditing ? (editedProfile?.phone || '') : (profileData.phone || '')}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={isEditing ? (editedProfile?.age || '') : (profileData.age || '')}
                    onChange={(e) => handleInputChange('age', Number(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
                    <Select
                      value={editedProfile?.gender || ''}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger>
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
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  {isEditing ? (
                    <Select
                      value={editedProfile?.bloodGroup || ''}
                      onValueChange={(value) => handleInputChange('bloodGroup', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="bloodGroup"
                      value={profileData.bloodGroup || 'Not specified'}
                      disabled={true}
                    />
                  )}
                </div>
              </div>
            )}

            {!profileData && (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Loading profile data...</p>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={() => {
                setIsProfileDialogOpen(false);
                setIsEditing(false);
              }}>
                Close
              </Button>
              {profileData && (
                <>
                  <Button onClick={handleEditToggle} variant="outline">
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
                    <Button onClick={handleProfileSave}>
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
      <Card className="mt-8 bg-gradient-to-r from-blue-500 to-green-500 border-blue-200 flex justify-center">
        <CardContent className="p-6 flex justify-center">
          <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto text-center">
            <div className="bg-blue-600 p-3 rounded-lg mb-2">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Try our AI Health Assistant</h3>
            <p className="text-gray-600 mb-4">
              Get instant health insights and recommendations. Ask about symptoms, conditions, and get helpful guidance 24/7.
            </p>
            <Button 
              onClick={() => navigate('/health-chat')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;
