import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG, apiCall } from '@/config/api';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: 'doctor' | 'patient' | 'technician' | 'admin';
  name: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { identifier: string; password: string }) => Promise<{ success: boolean; errorMessage?: string; user?: User }>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  token: string | null;
  lastLoginError: string;
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

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('pulseiq_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('pulseiq_user');
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  // Effect for initial auth and periodic validation
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('pulseiq_user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        const isValid = await validateToken(storedToken);
        if (isValid) {
          if (!user) { // Only update if user is not already set
            updateUser(JSON.parse(storedUser));
            setToken(storedToken);
          }
        } else {
          updateUser(null);
        }
      } else {
        updateUser(null);
      }
      setIsLoading(false);
    };

    // Initial check
    checkAuth();

    // Set up periodic validation every 5 minutes
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user]); // Added user to dependencies

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
      
      console.log('Profile data:', {  // Debug log
        firstName: data.firstName,
        lastName: data.lastName,
        name: data.name
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
        status: data.status || 'approved'
      };

      console.log('Created user object:', loggedUser); // Debug log

      localStorage.setItem('token', data.token);
      setToken(data.token);
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

  const logout = () => {
    updateUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      setUser: updateUser,
      token,
      lastLoginError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
