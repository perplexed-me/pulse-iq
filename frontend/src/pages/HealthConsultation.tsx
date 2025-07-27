import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Activity, CheckCircle, Clock, Users, MapPin, Phone, Mail, Star } from 'lucide-react';

const HealthConsultation = () => {
  const navigate = useNavigate();

  const consultationTypes = [
    {
      name: 'General Health Consultation',
      description: 'Comprehensive health assessment and general medical advice',
      duration: '30 minutes',
      price: 'BDT 1,500'
    },
    {
      name: 'Specialist Consultation',
      description: 'Expert consultation with specialized doctors',
      duration: '45 minutes',
      price: 'BDT 2,500'
    },
    {
      name: 'Follow-up Consultation',
      description: 'Progress monitoring and treatment adjustments',
      duration: '20 minutes',
      price: 'BDT 1,000'
    },
    {
      name: 'Emergency Consultation',
      description: 'Urgent medical consultation for immediate concerns',
      duration: '60 minutes',
      price: 'BDT 3,000'
    },
    {
      name: 'Telemedicine Consultation',
      description: 'Remote consultation via video call',
      duration: '25 minutes',
      price: 'BDT 1,200'
    },
    {
      name: 'Health Screening Consultation',
      description: 'Preventive health check-up and lifestyle advice',
      duration: '40 minutes',
      price: 'BDT 2,000'
    }
  ];

  const specializations = [
    'Internal Medicine',
    'Cardiology',
    'Pediatrics',
    'Gynecology',
    'Orthopedics',
    'Dermatology',
    'Neurology',
    'Psychiatry',
    'Endocrinology',
    'Gastroenterology'
  ];

  const benefits = [
    'Board-certified physicians',
    'Personalized treatment plans',
    'Comprehensive health assessments',
    'Same-day appointments available',
    'Digital health records',
    'Follow-up care coordination',
    'Multilingual consultation services',
    'Insurance coverage accepted'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-green-600 rounded-full flex items-center justify-center mr-3">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Health Consultation</h1>
                <p className="text-sm text-gray-500">Expert Medical Guidance</p>
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
            Expert Health <span className="text-emerald-600">Consultations</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            PulseIQ Diagnostic Centre offers expert health consultations tailored to your individual needs. Our experienced physicians provide clear, compassionate guidance, helping you make informed decisions about your health.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/see-doctors')}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              See Our Doctors
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Book Consultation
            </Button>
          </div>
        </div>

        {/* Consultation Types */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">Consultation Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {consultationTypes.map((consultation, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-emerald-600">{consultation.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{consultation.description}</CardDescription>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {consultation.duration}
                    </span>
                    <span className="font-semibold text-emerald-600">{consultation.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Specializations & Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Medical Specializations</h3>
            <div className="grid grid-cols-2 gap-3">
              {specializations.map((spec, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-emerald-50 rounded-lg">
                  <Star className="w-4 h-4 text-emerald-500" />
                  <span className="text-gray-700 text-sm">{spec}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Why Choose Our Consultation Services?</h3>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="mb-16">
          <img 
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
            alt="Doctor Consultation"
            className="rounded-lg shadow-lg w-full h-96 object-cover"
          />
        </div>

        {/* Contact Section */}
        <Card className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Schedule Your Consultation?</h3>
            <p className="text-xl mb-6 opacity-90">
              Book an appointment with our expert physicians today
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
              onClick={() => navigate('/see-doctors')}
              className="hover:scale-105 transition-transform duration-200"
            >
              Book Consultation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthConsultation;
