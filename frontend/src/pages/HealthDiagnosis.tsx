import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Stethoscope, CheckCircle, Clock, Users, MapPin, Phone, Mail } from 'lucide-react';

const HealthDiagnosis = () => {
  const navigate = useNavigate();

  const diagnosticServices = [
    {
      name: 'Complete Blood Count (CBC)',
      description: 'Comprehensive blood analysis to detect various disorders',
      duration: '30 minutes',
      price: 'BDT 800'
    },
    {
      name: 'X-Ray Imaging',
      description: 'Digital X-ray services for bone and organ examination',
      duration: '15 minutes',
      price: 'BDT 1,200'
    },
    {
      name: 'ECG/EKG',
      description: 'Electrocardiogram to monitor heart rhythm and function',
      duration: '20 minutes',
      price: 'BDT 600'
    },
    {
      name: 'Ultrasound',
      description: 'Advanced ultrasound imaging for internal organ assessment',
      duration: '45 minutes',
      price: 'BDT 2,500'
    },
    {
      name: 'CT Scan',
      description: 'Computed tomography for detailed cross-sectional imaging',
      duration: '60 minutes',
      price: 'BDT 8,000'
    },
    {
      name: 'MRI',
      description: 'Magnetic resonance imaging for detailed soft tissue examination',
      duration: '90 minutes',
      price: 'BDT 15,000'
    }
  ];

  const benefits = [
    'State-of-the-art diagnostic equipment',
    'Experienced medical technologists',
    'Fast and accurate results',
    'Digital report delivery',
    'Comprehensive health screening packages',
    'Emergency diagnostic services available 24/7'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-sky-600 to-blue-600 rounded-full flex items-center justify-center mr-3">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Health Diagnosis</h1>
                <p className="text-sm text-gray-500">Advanced Diagnostic Services</p>
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
            Precision Healthcare <span className="text-sky-600">Diagnostics</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            At PulseIQ Diagnostic Centre, we offer precise and prompt diagnostic services using state-of-the-art technology and expert medical insight. Our commitment is to provide accurate health evaluations that form the foundation of effective treatment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
            >
              Book Appointment
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/register')}
            >
              Create Account
            </Button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Diagnostic Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {diagnosticServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-sky-600">{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{service.description}</CardDescription>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration}
                    </span>
                    <span className="font-semibold text-sky-600">{service.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Why Choose Our Diagnostic Services?</h3>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <img 
              src="https://queencreekhealth.com/wp-content/uploads/2021/05/sidepic3.jpg" 
              alt="Diagnostic Equipment"
              className="rounded-lg shadow-lg w-full h-96 object-cover"
            />
          </div>
        </div>

        {/* Contact Section */}
        <Card className="bg-gradient-to-r from-sky-600 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Schedule Your Diagnostic Test?</h3>
            <p className="text-xl mb-6 opacity-90">
              Contact us today to book your appointment or learn more about our services
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
              Book Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthDiagnosis;
