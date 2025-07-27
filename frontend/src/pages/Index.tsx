import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users, FileText, Shield, LogIn, UserPlus, Stethoscope, Activity, Package, MapPin, Phone, Mail, Clock, Star, Heart, ArrowRight, Sparkles, Plus, Circle, Triangle } from 'lucide-react';
import '../styles/animations.css';

const Index = () => {
  const navigate = useNavigate();
  const [heroAnimation, setHeroAnimation] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [servicesVisible, setServicesVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Create animated particles
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) { // Increased from 30 to 50 particles
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 10 + 3, // Varied sizes (3-13px)
          speedX: (Math.random() - 0.5) * 1.5, // Even faster movement
          speedY: (Math.random() - 0.5) * 1.5,
          opacity: Math.random() * 0.8 + 0.2, // Enhanced visibility
          color: ['sky', 'blue', 'cyan', 'indigo', 'purple', 'emerald', 'pink', 'amber'][Math.floor(Math.random() * 8)] // More color options
        });
      }
      setParticles(newParticles);
    };

    createParticles();

    const animationTimer = setTimeout(() => {
      setHeroAnimation(true);
    }, 300);

    const statsTimer = setTimeout(() => {
      setStatsVisible(true);
    }, 800);

    const servicesTimer = setTimeout(() => {
      setServicesVisible(true);
    }, 1200);

    const featuresTimer = setTimeout(() => {
      setFeaturesVisible(true);
    }, 1600);

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

    const particleInterval = setInterval(animateParticles, 25); // Even faster updates for smoother animation

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(statsTimer);
      clearTimeout(servicesTimer);
      clearTimeout(featuresTimer);
      clearInterval(particleInterval);
    };
  }, []);

  const stats = [
    { number: "12.5K+", label: "Happy Patients", icon: Heart },
    { number: "450+", label: "Expert Doctors", icon: Users },
    { number: "28+", label: "Medical Services", icon: Stethoscope },
    { number: "24/7", label: "Emergency Care", icon: Shield }
  ];

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

  const healthServices = [
    {
      icon: Stethoscope,
      title: 'HEALTH DIAGNOSIS',
      description: 'At PulseIQ Diagnostic Centre, we offer precise and prompt diagnostic services using state-of-the-art technology and expert medical insight. Our commitment is to provide accurate health evaluations that form the foundation of effective treatment.',
      image: 'https://queencreekhealth.com/wp-content/uploads/2021/05/sidepic3.jpg',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Activity,
      title: 'HEALTH CONSULTATION',
      description: 'PulseIQ Diagnostic Centre offers expert health consultations tailored to your individual needs. Our experienced physicians provide clear, compassionate guidance, helping you make informed decisions about your health.',
      image: 'https://media.vanguardcommunications.net/photo-VCG-HPI-COVID19-Male-Doc-Male-Pt-2000px.jpg',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Package,
      title: 'HEALTH PACKAGES',
      description: 'Discover a proactive approach to wellness with our specially designed health packages at PulseIQ Diagnostic Centre. Each package is curated to offer comprehensive screenings for early detection and peace of mind.',
      image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      color: 'from-purple-500 to-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 relative overflow-hidden">
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

        {/* Enhanced Floating Medical Icons with More Variety */}
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
        
        {/* Enhanced Plus Signs with More Colors */}
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center group">
              <div className="w-10 h-10 bg-gradient-to-r from-sky-600 to-blue-600 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">PulseIQ</h1>
                <p className="text-sm text-gray-500">Healthcare Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Navigation Menu */}
              <div className="hidden md:flex space-x-3">
                <Button 
                  variant="ghost" 
                  className="bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 hover:from-sky-200 hover:to-blue-200 hover:text-sky-800 font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-sky-200 hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Home
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/about-us')} 
                  className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 hover:from-emerald-200 hover:to-green-200 hover:text-emerald-800 font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-emerald-200 hover:scale-105"
                >
                  About Us
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/see-doctors')} 
                  className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 hover:from-purple-200 hover:to-violet-200 hover:text-purple-800 font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-purple-200 hover:scale-105"
                >
                  See Doctors
                </Button>
              </div>
              
              {/* Auth Buttons */}
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/login')}
                  className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300 font-medium shadow-sm hover:scale-105 transition-transform duration-200"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/register')} 
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-4xl md:text-6xl font-bold text-gray-900 mb-8 transition-all duration-1000 ${heroAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="inline">Healthcare </span>
            <span className="text-sky-600 inline bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Management
            </span>
          </h2>
          <p className={`text-xl text-gray-600 mb-8 max-w-2xl mx-auto transition-all duration-1000 delay-300 ${heroAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            PulseIQ connects <b className="text-sky-600">patients</b>, <b className="text-emerald-600">doctors</b>, <b className="text-purple-600">technicians</b>, and <b className="text-red-600">administrators</b> in one
            comprehensive healthcare management platform designed for efficiency and care.
          </p>
          
          {/* Animated Stats Section */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 transition-all duration-1000 delay-500 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-sky-100">
                  <stat.icon className="w-8 h-8 text-sky-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Healthcare Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 ${servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Our Healthcare Services
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive healthcare solutions designed to meet all your medical needs
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ${servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {healthServices.map((service, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-500 border-0 shadow-lg group hover:scale-105 hover:-translate-y-2">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2 group-hover:text-sky-600 transition-colors duration-300">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {service.description}
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300 font-medium group/btn transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={() => {
                      // Navigate to respective service pages
                      if (service.title === 'HEALTH DIAGNOSIS') {
                        navigate('/health-diagnosis');
                      } else if (service.title === 'HEALTH CONSULTATION') {
                        navigate('/health-consultation');
                      } else if (service.title === 'HEALTH PACKAGES') {
                        navigate('/health-packages');
                      }
                    }}
                  >
                    <span className="mr-2">View Details</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Designed for Every Healthcare Role
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Empowering healthcare professionals with cutting-edge technology
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-300 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-500 border-0 shadow-md group hover:scale-105 hover:-translate-y-2">
                <CardHeader>
                  <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-sky-600 transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
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
          <Card className="border-0 shadow-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 backdrop-blur-sm"></div>
            <CardContent className="p-12 relative z-10">
              <div className="absolute top-4 right-4 opacity-20">
                <Sparkles className="w-16 h-16 text-white animate-pulse" />
              </div>
              <div className="absolute bottom-4 left-4 opacity-10">
                <Heart className="w-12 h-12 text-white animate-bounce" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of healthcare professionals who trust PulseIQ for their practice management needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  onClick={() => navigate('/register')}
                  className="hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h3>
            <p className="text-lg text-gray-600">Get in touch with our healthcare team</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-700 mb-4">
                    PulseIQ Diagnostic & Healthcare Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                      <p className="text-gray-600">
                        House 48, Road 9/A, Dhanmondi<br />
                        Dhaka-1209, Bangladesh
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Phone Numbers</h4>
                      <div className="text-gray-600 space-y-1">
                        <p>+88 01 68115270-2</p>
                        <p>+88 01 78114040-1</p>
                        <p>+88 01 91019590-2</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                      <p className="text-gray-600">pulseiq@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Working Hours</h4>
                      <div className="text-gray-600 space-y-1">
                        <p>Monday - Saturday: 8:00 AM - 10:00 PM</p>
                        <p>Sunday: 9:00 AM - 8:00 PM</p>
                        <p>Emergency: 24/7</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-gray-900">Location Map</h4>
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.9034374944986!2d90.37588831534558!3d23.746466884586755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDQ0JzQ3LjMiTiA5MMKwMjInMzcuMiJF!5e0!3m2!1sen!2sus!4v1642684421234!5m2!1sen!2sus&q=House+48,+Road+9/A,+Dhanmondi,+Dhaka-1209,+Bangladesh"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="PulseIQ Location Map"
                  ></iframe>
                </div>
              </Card>
              <div className="text-center">
                <Button 
                  variant="outline" 
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 transition-all duration-200"
                  onClick={() => window.open('https://maps.google.com/?q=House+48,+Road+9/A,+Dhanmondi,+Dhaka-1209,+Bangladesh', '_blank')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Larger Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="flex items-center justify-center mb-4 group">
            <div className="w-8 h-8 bg-gradient-to-r from-sky-600 to-blue-600 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200 shadow-lg">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">PulseIQ</span>
          </div>
          <p className="text-gray-400 hover:text-gray-300 transition-colors duration-200">
            © 2025 PulseIQ Healthcare Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
