import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Calendar, Clock, User, LogOut, FileText, Edit2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DoctorTestResults from '../TestResults/DoctorTestResults';
import DoctorProfilePicture from '../DoctorProfilePicture';
import AppointmentList from '../appointments/AppointmentList';
import { useToast } from '@/hooks/use-toast';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://132.196.64.104:8085";

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
}

interface UpcomingAppointment {
  appointmentId: number;
  patientName: string;
  appointmentDate: string;
  reason?: string;
  status: string;
}

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('dashboard');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<DoctorProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<DoctorProfile | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);

  useEffect(() => {
    if (user?.id) {
      setProfilePictureUrl(`/api/doctors/${user.id}/profile-picture`);
      fetchTestResults();
      fetchProfileData();
      fetchUpcomingAppointments();
      console.log('DoctorDashboard: user.id =', user.id);
      console.log('DoctorDashboard: profilePictureUrl =', `/api/doctors/${user.id}/profile-picture`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTestResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/test-results/doctor/${user?.id}`, {
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
      const response = await fetch(`${BASE_URL}/api/doctors/${user?.id}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/doctors/${user?.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedProfile)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfileData(updatedProfile);
        setEditedProfile(updatedProfile);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
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
    { title: "Today's Appointments", value: upcomingAppointments.length.toString(), icon: Calendar, color: 'bg-blue-500' },
    { title: "Total Patients", value: '45', icon: Users, color: 'bg-green-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">PulseIQ - Doctor Portal</h1>
                <p className="text-sm text-gray-500">Welcome back, Dr. {user?.name}</p>
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
        {/* Welcome Section - moved above profile picture */}
        <div className="mb-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Dr. {user?.name}!</h2>

        </div>

        {/* Profile Picture Section - rectangular style */}
        <div className="flex justify-center mb-8">
          {user?.id && (
            <DoctorProfilePicture
              doctorId={user.id}
              profilePictureUrl={profilePictureUrl}
              onPictureChange={refreshProfilePicture}
            />
          )}
        </div>
        {activeView === 'dashboard' && (
          <div className="flex justify-center mb-8">
            <p className="text-xl font-bold text-black">Here's your patient overview for today.</p>
          </div>
        )}
        
        {activeView === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Patients */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Appointments</CardTitle>
                  <CardDescription>Scheduled patient visits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.appointmentId} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{appointment.patientName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                            {new Date(appointment.appointmentDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {appointment.reason && (
                            <p className="text-sm text-gray-400">{appointment.reason}</p>
                          )}
                        </div>
                        <Badge variant="outline">{appointment.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No appointments scheduled for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveView('appointments')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View All Appointments
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    View All Patients
                  </Button>
                  <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start" variant="outline">
                        <User className="w-4 h-4 mr-2" />
                        View Profile Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Doctor Profile
                        </DialogTitle>
                        <DialogDescription>
                          View and update your professional information
                        </DialogDescription>
                      </DialogHeader>
                      
                      {profileData && (
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="doctorId">Doctor ID</Label>
                              <Input
                                id="doctorId"
                                value={profileData.doctorId}
                                disabled
                                className="bg-gray-50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="licenseNumber">License Number</Label>
                              <Input
                                id="licenseNumber"
                                value={isEditing ? editedProfile?.licenseNumber || '' : profileData.licenseNumber}
                                onChange={(e) => setEditedProfile(prev => prev ? {...prev, licenseNumber: e.target.value} : null)}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                value={isEditing ? editedProfile?.firstName || '' : profileData.firstName}
                                onChange={(e) => setEditedProfile(prev => prev ? {...prev, firstName: e.target.value} : null)}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                value={isEditing ? editedProfile?.lastName || '' : profileData.lastName}
                                onChange={(e) => setEditedProfile(prev => prev ? {...prev, lastName: e.target.value} : null)}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="degree">Degree</Label>
                              <Input
                                id="degree"
                                value={isEditing ? editedProfile?.degree || '' : profileData.degree}
                                onChange={(e) => setEditedProfile(prev => prev ? {...prev, degree: e.target.value} : null)}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="specialization">Specialization</Label>
                              <Input
                                id="specialization"
                                value={isEditing ? editedProfile?.specialization || '' : profileData.specialization}
                                onChange={(e) => setEditedProfile(prev => prev ? {...prev, specialization: e.target.value} : null)}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="consultationFee">Consultation Fee</Label>
                              <Input
                                id="consultationFee"
                                type="number"
                                value={isEditing ? editedProfile?.consultationFee || 0 : profileData.consultationFee}
                                onChange={(e) => setEditedProfile(prev => prev ? {...prev, consultationFee: parseFloat(e.target.value) || 0} : null)}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                value={isEditing ? editedProfile?.email || '' : profileData.email}
                                onChange={(e) => setEditedProfile(prev => prev ? {...prev, email: e.target.value} : null)}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={isEditing ? editedProfile?.phone || '' : profileData.phone}
                              onChange={(e) => setEditedProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                              disabled={!isEditing}
                              className={!isEditing ? "bg-gray-50" : ""}
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            {isEditing ? (
                              <>
                                <Button variant="outline" onClick={handleCancelEdit}>
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button onClick={handleSaveProfile}>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Changes
                                </Button>
                              </>
                            ) : (
                              <Button onClick={() => setIsEditing(true)}>
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
        ) : activeView === 'appointments' ? (
          <AppointmentList userRole="doctor" />
        ) : (
          <DoctorTestResults />
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;
