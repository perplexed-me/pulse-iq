import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, LogOut, Clock, CheckCircle, Upload, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';
import TechnicianTestResults from '../TestResults/TechnicianTestResults';

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

const TechnicianDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUploads: 0,
    pendingReview: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentUploads, setRecentUploads] = useState<TestUpload[]>([]);

  // Fetch real statistics and recent uploads from the backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        console.log('Fetching stats with token:', token.substring(0, 20) + '...');
        
        const response = await fetch('http://132.196.64.104:8085/api/test-results/my-upload-stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
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
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found for uploads');
          return;
        }

        console.log('Fetching recent uploads...');
        
        // Use the correct technician endpoint that we know exists
        const response = await fetch('http://132.196.64.104:8085/api/test-results/my-uploads', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
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

  const dashboardStats = [
    { title: 'Total Uploads', value: loading ? '...' : stats.totalUploads.toString(), icon: FileText, color: 'bg-blue-500' },
    { title: 'This Month', value: loading ? '...' : stats.completedToday.toString(), icon: CheckCircle, color: 'bg-green-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">PulseIQ - Technician Portal</h1>
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
                onClick={() => setActiveView('test-results')} 
                variant={activeView === 'test-results' ? 'default' : 'outline'}
                size="sm"
              >
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
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
              <p className="text-gray-600">Manage lab tests and help provide quality healthcare.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {dashboardStats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.color}`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Test Uploads</CardTitle>
                <CardDescription>Your latest test result uploads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading recent uploads...</p>
                  </div>
                ) : recentUploads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent uploads found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Check the console for any permission errors or try uploading a test first.
                    </p>
                  </div>
                ) : (
                  recentUploads.map((upload, index) => (
                    <div key={upload.testId || upload.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {upload.testName || upload.testType || 'Test Result'}
                            {upload.patientId && ` - Patient ${upload.patientId}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Uploaded: {new Date(upload.testDate || upload.uploadedAt || upload.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          upload.status === 'COMPLETED' ? "text-green-600 border-green-600" :
                          upload.status === 'REVIEWED' ? "text-purple-600 border-purple-600" :
                          upload.status === 'PENDING' ? "text-yellow-600 border-yellow-600" :
                          upload.status === 'IN_PROGRESS' ? "text-blue-600 border-blue-600" :
                          "text-gray-600 border-gray-600"
                        }
                      >
                        {upload.status || 'Unknown'}
                      </Badge>
                    </div>
                  ))
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
    </div>
  );
};

export default TechnicianDashboard;
