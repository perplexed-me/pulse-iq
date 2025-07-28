import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Star, MapPin, Clock, Phone, Mail, Calendar, Heart, Stethoscope, Shield, Activity, FileText, Plus } from 'lucide-react';
import { API_CONFIG, apiCall } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

interface Doctor {
  doctorId: string;
  firstName: string;
  lastName: string;
  degree: string;
  specialization: string;
  licenseNumber: string;
  consultationFee: number;
  email: string;
  phone: string;
  status?: string;
  profilePicture?: string;
}

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

const SeeDoctors = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);

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

    fetchDoctors();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDoctors();
    }, 5000);

    // Cleanup intervals on unmount
    return () => {
      clearInterval(particleInterval);
      clearInterval(interval);
    };
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchDoctors = async () => {
    try {
      // First, get the list of doctors from appointments endpoint
      console.log('Fetching doctors list from:', API_CONFIG.APPOINTMENTS.DOCTORS);
      const response = await apiCall(API_CONFIG.APPOINTMENTS.DOCTORS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Note: Removed authorization header as it might be causing issues
        }
      });
      
      if (response.ok) {
        const doctorsList = await response.json();
        console.log('Doctors list received:', doctorsList);
        
        if (Array.isArray(doctorsList) && doctorsList.length > 0) {
          // Filter for available doctors first - be more permissive
          const availableDoctors = doctorsList.filter((doctor: any) => {
            // Only exclude doctors if they are explicitly marked as unavailable
            const isExplicitlyUnavailable = doctor.isAvailable === false || 
                                          doctor.status === 'INACTIVE' || 
                                          doctor.status === 'REJECTED' || 
                                          doctor.status === 'SUSPENDED' ||
                                          doctor.approved === false;
            
            const isActive = !isExplicitlyUnavailable;
            console.log(`Doctor ${doctor.firstName || doctor.fullName} isAvailable:`, doctor.isAvailable, 'status:', doctor.status, 'filtered as active:', isActive);
            return isActive;
          });

          // If no doctors pass the filter, show all doctors (fallback)
          const doctorsToProcess = availableDoctors.length > 0 ? availableDoctors : doctorsList;
          console.log(`Processing ${doctorsToProcess.length} doctors (${availableDoctors.length} available, ${doctorsList.length} total)`);

          // Try to fetch complete profile data for each doctor, but fallback gracefully
          const doctorProfiles = await Promise.all(
            doctorsToProcess.map(async (doctor: any) => {
              const doctorId = doctor.doctorId || doctor.id;
              console.log(`Trying to fetch profile for doctor ${doctorId}`);
              
              try {
                const profileResponse = await apiCall(API_CONFIG.DOCTORS.PROFILE(doctorId), {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json'
                    // Note: Removed authorization header as it might be causing issues
                  }
                });

                if (profileResponse.ok) {
                  const profileData = await profileResponse.json();
                  console.log(`✅ Profile data for ${doctorId}:`, profileData);
                  // Merge the profile data with the original doctor data
                  return {
                    ...doctor,
                    ...profileData, // Profile data takes precedence
                    profilePicture: doctor.profilePicture || profileData.profilePicture // Keep original profile picture if it exists
                  };
                } else {
                  console.warn(`❌ Failed to fetch profile for ${doctorId} (${profileResponse.status}), using basic data`);
                  return doctor; // Fallback to basic data
                }
              } catch (error) {
                console.error(`❌ Error fetching profile for ${doctorId}:`, error);
                return doctor; // Fallback to basic data
              }
            })
          );

          // Process the data (either complete profiles or basic data)
          const processedDoctors = doctorProfiles.map((doctor: any, index: number) => {
            const fullName = doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
            const [firstName, ...lastNameParts] = fullName.split(' ');
            const lastName = lastNameParts.join(' ');
            
            const processedDoctor = {
              doctorId: doctor.doctorId || doctor.id || `DOC_${index + 1}`,
              firstName: doctor.firstName || firstName || 'Doctor',
              lastName: doctor.lastName || lastName || '',
              degree: doctor.degree || doctor.qualification || doctor.credentials || 'MBBS',
              specialization: doctor.specialization || doctor.specialty || doctor.department || 'General Practice',
              // Use profile data if available, otherwise empty
              licenseNumber: doctor.licenseNumber || doctor.license_number || doctor.medicalLicense || doctor.licenseNo || '',
              consultationFee: Number(doctor.consultationFee || doctor.consultation_fee || doctor.fee || 0),
              // Use profile data if available, otherwise empty
              email: doctor.email || doctor.emailAddress || '',
              phone: doctor.phone || doctor.phoneNumber || doctor.contactNumber || '',
              status: doctor.status || doctor.availability || 'Available',
              profilePicture: doctor.profilePicture || doctor.profile_picture || doctor.avatar || doctor.image || ''
            };
            
            console.log(`✅ Processed doctor ${index + 1}:`, processedDoctor);
            return processedDoctor;
          });
          
          console.log('✅ Final processed doctors:', processedDoctors);
          setDoctors(processedDoctors);
        } else {
          console.log('No valid doctor data received');
          setDoctors([]);
        }
      } else {
        console.error('API response not ok:', response.status, response.statusText);
        setDoctors([]);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const getSpecializationColor = (specialization: string) => {
    if (!specialization) return 'bg-slate-100 text-slate-800';
    
    const colors = {
      'Cardiology': 'bg-red-100 text-red-800 border-red-200',
      'Neurology': 'bg-purple-100 text-purple-800 border-purple-200',
      'Pediatrics': 'bg-green-100 text-green-800 border-green-200',
      'Orthopedics': 'bg-blue-100 text-blue-800 border-blue-200',
      'Dermatology': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Internal Medicine': 'bg-gray-100 text-gray-800 border-gray-200',
      'Psychiatry': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Gynecology': 'bg-pink-100 text-pink-800 border-pink-200',
      'Surgery': 'bg-orange-100 text-orange-800 border-orange-200',
      'General Practice': 'bg-teal-100 text-teal-800 border-teal-200',
      'Radiology': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Oncology': 'bg-rose-100 text-rose-800 border-rose-200',
      'Anesthesiology': 'bg-violet-100 text-violet-800 border-violet-200',
      'Emergency Medicine': 'bg-red-100 text-red-800 border-red-200',
      'Ophthalmology': 'bg-amber-100 text-amber-800 border-amber-200',
      'ENT': 'bg-lime-100 text-lime-800 border-lime-200',
      'Urology': 'bg-sky-100 text-sky-800 border-sky-200',
      'default': 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return colors[specialization as keyof typeof colors] || colors.default;
  };

  const handleBookAppointment = (doctorId: string) => {
    // Navigate to login if not authenticated, with return path
    navigate(`/login?returnTo=/book-appointment/${doctorId}`);
  };

  const handleRegisterPatient = () => {
    navigate('/register');
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 relative overflow-hidden">
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
              backgroundColor: `hsl(${particle.color === 'sky' ? '200' : particle.color === 'blue' ? '220' : particle.color === 'cyan' ? '180' : particle.color === 'indigo' ? '240' : particle.color === 'purple' ? '270' : particle.color === 'emerald' ? '150' : particle.color === 'pink' ? '330' : '45'}, 70%, 70%)`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(0.5px)',
              transition: 'all 0.025s linear'
            }}
          />
        ))}

        {/* Floating Medical Icons */}
        <div className="absolute top-20 left-10 text-blue-200 animate-bounce">
          <Heart className="w-8 h-8" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        </div>
        <div className="absolute top-32 right-16 text-sky-200 animate-bounce">
          <Stethoscope className="w-10 h-10" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        </div>
        <div className="absolute bottom-40 left-20 text-purple-200 animate-bounce">
          <Shield className="w-6 h-6" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
        </div>
        <div className="absolute bottom-20 right-32 text-emerald-200 animate-bounce">
          <Activity className="w-8 h-8" style={{ animationDelay: '0.5s', animationDuration: '3.2s' }} />
        </div>
        <div className="absolute top-40 left-1/2 text-indigo-200 animate-bounce">
          <Users className="w-7 h-7" style={{ animationDelay: '1.5s', animationDuration: '3.8s' }} />
        </div>
        <div className="absolute bottom-60 right-20 text-pink-200 animate-bounce">
          <FileText className="w-6 h-6" style={{ animationDelay: '2.5s', animationDuration: '3.3s' }} />
        </div>

        {/* Rotating Plus Signs */}
        <div className="absolute top-16 right-1/4 text-cyan-200 animate-spin">
          <Plus className="w-5 h-5" style={{ animationDuration: '8s' }} />
        </div>
        <div className="absolute bottom-32 left-1/3 text-amber-200 animate-spin">
          <Plus className="w-4 h-4" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
        </div>
        <div className="absolute top-1/2 right-10 text-violet-200 animate-spin">
          <Plus className="w-6 h-6" style={{ animationDuration: '10s' }} />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm relative z-10">
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
      <section className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Meet Our <span className="text-sky-600">Medical Team</span>
          </h2>
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
            Our experienced healthcare professionals are here to provide you with the best medical care. 
            Browse our specialists and book an appointment that fits your schedule.
          </p>
        </div>
      </section>

      {/* Doctors Grid */}
      <section className="py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading our medical team...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">No Doctors Available</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                We're currently updating our doctor database. Please try refreshing or contact support for assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => {
                    setLoading(true);
                    fetchDoctors();
                  }} 
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.map((doctor) => (
                <Card key={doctor.doctorId} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center pb-4">
                    <div className="w-28 h-28 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-xl ring-4 ring-white ring-opacity-50">
                      {doctor.profilePicture ? (
                        <img 
                          src={
                            doctor.profilePicture.startsWith('data:') 
                              ? doctor.profilePicture 
                              : doctor.profilePicture.startsWith('http') 
                                ? doctor.profilePicture
                                : doctor.profilePicture.startsWith('/9j/') || doctor.profilePicture.startsWith('iVBORw0')
                                  ? `data:image/jpeg;base64,${doctor.profilePicture}`
                                  : `${API_CONFIG.USER_APPOINTMENT_BASE_URL}/api/doctors/${doctor.doctorId}/profile-picture`
                          }
                          alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const initialsDiv = document.createElement('div');
                            initialsDiv.className = 'w-full h-full flex items-center justify-center text-white font-bold text-2xl';
                            const firstInitial = doctor.firstName && doctor.firstName.length > 0 ? doctor.firstName[0] : 'D';
                            const lastInitial = doctor.lastName && doctor.lastName.length > 0 ? doctor.lastName[0] : 'R';
                            initialsDiv.textContent = `${firstInitial}${lastInitial}`;
                            target.parentElement!.appendChild(initialsDiv);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl">
                          {(doctor.firstName && doctor.firstName.length > 0 ? doctor.firstName[0] : 'D')}
                          {(doctor.lastName && doctor.lastName.length > 0 ? doctor.lastName[0] : 'R')}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                      Dr. {doctor.firstName} {doctor.lastName || ''}
                    </CardTitle>
                    {doctor.degree && (
                      <CardDescription className="text-gray-600 font-medium text-lg">
                        {doctor.degree}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    {doctor.specialization && (
                      <div className="flex justify-center">
                        <Badge className={`${getSpecializationColor(doctor.specialization)} px-4 py-2 text-sm font-semibold border`}>
                          {doctor.specialization}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="space-y-3 text-sm">
                      {/* Doctor ID - Always show */}
                      <div className="flex items-center text-gray-700 bg-slate-50 p-3 rounded-lg">
                        <Users className="w-5 h-5 mr-3 text-slate-600 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-900">Doctor ID:</span>
                          <span className="ml-2 font-mono text-slate-700">{doctor.doctorId}</span>
                        </div>
                      </div>
                      
                      {/* License Number - Only show if it exists */}
                      {doctor.licenseNumber && (
                        <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                          <Star className="w-5 h-5 mr-3 text-yellow-500 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-900">License:</span>
                            <span className="ml-2">{doctor.licenseNumber}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Email - Only show if it exists */}
                      {doctor.email && (
                        <div className="flex items-center text-gray-700 bg-blue-50 p-3 rounded-lg">
                          <Mail className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-gray-900">Email:</span>
                            <div className="text-blue-700 break-all text-sm mt-1">{doctor.email}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Phone - Only show if it exists */}
                      {doctor.phone && (
                        <div className="flex items-center text-gray-700 bg-purple-50 p-3 rounded-lg">
                          <Phone className="w-5 h-5 mr-3 text-purple-600 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-900">Phone:</span>
                            <span className="ml-2 text-purple-700 font-medium">{doctor.phone}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Consultation Fee - Only show if greater than 0 */}
                      {doctor.consultationFee > 0 && (
                        <div className="flex items-center text-gray-700 bg-green-50 p-3 rounded-lg">
                          <Clock className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-900">Consultation Fee:</span>
                            <span className="ml-2 text-green-700 font-bold">৳{doctor.consultationFee}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 px-3 py-1">
                          ● Available
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <Button 
                          className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={() => handleBookAppointment(doctor.doctorId)}
                        >
                          <Calendar className="w-5 h-5 mr-2" />
                          Book Appointment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white/50 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-4">Need Help Choosing?</h3>
              <p className="text-xl mb-8 opacity-90">
                Our patient support team is here to help you find the right specialist for your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" onClick={handleRegisterPatient}>
                  Register as Patient
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-sky-600"
                  onClick={() => {
                    navigate('/');
                    setTimeout(() => {
                      const contactSection = document.getElementById('contact');
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.location.hash = '#contact';
                      }
                    }, 200);
                  }}
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 relative z-10">
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

export default SeeDoctors;
