import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Heart, Shield, Users, Globe, Award, Clock, ChevronLeft, ChevronRight, Play, Pause, Stethoscope, Activity, FileText, Plus } from 'lucide-react';
import { API_CONFIG, apiCall } from '@/config/api';

const AboutUs = () => {
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);
  const [animatedStats, setAnimatedStats] = useState({
    patientsServed: 0,
    healthcareProviders: 0,
    medicalFacilities: 0,
    systemUptime: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);

  // Healthcare management images
  const carouselImages = [
    {
      url: 'https://plus.unsplash.com/premium_photo-1682141249206-c0b64fc1857c?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      title: 'Advanced Medical Consultation',
      description: 'State-of-the-art consultation rooms with modern healthcare technology'
    },
    {
      url: 'https://www.medicaldevice-network.com/wp-content/uploads/sites/23/2019/10/shutterstock_774671815.jpg',
      title: 'Digital Health Records',
      description: 'Secure digital patient records and healthcare data management'
    },
    {
      url: 'https://plus.unsplash.com/premium_photo-1681843126728-04eab730febe?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      title: 'Healthcare Team Collaboration',
      description: 'Seamless collaboration between doctors, nurses, and healthcare staff'
    },
    {
      url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      title: 'Modern Medical Equipment',
      description: 'Cutting-edge medical technology for accurate diagnosis and treatment'
    },
    {
      url: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      title: 'Patient Care Excellence',
      description: 'Dedicated healthcare professionals providing compassionate patient care'
    },
    {
      url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      title: 'Laboratory Services',
      description: 'Advanced laboratory testing and diagnostic services'
    },
    {
      url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      title: 'Emergency Healthcare',
      description: '24/7 emergency medical services and critical care facilities'
    },
    {
      url: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      title: 'Telemedicine Solutions',
      description: 'Remote healthcare consultations and digital health monitoring'
    }
  ];

  // Target values for animation
  const targetStats = {
    patientsServed: 12500,
    healthcareProviders: 450,
    medicalFacilities: 28,
    systemUptime: 99.9
  };

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

    // Simulate loading and then start animation
    const loadingTimer = setTimeout(() => {
      setLoading(false);
      animateStats();
    }, 1000);

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
      clearTimeout(loadingTimer);
      clearInterval(particleInterval);
    };
  }, []);

  // Carousel auto-play effect
  useEffect(() => {
    if (!isCarouselPlaying) return;

    const carouselTimer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(carouselTimer);
  }, [currentImageIndex, isCarouselPlaying, carouselImages.length]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const toggleCarouselPlay = () => {
    setIsCarouselPlaying(!isCarouselPlaying);
  };

  const animateStats = () => {
    const duration = 2000; // 2 seconds
    const steps = 50;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedStats({
        patientsServed: Math.floor(targetStats.patientsServed * progress),
        healthcareProviders: Math.floor(targetStats.healthcareProviders * progress),
        medicalFacilities: Math.floor(targetStats.medicalFacilities * progress),
        systemUptime: parseFloat((targetStats.systemUptime * progress).toFixed(1))
      });
      
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats(targetStats);
      }
    }, interval);
  };

  const formatNumber = (num: number, isPercentage: boolean = false) => {
    if (isPercentage) {
      return `${num}%`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return `${num}+`;
  };

  const values = [
    {
      icon: Heart,
      title: 'Patient-Centered Care',
      description: 'Every decision we make puts patient health and well-being at the center.',
      color: 'bg-red-500'
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      description: 'Your medical data is protected with enterprise-grade security measures.',
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      title: 'Collaborative Healthcare',
      description: 'Connecting all healthcare stakeholders for seamless communication.',
      color: 'bg-green-500'
    },
    {
      icon: Globe,
      title: 'Accessible Technology',
      description: 'Making healthcare management accessible to everyone, everywhere.',
      color: 'bg-purple-500'
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
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About <span className="text-sky-600">PulseIQ</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            We're revolutionizing healthcare management by creating a unified platform that connects 
            patients, doctors, technicians, and administrators in one seamless ecosystem.
          </p>
        </div>
      </section>

      {/* Dynamic Image Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Our Healthcare Excellence
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of healthcare management through our comprehensive platform
            </p>
          </div>

          <div className="relative">
            {/* Main Carousel Container */}
            <Card className="overflow-hidden shadow-2xl border-0">
              <div className="relative h-96 md:h-[500px]">
                {/* Current Image */}
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={carouselImages[currentImageIndex].url}
                    alt={carouselImages[currentImageIndex].title}
                    className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Image Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h4 className="text-2xl font-bold mb-2">
                      {carouselImages[currentImageIndex].title}
                    </h4>
                    <p className="text-lg opacity-90">
                      {carouselImages[currentImageIndex].description}
                    </p>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-200 group"
                >
                  <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </button>
                
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-200 group"
                >
                  <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </button>

                {/* Play/Pause Button */}
                <button
                  onClick={toggleCarouselPlay}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-200 group"
                >
                  {isCarouselPlaying ? (
                    <Pause className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  ) : (
                    <Play className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>
            </Card>

            {/* Thumbnail Navigation */}
            <div className="flex justify-center mt-6 space-x-2 overflow-x-auto pb-2">
              {carouselImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'border-sky-500 shadow-lg scale-105' 
                      : 'border-gray-300 hover:border-sky-300 hover:scale-102'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center mt-4 space-x-2">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-sky-500 scale-125' 
                      : 'bg-gray-300 hover:bg-sky-300'
                  }`}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-sky-500 h-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${((currentImageIndex + 1) / carouselImages.length) * 100}%` 
                }}
              />
            </div>

            {/* Image Counter */}
            <div className="text-center mt-2 text-sm text-gray-500">
              {currentImageIndex + 1} of {carouselImages.length}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
              <p className="text-lg text-gray-600 mb-6">
                At PulseIQ, we believe that healthcare should be accessible, efficient, and patient-centered. 
                Our mission is to bridge the gap between healthcare providers and patients through innovative 
                technology solutions.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We empower healthcare professionals with the tools they need to deliver exceptional care 
                while giving patients the transparency and control they deserve over their health journey.
              </p>
              <div className="flex items-center space-x-4">
                <Award className="w-8 h-8 text-sky-600" />
                <span className="text-gray-700 font-medium">Healthcare Innovation Award 2024</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-sky-600 to-blue-600 rounded-lg p-8 text-white">
              <h4 className="text-2xl font-bold mb-4">Why Choose PulseIQ?</h4>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Clock className="w-5 h-5 mr-3" />
                  24/7 System Availability
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 mr-3" />
                  HIPAA Compliant Security
                </li>
                <li className="flex items-center">
                  <Users className="w-5 h-5 mr-3" />
                  Multi-Role Support
                </li>
                <li className="flex items-center">
                  <Globe className="w-5 h-5 mr-3" />
                  Cloud-Based Architecture
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These principles guide every decision we make and every feature we build.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`${value.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h3>
            <p className="text-lg text-gray-600">
              Numbers that reflect our commitment to healthcare excellence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {loading ? (
              <>
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl font-bold text-gray-300 mb-2 animate-pulse">...</div>
                    <div className="text-gray-400 font-medium animate-pulse">Loading...</div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-4xl font-bold text-sky-600 mb-2">{formatNumber(animatedStats.patientsServed)}</div>
                  <div className="text-gray-600 font-medium">Patients Served</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-sky-600 mb-2">{formatNumber(animatedStats.healthcareProviders)}</div>
                  <div className="text-gray-600 font-medium">Healthcare Providers</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-sky-600 mb-2">{formatNumber(animatedStats.medicalFacilities)}</div>
                  <div className="text-gray-600 font-medium">Medical Facilities</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-sky-600 mb-2">{formatNumber(animatedStats.systemUptime, true)}</div>
                  <div className="text-gray-600 font-medium">System Uptime</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Meet Our Team</h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our diverse team of healthcare professionals, engineers, and designers work together 
            to create the best possible healthcare management experience.
          </p>
          <Button 
            size="lg" 
            onClick={() => {
              navigate('/see-doctors');
              // Scroll to top after navigation
              setTimeout(() => window.scrollTo(0, 0), 100);
            }}
            className="bg-sky-600 hover:bg-sky-700"
          >
            See Our Medical Team
          </Button>
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

export default AboutUs;
