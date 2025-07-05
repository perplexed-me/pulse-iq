import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users, FileText, Shield, LogIn, UserPlus } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: User,
      title: 'Patient Portal',
      description: 'Access your medical records, book appointments, and communicate with your healthcare team.',
      color: 'bg-green-500'
    },
    {
      icon: Users,
      title: 'Doctor Dashboard',
      description: 'Manage patient care, review medical records, and streamline your practice workflow.',
      color: 'bg-blue-500'
    },
    {
      icon: FileText,
      title: 'Technician Tools',
      description: 'Process lab results, manage equipment, and coordinate with medical staff.',
      color: 'bg-purple-500'
    },
    {
      icon: Shield,
      title: 'Admin Control',
      description: 'System administration, user management, and comprehensive oversight tools.',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center mr-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PulseIQ</h1>
                <p className="text-sm text-gray-500">Healthcare Management System</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => navigate('/login')}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')} className="bg-sky-600 hover:bg-sky-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Register
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-sky-600 block">Healthcare Management</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            PulseIQ connects <b>patients</b>, <b>doctors</b>, <b>technicians</b>, and <b>administrators</b> in one
            comprehensive healthcare management platform designed for efficiency and care.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Designed for Every Healthcare Role
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardHeader>
                  <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-xl mb-8 opacity-90">
                
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" onClick={() => navigate('/register')}>
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center mr-3">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">PulseIQ</span>
          </div>
          <p className="text-gray-400">
            © 2025 PulseIQ Healthcare Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
