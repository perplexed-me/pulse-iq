import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, CheckCircle, Clock, Users, MapPin, Phone, Mail, Star, Heart, Shield } from 'lucide-react';

const HealthPackages = () => {
  const navigate = useNavigate();

  const healthPackages = [
    {
      name: 'Basic Health Checkup',
      description: 'Essential health screening for early detection',
      duration: '2-3 hours',
      price: 'BDT 5,000',
      tests: ['Complete Blood Count', 'Blood Sugar', 'Blood Pressure', 'BMI Check', 'General Physical Exam'],
      recommended: 'Ages 18-40'
    },
    {
      name: 'Comprehensive Health Package',
      description: 'Detailed health assessment with multiple screenings',
      duration: '4-5 hours',
      price: 'BDT 12,000',
      tests: ['All Basic Tests', 'Lipid Profile', 'Liver Function', 'Kidney Function', 'Thyroid Panel', 'ECG', 'Chest X-Ray'],
      recommended: 'Ages 40-60'
    },
    {
      name: 'Executive Health Package',
      description: 'Premium health screening for busy professionals',
      duration: 'Full Day',
      price: 'BDT 25,000',
      tests: ['All Comprehensive Tests', 'Cardiac Stress Test', 'Ultrasound Abdomen', 'Eye Examination', 'Dental Checkup', 'Nutritionist Consultation'],
      recommended: 'Ages 35+'
    },
    {
      name: 'Women\'s Health Package',
      description: 'Specialized screening for women\'s health needs',
      duration: '3-4 hours',
      price: 'BDT 15,000',
      tests: ['Gynecological Exam', 'Pap Smear', 'Breast Examination', 'Bone Density', 'Hormonal Profile', 'Iron Studies'],
      recommended: 'Women 25+'
    },
    {
      name: 'Senior Citizen Package',
      description: 'Comprehensive care for elderly health monitoring',
      duration: '4-6 hours',
      price: 'BDT 18,000',
      tests: ['Geriatric Assessment', 'Cognitive Screening', 'Fall Risk Assessment', 'Medication Review', 'Vision & Hearing Test'],
      recommended: 'Ages 65+'
    },
    {
      name: 'Cardiac Care Package',
      description: 'Specialized heart health screening and monitoring',
      duration: '3-4 hours',
      price: 'BDT 20,000',
      tests: ['ECG', 'Echocardiogram', 'Stress Test', 'Lipid Profile', 'Cardiac Enzymes', 'Cardiologist Consultation'],
      recommended: 'High Risk Patients'
    }
  ];

  const packageBenefits = [
    'Comprehensive health assessment',
    'Early disease detection',
    'Personalized health reports',
    'Expert physician consultation',
    'Follow-up recommendations',
    'Digital health records',
    'Priority booking for future services',
    'Health education materials'
  ];

  const features = [
    {
      icon: Shield,
      title: 'Preventive Care',
      description: 'Early detection saves lives and reduces treatment costs'
    },
    {
      icon: Heart,
      title: 'Holistic Health',
      description: 'Complete body system evaluation for optimal wellness'
    },
    {
      icon: Star,
      title: 'Expert Analysis',
      description: 'Detailed reports reviewed by specialist physicians'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Health Packages</h1>
                <p className="text-sm text-gray-500">Comprehensive Wellness Solutions</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Proactive Health <span className="text-purple-600">Packages</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Discover a proactive approach to wellness with our specially designed health packages at PulseIQ Diagnostic Centre. Each package is curated to offer comprehensive screenings for early detection and peace of mind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Choose Your Package
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-purple-600">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Health Packages */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Health Packages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {healthPackages.map((pkg, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow duration-300 relative">
                {pkg.name === 'Executive Health Package' && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg text-purple-600">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl font-bold text-purple-600">{pkg.price}</span>
                      <span className="text-sm text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {pkg.duration}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Recommended: {pkg.recommended}</p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-semibold text-gray-900 text-sm">Includes:</h5>
                    {pkg.tests.slice(0, 3).map((test, testIndex) => (
                      <div key={testIndex} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{test}</span>
                      </div>
                    ))}
                    {pkg.tests.length > 3 && (
                      <p className="text-sm text-purple-600 font-medium">+ {pkg.tests.length - 3} more tests</p>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    onClick={() => navigate('/login')}
                  >
                    Select Package
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits & Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Package Benefits</h3>
            <div className="space-y-4">
              {packageBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <img 
              src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
              alt="Health Package"
              className="rounded-lg shadow-lg w-full h-96 object-cover"
            />
          </div>
        </div>

        {/* Contact Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Invest in Your Health?</h3>
            <p className="text-xl mb-6 opacity-90">
              Choose the perfect health package for your needs and start your wellness journey today
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>+88 01 68115270-2</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>pulseiq@gmail.com</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Dhanmondi, Dhaka</span>
              </div>
            </div>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/login')}
              className="hover:scale-105 transition-transform duration-200"
            >
              Book Your Package
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthPackages;
