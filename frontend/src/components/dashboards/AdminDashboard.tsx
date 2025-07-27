import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Shield,
  LogOut,
  Check,
  X,
  // ThumbsUp,
  ThumbsDown,
  ThumbsUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { API_CONFIG, apiCall } from '@/config/api';

interface PendingUser {
  id?: number; // Database ID (not used for API calls)
  userId: string; // The actual user identifier like "D202501001"
  username?: string;
  email?: string;
  phone?: string;
  role: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  // Add any other fields that come from your User entity
}

type ViewMode = 'pending' | 'approved' | 'rejected';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Three arrays for each status category:
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<PendingUser[]>([]);

  // Which tab we're viewing right now:
  const [viewMode, setViewMode] = useState<ViewMode>('pending');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch pending users from /api/admin/pending
  const fetchPendingUsers = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/admin');
      return;
    }
    try {
      const resp = await apiCall(API_CONFIG.ADMIN.PENDING, {
        method: 'GET'
      });
      if (!resp.ok) throw new Error('Failed to fetch pending users');
      const data: PendingUser[] = await resp.json();
      setPendingUsers(data);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
      toast({
        title: 'Error',
        description: 'Unable to load pending users',
        variant: 'destructive'
      });
    }
  }, [navigate]);

  // Fetch approved users from /api/admin/approved
  const fetchApprovedUsers = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      const resp = await apiCall(API_CONFIG.ADMIN.APPROVED, {
        method: 'GET'
      });
      if (!resp.ok) throw new Error('Failed to fetch approved users');
      const data: PendingUser[] = await resp.json();
      setApprovedUsers(data);
    } catch (err) {
      console.error('Failed to fetch approved users:', err);
    }
  }, []);

  // Fetch rejected users from /api/admin/rejected
  const fetchRejectedUsers = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      const resp = await apiCall(API_CONFIG.ADMIN.REJECTED, {
        method: 'GET'
      });
      if (!resp.ok) throw new Error('Failed to fetch rejected users');
      const data: PendingUser[] = await resp.json();
      setRejectedUsers(data);
    } catch (err) {
      console.error('Failed to fetch rejected users:', err);
    }
  }, []);

  // On mount, load all three lists and set up auto-refresh
  useEffect(() => {
    fetchPendingUsers();
    fetchApprovedUsers();
    fetchRejectedUsers();

    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchPendingUsers();
      fetchApprovedUsers();
      fetchRejectedUsers();
    }, 5000);
    
    setRefreshInterval(interval);

    // Cleanup interval on component unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchPendingUsers, fetchApprovedUsers, fetchRejectedUsers]);

  // Cleanup interval when component unmounts
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  /**
   * Change a user's status:
   * - 'approve' → POST /api/admin/approve/{userId}
   * - 'reject'  → POST /api/admin/reject/{userId}
   */
  const handleUserAction = async (
    userId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      console.log(`Attempting to ${action} user with userId: ${userId}`);

      const endpoint = action === 'approve' 
        ? API_CONFIG.ADMIN.APPROVE(userId)
        : API_CONFIG.ADMIN.REJECT(userId);

      const resp = await apiCall(endpoint, {
        method: 'POST'
      });
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`Failed to ${action} user:`, errorText);
        throw new Error(`Failed to update user status: ${errorText}`);
      }

      // Refresh all lists after successful action
      await fetchPendingUsers();
      await fetchApprovedUsers();
      await fetchRejectedUsers();

      toast({
        title: action === 'approve' ? 'User Approved' : 'User Rejected',
        description: action === 'approve'
          ? 'User has been approved successfully.'
          : 'User has been rejected successfully.',
        variant: action === 'approve' ? 'default' : 'destructive'
      });
    } catch (err: unknown) {
      console.error(`Error ${action}ing user:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        title: 'Action Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Helper function to get display name
  const getDisplayName = (user: PendingUser): string => {
    if (user.username) return user.username;
    if (user.email) return user.email;
    if (user.phone) return user.phone;
    return user.userId;
  };

  // Helper function to get display email/contact
  const getDisplayContact = (user: PendingUser): string => {
    return user.email || user.phone || 'No contact info';
  };

  // Helper function to categorize users by role
  const categorizeUsersByRole = (users: PendingUser[]) => {
    const categories = {
      patient: users.filter(u => u.role.toLowerCase() === 'patient'),
      doctor: users.filter(u => u.role.toLowerCase() === 'doctor'),
      technician: users.filter(u => u.role.toLowerCase() === 'technician'),
      admin: users.filter(u => u.role.toLowerCase() === 'admin'),
      other: users.filter(u => !['patient', 'doctor', 'technician', 'admin'].includes(u.role.toLowerCase()))
    };
    return categories;
  };

  // Get role-based icon and color
  const getRoleDisplay = (role: string) => {
    const roleMap = {
      patient: { icon: Users, color: 'bg-blue-500' },
      doctor: { icon: Users, color: 'bg-green-500' },
      technician: { icon: Users, color: 'bg-purple-500' },
      admin: { icon: Shield, color: 'bg-red-500' },
      default: { icon: Users, color: 'bg-gray-500' }
    };
    return roleMap[role.toLowerCase()] || roleMap.default;
  };

  // Build a 5‐card stats array; clicking sets viewMode
  const stats = [
    {
      title: 'Total Users',
      value: (
        pendingUsers.length +
        approvedUsers.length +
        rejectedUsers.length
      ).toString(),
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => setViewMode('pending')
    },
    {
      title: 'Pending Approvals',
      value: pendingUsers.length.toString(),
      icon: Shield,
      color: 'bg-yellow-500',
      onClick: () => setViewMode('pending')
    },
    {
      title: 'Approved Users',
      value: approvedUsers.length.toString(),
      icon: ThumbsUp,
      color: 'bg-green-500',
      onClick: () => setViewMode('approved')
    },
    {
      title: 'Rejected Users',
      value: rejectedUsers.length.toString(),
      icon: X,
      color: 'bg-red-500',
      onClick: () => setViewMode('rejected')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  PulseIQ - Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  System Administrator Portal
                </p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Control Center
          </h2>
          <p className="text-gray-600">
            Manage users, monitor system health, and oversee platform operations.
          </p>
        </div>

        {/* Stats Grid (5 cards) */}
        {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-8">
          {stats.map((stat, idx) => (
            <Card
              key={idx}
              onClick={stat.onClick}
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} p-4 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div> */}


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 w-full">
          {stats.map((stat, idx) => (
            <Card
              key={idx}
              onClick={stat.onClick}
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} p-4 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>



        {/* Conditionally Render According to viewMode */}
        {viewMode === 'pending' && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>User Approval Queue</CardTitle>
                <CardDescription>
                  Pending users can be approved or rejected.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const categories = categorizeUsersByRole(pendingUsers);
                  return (
                    <div className="space-y-6">
                      {/* Patients */}
                      {categories.patient.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Patients ({categories.patient.length})
                          </h4>
                          <div className="space-y-3">
                            {categories.patient.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUserAction(u.userId, 'approve')}
                                    className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleUserAction(u.userId, 'reject')}
                                    className="text-xs px-2 py-1"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doctors */}
                      {categories.doctor.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Doctors ({categories.doctor.length})
                          </h4>
                          <div className="space-y-3">
                            {categories.doctor.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUserAction(u.userId, 'approve')}
                                    className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleUserAction(u.userId, 'reject')}
                                    className="text-xs px-2 py-1"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technicians */}
                      {categories.technician.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-purple-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Technicians ({categories.technician.length})
                          </h4>
                          <div className="space-y-3">
                            {categories.technician.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-purple-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUserAction(u.userId, 'approve')}
                                    className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleUserAction(u.userId, 'reject')}
                                    className="text-xs px-2 py-1"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other roles */}
                      {(categories.admin.length > 0 || categories.other.length > 0) && (
                        <div>
                          <h4 className="font-semibold text-gray-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Other ({categories.admin.length + categories.other.length})
                          </h4>
                          <div className="space-y-3">
                            {[...categories.admin, ...categories.other].map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <div className="flex items-center space-x-1 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                      </Badge>
                                      <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUserAction(u.userId, 'approve')}
                                    className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleUserAction(u.userId, 'reject')}
                                    className="text-xs px-2 py-1"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pendingUsers.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No pending users</p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === 'approved' && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Approved Users</CardTitle>
                <CardDescription>
                  Approved users can only be rejected.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const categories = categorizeUsersByRole(approvedUsers);
                  return (
                    <div className="space-y-6">
                      {/* Patients */}
                      {categories.patient.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Patients ({categories.patient.length})
                          </h4>
                          <div className="space-y-3">
                            {categories.patient.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                    <ThumbsUp className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUserAction(u.userId, 'reject')}
                                  className="text-xs px-2 py-1"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doctors */}
                      {categories.doctor.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Doctors ({categories.doctor.length})
                          </h4>
                          <div className="space-y-3">
                            {categories.doctor.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                    <ThumbsUp className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUserAction(u.userId, 'reject')}
                                  className="text-xs px-2 py-1"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technicians */}
                      {categories.technician.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-purple-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Technicians ({categories.technician.length})
                          </h4>
                          <div className="space-y-3">
                            {categories.technician.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                    <ThumbsUp className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUserAction(u.userId, 'reject')}
                                  className="text-xs px-2 py-1"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other roles */}
                      {(categories.admin.length > 0 || categories.other.length > 0) && (
                        <div>
                          <h4 className="font-semibold text-gray-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Other ({categories.admin.length + categories.other.length})
                          </h4>
                          <div className="space-y-3">
                            {[...categories.admin, ...categories.other].map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                    <ThumbsUp className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <div className="flex items-center space-x-1 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                      </Badge>
                                      <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUserAction(u.userId, 'reject')}
                                  className="text-xs px-2 py-1"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {approvedUsers.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No approved users</p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === 'rejected' && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Users</CardTitle>
                <CardDescription>
                  Rejected users can only be approved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const categories = categorizeUsersByRole(rejectedUsers);
                  return (
                    <div className="space-y-6">
                      {/* Patients */}
                      {categories.patient.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Patients ({categories.patient.length})
                          </h4>
                          <div className="space-y-3">
                            {categories.patient.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                                    <ThumbsDown className="w-4 h-4 text-red-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleUserAction(u.userId, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doctors */}
                      {categories.doctor.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Doctors ({categories.doctor.length})
                          </h4>
                          <div className="space-y-3">
                            {categories.doctor.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                                    <ThumbsDown className="w-4 h-4 text-red-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleUserAction(u.userId, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technicians */}
                      {categories.technician.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-purple-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Technicians ({categories.technician.length})
                          </h4>
                          <div className="space-y-3">
                            {categories.technician.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                                    <ThumbsDown className="w-4 h-4 text-red-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleUserAction(u.userId, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other roles */}
                      {(categories.admin.length > 0 || categories.other.length > 0) && (
                        <div>
                          <h4 className="font-semibold text-gray-600 mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Other ({categories.admin.length + categories.other.length})
                          </h4>
                          <div className="space-y-3">
                            {[...categories.admin, ...categories.other].map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                                    <ThumbsDown className="w-4 h-4 text-red-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{getDisplayName(u)}</p>
                                    <p className="text-xs text-gray-500">{getDisplayContact(u)}</p>
                                    <div className="flex items-center space-x-1 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                      </Badge>
                                      <span className="text-xs text-gray-400">ID: {u.userId}</span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleUserAction(u.userId, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {rejectedUsers.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No rejected users</p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
