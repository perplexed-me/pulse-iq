import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG, apiCall } from '@/config/api';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: 'doctor' | 'patient' | 'technician' | 'admin';
  name: string;
  status?: 'pending' | 'approved' | 'rejected';
  // Doctor-specific fields
  specialization?: string;
  degree?: string;
  // Patient-specific fields
  age?: number;
  gender?: string;
  bloodGroup?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { identifier: string; password: string }) => Promise<{ success: boolean; errorMessage?: string; user?: User }>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  token: string | null;
  lastLoginError: string;
  updateUserProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [lastLoginError, setLastLoginError] = useState<string>('');

  const validateToken = async (token: string) => {
    try {
      const response = await apiCall(API_CONFIG.AUTH.VALIDATE, {
        method: 'GET'
      }, true);

      // Only return false for actual auth failures
      if (response.status === 401 || response.status === 403) {
        console.error('Token invalid or expired');
        return false;
      }

      // For network errors or other issues, assume token is still valid
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      // For network errors, assume token is still valid
      return true;
    }
  };

  // Function to clear all appointment-related data
  const clearAllAppointmentData = () => {
    // Clear all sessionStorage appointment data
    sessionStorage.removeItem('paymentCompletionData');
    
    // Clear user-specific sessionStorage and localStorage data
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('paymentCompletionData_')) {
        keys.push(key);
      }
    }
    keys.forEach(key => sessionStorage.removeItem(key));
    
    // Clear localStorage appointment data
    const localKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('appointment') || key.includes('payment') || key.includes('booking') || key.includes('pendingPayment'))) {
        localKeys.push(key);
      }
    }
    localKeys.forEach(key => localStorage.removeItem(key));
  };

  const updateUser = (newUser: User | null) => {
    console.log('=== UPDATE USER DEBUG ===');
    console.log('Setting user to:', newUser);
    if (newUser) {
      console.log('User specialization being saved:', newUser.specialization);
      console.log('User degree being saved:', newUser.degree);
    }
    setUser(newUser);
    if (newUser) {
      // Use sessionStorage for tab-specific sessions
      const userJson = JSON.stringify(newUser);
      console.log('Saving user JSON to sessionStorage:', userJson);
      sessionStorage.setItem('pulseiq_user', userJson);
    } else {
      sessionStorage.removeItem('pulseiq_user');
      sessionStorage.removeItem('token');
      setToken(null);
    }
    console.log('=== END UPDATE USER DEBUG ===');
  };

  // Function to handle API authentication errors
  const handleAuthError = () => {
    console.log('Authentication error detected - logging out');
    updateUser(null);
  };

  // Make handleAuthError available globally for API calls
  (window as any).handleAuthError = handleAuthError;

  // Effect for initial auth only
  useEffect(() => {
    const initAuth = () => {
      // Check sessionStorage for this tab's session
      const storedUser = sessionStorage.getItem('pulseiq_user');
      const storedToken = sessionStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          console.log('=== LOADING USER FROM SESSION STORAGE ===');
          console.log('Stored user JSON:', storedUser);
          const parsedUser = JSON.parse(storedUser);
          console.log('Parsed user object:', parsedUser);
          console.log('User specialization from storage:', parsedUser.specialization);
          console.log('User degree from storage:', parsedUser.degree);
          setUser(parsedUser);
          setToken(storedToken);
          console.log('=== END SESSION STORAGE LOAD ===');
        } catch (error) {
          console.error('Error parsing stored user:', error);
          updateUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []); // Run only once on mount

  const login = async (credentials: { identifier: string; password: string }): Promise<{ success: boolean; errorMessage?: string; user?: User }> => {
    setIsLoading(true);
    setLastLoginError(''); // Clear previous error
    
    try {
      console.log('=== FRONTEND LOGIN START ===');
      console.log('Making login request to backend...');
      console.log('Credentials:', { identifier: credentials.identifier, password: '***' });
      
      const startTime = Date.now();
      const response = await apiCall(API_CONFIG.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials)
      }, false);
      const endTime = Date.now();
      
      console.log('Response received in:', endTime - startTime, 'ms');
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Login response:', { status: response.status, data }); // Enhanced debug log

      // Handle specific status codes for PENDING and REJECTED accounts
      if (response.status === 202) { // PENDING status
        console.log('Account is PENDING - throwing error');
        throw new Error(data.message || 'Your account is pending approval.');
      }
      
      if (response.status === 403) { // REJECTED status
        console.log('Account is REJECTED - throwing error');
        console.log('Error message will be:', data.message || 'Your account has been rejected. Please contact support.');
        throw new Error(data.message || 'Your account has been rejected. Please contact support.');
      }

      if (!response.ok) {
        console.log('Response not ok:', response.status, data);
        throw new Error(data.error || data.message || 'Login failed');
      }
      
      // Handle case where status is in response body (backup check)
      if (data.status === 'PENDING') {
        console.log('Account status is PENDING in response body');
        throw new Error(data.message || 'Your account is pending approval.');
      }
      
      if (data.status === 'REJECTED') {
        console.log('Account status is REJECTED in response body');
        throw new Error(data.message || 'Your account has been rejected. Please contact support.');
      }
      
      console.log('=== LOGIN RESPONSE DEBUG ===');
      console.log('Full login response data:', data);
      console.log('Raw specialization:', data.specialization);
      console.log('Raw degree:', data.degree);
      console.log('User role:', data.role);
      console.log('Profile data being extracted:', {
        firstName: data.firstName,
        lastName: data.lastName,
        name: data.name,
        specialization: data.specialization,
        degree: data.degree,
        age: data.age,
        gender: data.gender,
        bloodGroup: data.bloodGroup
      });
      
      const userRole = (data.role || '').toLowerCase();

      if (!['admin', 'doctor', 'patient', 'technician'].includes(userRole)) {
        throw new Error('Invalid role received');
      }

      const loggedUser: User = {
        id: data.userId,
        email: data.email,
        phone: data.phone,
        role: userRole as User['role'],
        name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.name || `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} User`,
        status: data.status || 'approved',
        // Include role-specific profile data
        ...(userRole === 'doctor' && {
          specialization: data.specialization,
          degree: data.degree
        }),
        ...(userRole === 'patient' && {
          age: data.age,
          gender: data.gender,
          bloodGroup: data.bloodGroup
        })
      };

      console.log('=== USER OBJECT CREATED ===');
      console.log('Created user object:', loggedUser);
      console.log('User specialization:', loggedUser.specialization);
      console.log('User degree:', loggedUser.degree);
      console.log('=== END USER CREATION DEBUG ===');

      // Store token in sessionStorage for tab-specific sessions
      sessionStorage.setItem('token', data.token);
      setToken(data.token);
      
      // Clear any existing appointment data before setting new user
      clearAllAppointmentData();
      
      updateUser(loggedUser);
      
      return { success: true, user: loggedUser };
    } catch (err: unknown) {
      console.error("Login failed:", err);
      // Store the error message for the calling component
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setLastLoginError(errorMessage);
      return { success: false, errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update user profile without full re-authentication
  const updateUserProfile = (updatedData: Partial<User>) => {
    console.log('=== UPDATE USER PROFILE DEBUG ===');
    console.log('Current user:', user);
    console.log('Update data received:', updatedData);
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      console.log('Updated user object:', updatedUser);
      setUser(updatedUser);
      sessionStorage.setItem('pulseiq_user', JSON.stringify(updatedUser));
      console.log('User saved to sessionStorage');
    } else {
      console.log('No user found to update');
    }
    console.log('=== END UPDATE PROFILE DEBUG ===');
  };

  const logout = () => {
    // Clear all user-specific data on logout
    const currentUserId = user?.id;
    
    // Only logout this specific tab - no cross-tab synchronization
    updateUser(null);
    
    // Clear appointment-related data (both old and new formats)
    sessionStorage.removeItem('paymentCompletionData');
    if (currentUserId) {
      sessionStorage.removeItem(`paymentCompletionData_${currentUserId}`);
      localStorage.removeItem(`paymentCompletionData_${currentUserId}`);
    }
    
    // Clear user-specific localStorage data
    if (currentUserId) {
      localStorage.removeItem(`pendingPayment_${currentUserId}`);
      localStorage.removeItem(`appointmentData_${currentUserId}`);
      localStorage.removeItem(`selectedDoctor_${currentUserId}`);
      localStorage.removeItem(`bookingState_${currentUserId}`);
    }
    
    // Clear any other potential user data that might persist
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('appointment') || key.includes('payment') || key.includes('booking'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      setUser: updateUser,
      token,
      lastLoginError,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
