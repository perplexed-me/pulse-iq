import React, { useState, useEffect } from 'react';
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
import { User as LucideUser, Mail, Phone, LogIn, ArrowLeft, Stethoscope, Activity, FileText, Shield, Heart, Plus, Lock, Users, UserPlus } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { API_CONFIG, apiCall } from '@/config/api';

const Login = () => {
  const [particles, setParticles] = useState([]);
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

  // Clear form data when component unmounts for security
  useEffect(() => {
    // Create animated particles
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 10 + 3,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: (Math.random() - 0.5) * 1.5,
          opacity: Math.random() * 0.8 + 0.2,
          color: ['sky', 'blue', 'cyan', 'indigo', 'purple', 'emerald', 'pink', 'amber'][Math.floor(Math.random() * 8)]
        });
      }
      setParticles(newParticles);
    };

    createParticles();

    // Animate particles continuously
    const animateParticles = () => {
      setParticles(prev => prev.map(particle => {
        let newX = particle.x + particle.speedX;
        let newY = particle.y + particle.speedY;

        // Wrap around screen edges
        if (newX > 100) newX = -5;
        if (newX < -5) newX = 100;
        if (newY > 100) newY = -5;
        if (newY < -5) newY = 100;

        return {
          ...particle,
          x: newX,
          y: newY
        };
      }));
    };

    const particleInterval = setInterval(animateParticles, 25);

    return () => {
      clearInterval(particleInterval);
      setFormData({
        userId: '',
        email: '',
        phone: '',
        password: '',
        role: ''
      });
    };
  }, []);

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
      
      // Clear form data to prevent autofill for next user
      setFormData({
        userId: '',
        email: '',
        phone: '',
        password: '',
        role: ''
      });
      
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
      // Clear password field after failed login for security
      setFormData(prev => ({ ...prev, password: '' }));
      
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

      // Store the token in sessionStorage (consistent with regular login)
      sessionStorage.setItem('token', data.token);

      // Create properly typed user object
      const userData: User = {
        id: data.userId || result.user.uid,
        email: data.email || result.user.email || '',
        role: 'patient',
        name: data.name || result.user.displayName || 'Patient User',
        status: data.status
      };

      // Store user data and update context (consistent with regular login)
      sessionStorage.setItem('pulseiq_user', JSON.stringify(userData));
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Beautiful Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Moving Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              background: particle.color === 'sky' ? 'linear-gradient(45deg, #0ea5e9, #38bdf8)' :
                         particle.color === 'blue' ? 'linear-gradient(45deg, #3b82f6, #60a5fa)' :
                         particle.color === 'cyan' ? 'linear-gradient(45deg, #06b6d4, #22d3ee)' :
                         particle.color === 'indigo' ? 'linear-gradient(45deg, #6366f1, #818cf8)' :
                         particle.color === 'purple' ? 'linear-gradient(45deg, #8b5cf6, #a78bfa)' :
                         particle.color === 'emerald' ? 'linear-gradient(45deg, #10b981, #34d399)' :
                         particle.color === 'pink' ? 'linear-gradient(45deg, #ec4899, #f472b6)' :
                         particle.color === 'amber' ? 'linear-gradient(45deg, #f59e0b, #fbbf24)' :
                         'linear-gradient(45deg, #8b5cf6, #a78bfa)',
              boxShadow: `0 0 ${particle.size * 4}px ${particle.color === 'sky' ? 'rgba(14, 165, 233, 0.7)' : 
                          particle.color === 'blue' ? 'rgba(59, 130, 246, 0.7)' :
                          particle.color === 'cyan' ? 'rgba(6, 182, 212, 0.7)' :
                          particle.color === 'indigo' ? 'rgba(99, 102, 241, 0.7)' :
                          particle.color === 'purple' ? 'rgba(139, 92, 246, 0.7)' :
                          particle.color === 'emerald' ? 'rgba(16, 185, 129, 0.7)' :
                          particle.color === 'pink' ? 'rgba(236, 72, 153, 0.7)' :
                          particle.color === 'amber' ? 'rgba(245, 158, 11, 0.7)' : 'rgba(139, 92, 246, 0.7)'}`,
              filter: 'blur(0.3px)',
              transition: 'all 0.02s linear',
            }}
          />
        ))}

        {/* Enhanced Floating Medical Icons */}
        <div className="absolute top-20 left-10 animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>
          <Heart className="w-6 h-6 text-sky-400/50" />
        </div>
        <div className="absolute top-40 right-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Stethoscope className="w-8 h-8 text-blue-400/50" />
        </div>
        <div className="absolute bottom-40 left-20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '2s' }}>
          <Shield className="w-7 h-7 text-cyan-400/50" />
        </div>
        <div className="absolute bottom-20 right-40 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}>
          <Activity className="w-5 h-5 text-indigo-400/50" />
        </div>
        <div className="absolute top-60 right-10 animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '1.5s' }}>
          <Users className="w-6 h-6 text-emerald-400/50" />
        </div>
        <div className="absolute bottom-60 left-40 animate-bounce" style={{ animationDuration: '4.2s', animationDelay: '2.5s' }}>
          <FileText className="w-5 h-5 text-purple-400/50" />
        </div>
        
        {/* Enhanced Plus Signs */}
        <div className="absolute top-60 left-1/3 animate-spin" style={{ animationDuration: '8s' }}>
          <Plus className="w-4 h-4 text-sky-500/40" />
        </div>
        <div className="absolute bottom-60 right-1/3 animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}>
          <Plus className="w-6 h-6 text-blue-500/40" />
        </div>
        <div className="absolute top-32 left-2/3 animate-spin" style={{ animationDuration: '12s' }}>
          <Plus className="w-5 h-5 text-emerald-500/40" />
        </div>
        <div className="absolute bottom-32 left-1/4 animate-spin" style={{ animationDuration: '9s', animationDirection: 'reverse' }}>
          <Plus className="w-3 h-3 text-purple-500/40" />
        </div>
      </div>

      {/* Back button - moved to top right */}
      <div className="absolute top-4 right-4 z-50">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300 font-medium shadow-lg hover:scale-105 transition-all duration-200 backdrop-blur-sm bg-white/80"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
      
      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-white/95 relative z-10">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-sky-600 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">Access your PulseIQ healthcare portal</CardDescription>
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

        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <div className="relative">
                <LucideUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="userId"
                  name="userId"
                  placeholder="e.g., D100, P200, T300 or email or phone"
                  value={formData.userId}
                  onChange={(e) => handleInputChange('userId', e.target.value)}
                  className="pl-10"
                  autoComplete="off"
                  autoFocus={false}
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
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                autoComplete="new-password"
                autoFocus={false}
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
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-center text-gray-600">
                Administrator?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Sign in as Admin
                </button>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;

