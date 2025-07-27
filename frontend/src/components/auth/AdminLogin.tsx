import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Shield, LogIn, Heart, Stethoscope, Activity, FileText, Plus, Users } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

const AdminLogin = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const { login } = useAuth();
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
          color: ['slate', 'gray', 'red', 'orange', 'yellow', 'emerald', 'blue', 'purple'][Math.floor(Math.random() * 8)]
        });
      }
      setParticles(newParticles);
    };

    // Animate particles
    const animateParticles = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + particle.speedX;
          let newY = particle.y + particle.speedY;
          
          // Wrap around screen edges
          if (newX > 100) newX = 0;
          if (newX < 0) newX = 100;
          if (newY > 100) newY = 0;
          if (newY < 0) newY = 100;
          
          return {
            ...particle,
            x: newX,
            y: newY
          };
        })
      );
    };

    createParticles();
    const particleInterval = setInterval(animateParticles, 25);

    return () => {
      clearInterval(particleInterval);
      setFormData({ identifier: '', password: '' });
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(formData);
      if (result.success) {
        // Clear form data after successful login
        setFormData({ identifier: '', password: '' });
        navigate('/admin/dashboard');
      } else {
        // Clear password after failed login
        setFormData(prev => ({ ...prev, password: '' }));
        throw new Error(result.errorMessage || 'Invalid credentials');
      }
    } catch (err) {
      toast({ title: 'Login Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Particles */}
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
              backgroundColor: `hsl(${particle.color === 'slate' ? '215' : particle.color === 'gray' ? '210' : particle.color === 'red' ? '0' : particle.color === 'orange' ? '25' : particle.color === 'yellow' ? '45' : particle.color === 'emerald' ? '150' : particle.color === 'blue' ? '220' : '270'}, 60%, 60%)`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(0.5px)',
              transition: 'all 0.025s linear'
            }}
          />
        ))}

        {/* Floating Medical Icons */}
        {/* <div className="absolute top-20 left-10 text-slate-300 animate-bounce">
          <Heart className="w-8 h-8" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        </div>
        <div className="absolute top-32 right-16 text-red-300 animate-bounce">
          <Stethoscope className="w-10 h-10" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        </div>
        <div className="absolute bottom-40 left-20 text-orange-300 animate-bounce">
          <Shield className="w-6 h-6" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
        </div>
        <div className="absolute bottom-20 right-32 text-emerald-300 animate-bounce">
          <Activity className="w-8 h-8" style={{ animationDelay: '0.5s', animationDuration: '3.2s' }} />
        </div>
        <div className="absolute top-40 left-1/2 text-blue-300 animate-bounce">
          <Users className="w-7 h-7" style={{ animationDelay: '1.5s', animationDuration: '3.8s' }} />
        </div>
        <div className="absolute bottom-60 right-20 text-purple-300 animate-bounce">
          <FileText className="w-6 h-6" style={{ animationDelay: '2.5s', animationDuration: '3.3s' }} />
        </div> */}

        {/* Rotating Plus Signs */}
        <div className="absolute top-16 right-1/4 text-yellow-300 animate-spin">
          <Plus className="w-5 h-5" style={{ animationDuration: '8s' }} />
        </div>
        <div className="absolute bottom-32 left-1/3 text-red-300 animate-spin">
          <Plus className="w-4 h-4" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
        </div>
        <div className="absolute top-1/2 right-10 text-purple-300 animate-spin">
          <Plus className="w-6 h-6" style={{ animationDuration: '10s' }} />
        </div>
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-600 relative z-10 backdrop-blur-sm bg-white/95">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Portal</CardTitle>
          <CardDescription>Secure access for system administrators</CardDescription>
        </CardHeader>

        

        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Admin ID</Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter admin identifier"
                value={formData.identifier}
                onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                disabled={isGoogleLoading}
                autoComplete="off"
                autoFocus={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isGoogleLoading}
                autoComplete="new-password"
                autoFocus={false}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (<span>Authenticating...</span>) : (<><LogIn className="w-4 h-4 mr-2" />Admin Login</>)}
            </Button>
            <p className="text-sm text-center text-gray-600">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sky-600 hover:text-sky-700 font-medium"
                disabled={isLoading || isGoogleLoading}
              >
                ← Back to User Login
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;