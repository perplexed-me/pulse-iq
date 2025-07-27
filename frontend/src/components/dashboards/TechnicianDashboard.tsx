import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  User, 
  LogOut, 
  Clock, 
  CheckCircle, 
  Upload, 
  BarChart3,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';
import TechnicianTestResults from '../TestResults/TechnicianTestResults';
import { API_CONFIG, apiCall } from '@/config/api';
import { toast } from '@/hooks/use-toast';

interface TestUpload {
  testId?: string;
  id?: string;
  testName?: string;
  testType?: string;
  testDate?: string;
  uploadedAt?: string;
  createdAt?: string;
  status?: string;
  patientId?: string;
}

interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  technicianId: string;
}

const TechnicianDashboard = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUploads: 0,
    pendingReview: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentUploads, setRecentUploads] = useState<TestUpload[]>([]);
  
  // Profile management states
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);

  // Fetch real statistics and recent uploads from the backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        console.log('Fetching stats with token:', token.substring(0, 20) + '...');
        
        const response = await apiCall(API_CONFIG.TEST_RESULTS.MY_UPLOAD_STATS, {
          method: 'GET'
        });

        console.log('Stats response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Stats data received:', data);
          setStats({
            totalUploads: data.totalTests || 0,
            pendingReview: data.pendingTests || 0,
            completedToday: data.testsThisMonth || 0
          });
        } else if (response.status === 403) {
          console.error('Access forbidden - user may not have technician permissions');
        } else {
          console.error('Failed to fetch stats:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentUploads = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found for uploads');
          return;
        }

        console.log('Fetching recent uploads...');
        
        // Use the correct technician endpoint that we know exists
        const response = await apiCall(API_CONFIG.TEST_RESULTS.MY_UPLOADS, {
          method: 'GET'
        });

        console.log('Uploads response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Recent uploads data:', data); // Debug log
          // Take only the first 3 results and sort by date if data exists
          if (Array.isArray(data) && data.length > 0) {
            const sortedData = data
              .sort((a, b) => {
                const dateA = new Date(b.testDate || b.uploadedAt || b.createdAt || 0);
                const dateB = new Date(a.testDate || a.uploadedAt || a.createdAt || 0);
                return dateA.getTime() - dateB.getTime();
              })
              .slice(0, 3);
            console.log('Processed recent uploads:', sortedData); // Debug log
            setRecentUploads(sortedData);
          } else {
            console.log('No upload data found or data is not an array:', data);
            setRecentUploads([]);
          }
        } else if (response.status === 403) {
          console.error('Access forbidden - user may not have technician permissions for uploads');
          setRecentUploads([]);
        } else {
          console.error('Failed to fetch recent uploads:', response.status, response.statusText);
          setRecentUploads([]);
        }
      } catch (error) {
        console.error('Error fetching recent uploads:', error);
        setRecentUploads([]);
      }
    };

    if (activeView === 'dashboard') {
      fetchStats();
      fetchRecentUploads();
    }
  }, [activeView]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchProfileData = async () => {
    try {
      const response = await apiCall(API_CONFIG.AUTH.PROFILE, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        console.error('Failed to fetch profile data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleProfileClick = () => {
    if (profileData) {
      setEditedProfile({ ...profileData });
      setIsProfileDialogOpen(true);
    } else {
      toast({
        title: "Loading Profile",
        description: "Fetching your profile data...",
      });
      fetchProfileData().then(() => {
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

  const handleProfileEdit = () => {
    if (!isEditing && profileData) {
      setEditedProfile({ ...profileData });
    }
    setIsEditing(!isEditing);
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

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value
      });
    }
  };

  // Initialize profile data
  useEffect(() => {
    fetchProfileData();
  }, []);

  const dashboardStats = [
    { title: 'Total Uploads', value: loading ? '...' : stats.totalUploads.toString(), icon: FileText, color: 'bg-blue-500' },
    { title: 'This Month', value: loading ? '...' : stats.completedToday.toString(), icon: CheckCircle, color: 'bg-green-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-blue-50/20 to-indigo-50/30 shadow-lg border-b border-blue-100/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-indigo-800 bg-clip-text text-transparent">
                  PulseIQ - Technician Portal
                </h1>
                <p className="text-sm text-indigo-600 font-medium">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Navigation Buttons */}
              <Button 
                onClick={() => setActiveView('dashboard')} 
                variant={activeView === 'dashboard' ? 'default' : 'outline'}
                size="sm"
                className={`transition-all duration-300 ${
                  activeView === 'dashboard' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                    : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                onClick={() => setActiveView('test-results')} 
                variant={activeView === 'test-results' ? 'default' : 'outline'}
                size="sm"
                className={`transition-all duration-300 ${
                  activeView === 'test-results' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                    : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Test Results
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'dashboard' ? (
          <>
            {/* Welcome Section */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-xl">
                <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! </h2>
                <p className="text-indigo-100">Manage lab tests and help provide quality healthcare with excellence.</p>
                <div className="mt-3 inline-block px-3 py-1 bg-white/20 rounded-lg backdrop-blur-sm">
                  <span className="text-xs font-medium">Today's Date: {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-xl shadow-xl">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-emerald-800">Total Uploads</p>
                      <p className="text-lg font-bold text-emerald-900">
                        {loading ? '...' : stats.totalUploads.toString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-amber-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-xl shadow-xl">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-amber-800">This Month</p>
                      <p className="text-lg font-bold text-amber-900">
                        {loading ? '...' : stats.completedToday.toString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Profile Card */}
              <Card 
                className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 border-rose-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group shadow-lg" 
                onClick={handleProfileClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4 rounded-xl shadow-xl group-hover:scale-110 transition-transform duration-200">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-rose-900 mb-1">Profile</h3>
                      <div className="flex items-center text-rose-800 font-semibold group-hover:text-rose-900 transition-colors duration-300">
                        <span className="mr-2">View Details</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-rose-600 mt-1">Manage your information</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:shadow-2xl transition-all duration-300 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-white">Recent Test Uploads</CardTitle>
                    <CardDescription className="text-indigo-100 text-sm">Your latest test result uploads</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center px-3 py-2 bg-indigo-100 rounded-full">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                      <span className="text-indigo-700 font-medium text-sm">Loading recent uploads...</span>
                    </div>
                  </div>
                ) : recentUploads.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No recent uploads found</h3>
                    <p className="text-gray-500 text-sm mb-1">Start uploading test results to see them here.</p>
                    <p className="text-xs text-gray-400">
                      Check the console for any permission errors or try uploading a test first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentUploads.map((upload, index) => (
                      <div key={upload.testId || upload.id || index} className="group flex items-center justify-between p-3 bg-white/80 border border-gray-200 rounded-lg hover:shadow-lg hover:border-indigo-300 transition-all duration-300 hover:bg-white shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <FileText className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 group-hover:text-indigo-700 transition-colors duration-300">
                              {upload.testName || upload.testType || 'Test Result'}
                              {upload.patientId && ` - Patient ${upload.patientId}`}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Uploaded: {new Date(upload.testDate || upload.uploadedAt || upload.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`px-2 py-1 text-xs font-medium transition-colors duration-300 ${
                            upload.status === 'COMPLETED' ? "text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100" :
                            upload.status === 'REVIEWED' ? "text-purple-700 border-purple-300 bg-purple-50 hover:bg-purple-100" :
                            upload.status === 'PENDING' ? "text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100" :
                            upload.status === 'IN_PROGRESS' ? "text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100" :
                            "text-gray-700 border-gray-300 bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          {upload.status === 'COMPLETED' && '✅ '}
                          {upload.status === 'REVIEWED' && '👁️ '}
                          {upload.status === 'PENDING' && '⏳ '}
                          {upload.status === 'IN_PROGRESS' && '🔄 '}
                          {upload.status || 'Unknown'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <ErrorBoundary>
            <TechnicianTestResults />
          </ErrorBoundary>
        )}
      </main>
      
      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/30">
          <DialogHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-lg -mx-6 -mt-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">Technician Profile</DialogTitle>
                <DialogDescription className="text-indigo-100 text-sm">
                  View and manage your profile information.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {profileData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="technicianId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Technician ID
                </Label>
                <Input
                  id="technicianId"
                  value={profileData.technicianId || profileData.userId || ''}
                  disabled={true}
                  className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600 font-medium text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={isEditing ? (editedProfile?.firstName || '') : (profileData.firstName || '')}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  className={`transition-all duration-300 text-sm ${
                    isEditing 
                      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={isEditing ? (editedProfile?.lastName || '') : (profileData.lastName || '')}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  className={`transition-all duration-300 text-sm ${
                    isEditing 
                      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={isEditing ? (editedProfile?.email || '') : (profileData.email || '')}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  className={`transition-all duration-300 text-sm ${
                    isEditing 
                      ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-200 bg-white' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={isEditing ? (editedProfile?.phone || '') : (profileData.phone || '')}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className={`transition-all duration-300 text-sm ${
                    isEditing 
                      ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200 bg-white' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Specialization
                </Label>
                <Input
                  id="specialization"
                  value={isEditing ? (editedProfile?.specialization || '') : (profileData.specialization || '')}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                  disabled={!isEditing}
                  className={`transition-all duration-300 text-sm ${
                    isEditing 
                      ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-200 bg-white' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleProfileSave}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleProfileEdit}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianDashboard;
