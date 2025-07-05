import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { User as LucideUser, Mail, Phone, LogIn } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { API_CONFIG, apiCall } from '@/config/api';

const Login = () => {
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    phone: '',
    password: '',
    role: ''
  });
  const [loginType, setLoginType] = useState<'userId' | 'email' | 'phone'>('userId');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, isLoading, setUser, lastLoginError } = useAuth();
  const navigate = useNavigate();

  const detectRoleFromUserId = (userId: string): string | null => {
    // Only auto-detect role if the userId matches a complete valid pattern
    // Valid patterns: D001, P001, T001, A001 (letter + 3 digits)
    const userIdPattern = /^[DPTA]\d{3}$/;
    
    if (!userIdPattern.test(userId)) {
      return null;
    }
    
    const prefix = userId.charAt(0).toUpperCase();
    switch (prefix) {
      case 'D': return 'doctor';
      case 'P': return 'patient';
      case 'T': return 'technician';
      case 'A': return 'admin';
      default: return null;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'userId' && value) {
      const detectedRole = detectRoleFromUserId(value);
      if (detectedRole) {
        setFormData(prev => ({ ...prev, role: detectedRole }));
        setShowRoleSelection(false);
      } else {
        setShowRoleSelection(true);
      }
    } else if ((field === 'email' || field === 'phone') && value) {
      setShowRoleSelection(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password) {
      toast({
        title: "Error",
        description: "Password is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.userId && !formData.email && !formData.phone) {
      toast({
        title: "Error",
        description: "Please provide User ID, email, or phone number",
        variant: "destructive"
      });
      return;
    }

    if (showRoleSelection && !formData.role) {
      toast({
        title: "Error",
        description: "Please select your role",
        variant: "destructive"
      });
      return;
    }

    const identifier = formData.userId || formData.email || formData.phone;
    console.log('Attempting login with:', { identifier, password: '***' });
    
    const result = await login({ identifier, password: formData.password });
    console.log('Login result:', result);
    console.log('lastLoginError after login:', lastLoginError);
    
    if (result.success) {
      console.log('Showing success toast');
      toast({
        title: "Login Successful",
        description: "Welcome to PulseIQ!",
      });
      
      // Redirect based on the role from the authenticated user
      const userRole = result.user?.role || formData.role;
      switch (userRole) {
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'patient':
          navigate('/patient/dashboard');
          break;
        case 'technician':
          navigate('/technician/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      // Use the error message directly from the login result
      const errorMessage = result.errorMessage || "Invalid credentials. Please try again.";
      console.log('Showing error toast with message:', errorMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await apiCall(API_CONFIG.AUTH.GOOGLE_PATIENT, {
        method: 'POST',
        body: JSON.stringify({ 
          idToken,
          // Include additional user info for patient table creation
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        })
      }, false);

      const data = await response.json();
      console.log('Backend response:', data);

      // Handle non-200 responses with specific error messages
      if (!response.ok) {
        console.log('Response not ok:', response.status, response.statusText);
        if (data.status === 'REJECTED') {
          throw new Error('Your account has been rejected. Please contact support.');
        } else if (data.status === 'PENDING') {
          throw new Error('Your account is pending approval.');
        } else {
          throw new Error(data.message || 'Patient verification failed');
        }
      }

      // Only proceed if user is approved
      if (data.status !== 'ACTIVE') {
        let statusMessage = 'Account status unknown';
        if (data.status === 'REJECTED') {
          statusMessage = 'Your account has been rejected. Please contact support.';
        } else if (data.status === 'PENDING') {
          statusMessage = 'Your account is pending approval.';
        }
        
        toast({
          title: 'Access Denied',
          description: statusMessage,
          variant: 'destructive'
        });
        return;
      }

      // Store the token
      localStorage.setItem('token', data.token);

      // Create properly typed user object
      const userData: User = {
        id: data.userId || result.user.uid,
        email: data.email || result.user.email || '',
        role: 'patient',
        name: data.name || result.user.displayName || 'Patient User',
        status: data.status
      };

      // Store user data and update context
      localStorage.setItem('pulseiq_user', JSON.stringify(userData));
      setUser(userData);

      toast({
        title: 'Google Sign-In Successful',
        description: 'Welcome to PulseIQ!'
      });

      // Small delay to ensure context is updated
      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 10);
    
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast({
        title: 'Google Sign-In Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-sky-600 rounded-full flex items-center justify-center">
            <LucideUser className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">PulseIQ Login</CardTitle>
          <CardDescription>Access your healthcare management portal</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            variant="outline"
            className="w-full border-2 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            {isGoogleLoading ? (
              'Signing in with Google...'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google (Patient Only)
              </>
            )}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
        </CardContent>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <div className="relative">
                <LucideUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="userId"
                  placeholder="e.g., D100, P200, T300 or email or phone"
                  value={formData.userId}
                  onChange={(e) => handleInputChange('userId', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {showRoleSelection && (
              <div className="space-y-2">
                <Label>Select Your Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={isLoading}>
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
            
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-sky-600 hover:text-sky-700 font-medium"
              >
                Register here
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;

