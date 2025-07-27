import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Search, ArrowLeft, CheckCircle, X, Filter, FileText, Clipboard, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG, apiCall } from '@/config/api';


interface Doctor {
  doctorId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  degree: string;
  isAvailable: boolean;
  fullName: string;
  profilePicture?: string; // base64 encoded image
  consultationFee?: number;
}

interface DoctorAvailability {
  doctorId: string;
  isAvailable: boolean;
  availableDays: string; // comma-separated days like "MONDAY,TUESDAY,FRIDAY"
  availableTimeStart: string; // HH:MM format
  availableTimeEnd: string; // HH:MM format
}

interface AppointmentData {
  doctorId: string;
  appointmentDate: string;
  reason: string;
  notes: string;
}

const BookAppointment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    doctorId: '',
    appointmentDate: '',
    reason: '',
    notes: ''
  });
  
  const [dateTimeConfirmed, setDateTimeConfirmed] = useState(false);
  const [tempDateTime, setTempDateTime] = useState('');
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability | null>(null);

  // Clear any stale appointment data when component mounts
  useEffect(() => {
    // Only clear data if no valid payment completion state exists
    const paymentData = getPaymentCompletionData();
    if (!paymentData?.paymentCompleted) {
      // Reset component state to ensure clean slate for new bookings
      setAppointmentData({
        doctorId: '',
        appointmentDate: '',
        reason: '',
        notes: ''
      });
      setSelectedDoctor(null);
      setSelectedSpecialization(undefined);
      setSearchQuery('');
      setDateTimeConfirmed(false);
      setTempDateTime('');
      setDoctorAvailability(null);
    }
  }, [user?.id]); // Re-run when user changes

  // Check authentication before proceeding
  useEffect(() => {
    if (!user || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book an appointment.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
  }, [user, token, navigate, toast]);

  // Clean up when user changes to prevent data leakage between users
  useEffect(() => {
    return () => {
      // Reset all form state when user changes
      setAppointmentData({
        doctorId: '',
        appointmentDate: '',
        reason: '',
        notes: ''
      });
      setSelectedDoctor(null);
      setSelectedSpecialization(undefined);
      setSearchQuery('');
      setDateTimeConfirmed(false);
      setTempDateTime('');
      setDoctorAvailability(null);
    };
  }, [user?.id]);

  // Cleanup effect - Don't clear payment data when navigating away
  useEffect(() => {
    return () => {
      // Only clear pending payment data if user is going to payment or payment-result pages
      // This allows users to navigate freely and return to complete booking
      if (location.pathname === '/payment' || location.pathname === '/payment-result') {
        // Don't clear anything when going to payment pages
        return;
      }
      
      // Don't clear payment completion data - let it persist until booking is complete
      // This allows users to leave and come back to complete their booking
    };
  }, [location.pathname, user?.id]);

  // Utility function to get payment completion data
  const getPaymentCompletionData = () => {
    const locationState = location.state as any;
    const userId = user?.id || 'guest';
    
    // Check both sessionStorage (for immediate navigation) and localStorage (for persistence)
    const sessionData = sessionStorage.getItem(`paymentCompletionData_${userId}`);
    const persistentData = localStorage.getItem(`paymentCompletionData_${userId}`);
    
    // Also check for old format without user-specific key (for backward compatibility)
    const oldFormatData = localStorage.getItem('paymentCompletionData');
    
    let paymentData = locationState;
    
    // If no location state, check sessionStorage first, then localStorage, then old format
    if (!locationState?.paymentCompleted) {
      if (sessionData) {
        try {
          paymentData = JSON.parse(sessionData);
          // Move from sessionStorage to localStorage for persistence
          localStorage.setItem(`paymentCompletionData_${userId}`, sessionData);
          sessionStorage.removeItem(`paymentCompletionData_${userId}`);
        } catch (error) {
          console.error('Error parsing session payment completion data:', error);
          sessionStorage.removeItem(`paymentCompletionData_${userId}`);
        }
      } else if (persistentData) {
        try {
          paymentData = JSON.parse(persistentData);
        } catch (error) {
          console.error('Error parsing persistent payment completion data:', error);
          localStorage.removeItem(`paymentCompletionData_${userId}`);
        }
      } else if (oldFormatData) {
        try {
          paymentData = JSON.parse(oldFormatData);
          // Migrate old format to new user-specific format
          localStorage.setItem(`paymentCompletionData_${userId}`, oldFormatData);
          localStorage.removeItem('paymentCompletionData');
          console.log('Migrated old payment completion data to user-specific format');
        } catch (error) {
          console.error('Error parsing old format payment completion data:', error);
          localStorage.removeItem('paymentCompletionData');
        }
      }
    } else {
      // If we have location state, also store it in localStorage for persistence
      localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(locationState));
    }
    
    return paymentData;
  };

  // Check if current state is from a payment completion (either online or cash)
  const isFromPaymentCompletion = () => {
    const paymentData = getPaymentCompletionData();
    return paymentData?.paymentCompleted || false;
  };

  // Function to clear payment completion data and start fresh
  const clearBookingData = () => {
    const userId = user?.id || 'guest';
    localStorage.removeItem(`paymentCompletionData_${userId}`);
    sessionStorage.removeItem(`paymentCompletionData_${userId}`);
    // Also remove old format data for backward compatibility
    localStorage.removeItem('paymentCompletionData');
    
    // Reset all state
    setAppointmentData({
      doctorId: '',
      appointmentDate: '',
      reason: '',
      notes: ''
    });
    setSelectedDoctor(null);
    setSelectedSpecialization(undefined);
    setSearchQuery('');
    setDateTimeConfirmed(false);
    setTempDateTime('');
    setDoctorAvailability(null);
    
    toast({
      title: "Booking Reset",
      description: "Your booking data has been cleared. You can start fresh.",
    });
  };

  useEffect(() => {
    if (token) {
      fetchSpecializations();
      fetchAllDoctors();
    }
  }, [token]);

  useEffect(() => {
    filterDoctors();
  }, [selectedSpecialization, searchQuery, allDoctors]);

  useEffect(() => {
    // Handle payment completion state from both location.state and localStorage
    const paymentData = getPaymentCompletionData();
    
    console.log('BookAppointment - Payment completion data:', paymentData);
    console.log('BookAppointment - Location state:', location.state);
    console.log('BookAppointment - Persistent data:', localStorage.getItem(`paymentCompletionData_${user?.id || 'guest'}`));
    
    if (paymentData?.paymentCompleted && paymentData?.appointmentDetails && paymentData?.doctorInfo) {
      console.log('Restoring appointment data after payment completion');
      
      // Set appointment data from payment completion
      setAppointmentData({
        doctorId: paymentData.appointmentDetails.doctorId,
        appointmentDate: paymentData.appointmentDetails.appointmentDate,
        reason: paymentData.appointmentDetails.reason,
        notes: paymentData.appointmentDetails.notes
      });
      
      // Restore date/time picker state
      if (paymentData.appointmentDetails.appointmentDate) {
        setTempDateTime(paymentData.appointmentDetails.appointmentDate);
        setDateTimeConfirmed(true);
      }
      
      // Set selected doctor info
      const doctorInfo = paymentData.doctorInfo;
      const doctorName = doctorInfo.doctorName || '';
      const nameParts = doctorName.split(' ');
      
      const restoredDoctor = {
        doctorId: paymentData.appointmentDetails.doctorId,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        specialization: doctorInfo.specialization || '',
        degree: '',
        isAvailable: true,
        fullName: doctorName,
        consultationFee: doctorInfo.consultationFee || 0,
        profilePicture: doctorInfo.profilePicture || undefined
      };
      
      setSelectedDoctor(restoredDoctor);
      
      // Clear filters to ensure the doctor is visible in the list
      setSelectedSpecialization(undefined);
      setSearchQuery('');
      
      console.log('Appointment data restored:', {
        appointmentData: {
          doctorId: paymentData.appointmentDetails.doctorId,
          appointmentDate: paymentData.appointmentDetails.appointmentDate,
          reason: paymentData.appointmentDetails.reason,
          notes: paymentData.appointmentDetails.notes
        },
        selectedDoctor: restoredDoctor
      });
    } else if (paymentData?.paymentCompleted) {
      console.warn('Payment completed but missing appointment details or doctor info:', paymentData);
      toast({
        title: "Warning",
        description: "Payment completed but appointment details are missing. Please select a doctor again.",
        variant: "destructive"
      });
    }
  }, [location.state, allDoctors]); // Added allDoctors as dependency

  const fetchSpecializations = async () => {
    if (!token) {
      console.error('No token available for fetching specializations');
      return;
    }

    try {
      const response = await apiCall(API_CONFIG.APPOINTMENTS.SPECIALIZATIONS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSpecializations(data);
      } else {
        console.error('Failed to fetch specializations:', response.status);
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Authentication Error",
            description: "Please log in again.",
            variant: "destructive"
          });
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const fetchAllDoctors = async () => {
    if (!token) {
      console.error('No token available for fetching doctors');
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall(API_CONFIG.APPOINTMENTS.DOCTORS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Doctors API response:', data);
        setAllDoctors(data);
        setFilteredDoctors(data);
      } else {
        console.error('Failed to fetch doctors:', response.status);
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Authentication Error",
            description: "Please log in again.",
            variant: "destructive"
          });
          navigate('/login');
        } else {
          toast({
            title: "Error",
            description: "Failed to load doctors. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = allDoctors;

    if (selectedSpecialization) {
      filtered = filtered.filter(doctor => 
        doctor.specialization.toLowerCase().includes(selectedSpecialization.toLowerCase())
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(doctor => 
        doctor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setAppointmentData(prev => ({ ...prev, doctorId: doctor.doctorId }));
    // Fetch availability when doctor is selected
    fetchDoctorAvailability(doctor.doctorId);
  };

  const fetchDoctorAvailability = async (doctorId: string) => {
    try {
      const response = await apiCall(API_CONFIG.DOCTORS.AVAILABILITY(doctorId), {
        method: 'GET'
      });

      if (response.ok) {
        const availability = await response.json();
        setDoctorAvailability(availability);
        console.log('Doctor availability:', availability);
      } else {
        console.error('Failed to fetch doctor availability');
        toast({
          title: "Warning",
          description: "Could not fetch doctor availability. Please contact support.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
    }
  };

  const validateAppointmentDateTime = (dateTimeString: string): string | null => {
    if (!doctorAvailability) {
      return "Doctor availability information is not loaded.";
    }

    const appointmentDate = new Date(dateTimeString);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    
    // Check if doctor is available on this day
    const availableDays = doctorAvailability.availableDays?.split(',').map(day => day.trim()) || [];
    if (!availableDays.includes(dayOfWeek)) {
      const availableDayNames = availableDays.map(day => 
        day.charAt(0) + day.slice(1).toLowerCase()
      ).join(', ');
      return `Doctor is not available on ${dayOfWeek.toLowerCase()}. Available days: ${availableDayNames}`;
    }

    // Check if appointment time is within doctor's available hours
    if (doctorAvailability.availableTimeStart && doctorAvailability.availableTimeEnd) {
      const appointmentTime = appointmentDate.toTimeString().slice(0, 5); // HH:MM format
      
      // Convert times to minutes for proper comparison
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const appointmentMinutes = timeToMinutes(appointmentTime);
      const startMinutes = timeToMinutes(doctorAvailability.availableTimeStart);
      const endMinutes = timeToMinutes(doctorAvailability.availableTimeEnd);
      
      if (appointmentMinutes < startMinutes || appointmentMinutes > endMinutes) {
        return `Doctor is not available at ${appointmentTime}. Available time: ${doctorAvailability.availableTimeStart} - ${doctorAvailability.availableTimeEnd}`;
      }
    }

    // Additional warning about potential conflicts
    console.log('Frontend validation passed for:', dateTimeString);
    console.log('Note: Backend may still reject if there are existing appointments within 1 hour of this time');

    return null; // Valid appointment time
  };

  const handleInputChange = (field: keyof AppointmentData, value: string) => {
    setAppointmentData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateTimeChange = (value: string) => {
    setTempDateTime(value);
    setDateTimeConfirmed(false);
  };

  const confirmDateTime = () => {
    if (tempDateTime) {
      // Validate against doctor availability
      const validationError = validateAppointmentDateTime(tempDateTime);
      if (validationError) {
        toast({
          title: "Invalid Appointment Time",
          description: validationError,
          variant: "destructive"
        });
        return;
      }

      setAppointmentData(prev => ({ ...prev, appointmentDate: tempDateTime }));
      setDateTimeConfirmed(true);
    }
  };

  const editDateTime = () => {
    setTempDateTime(appointmentData.appointmentDate);
    setDateTimeConfirmed(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctor) {
      toast({
        title: "Error",
        description: "Please select a doctor",
        variant: "destructive"
      });
      return;
    }

    if (!appointmentData.appointmentDate) {
      toast({
        title: "Error",
        description: "Please select an appointment date and time",
        variant: "destructive"
      });
      return;
    }

    // Check if we're returning from payment (payment completed)
    const paymentData = getPaymentCompletionData();
    const paymentCompleted = paymentData?.paymentCompleted || false;
    const paymentMethod = paymentData?.paymentMethod || 'online';

    console.log('Payment completed:', paymentCompleted);
    console.log('Payment method:', paymentMethod);
    console.log('Payment data:', paymentData);

    if (paymentCompleted) {
      console.log('Proceeding with appointment booking after payment...');
      
      // Check if we still have a valid token
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to complete your appointment booking.",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Book appointment after successful payment
      try {
        setSubmitting(true);
        
        // Validate required fields before sending
        if (!appointmentData.doctorId || !appointmentData.appointmentDate) {
          toast({
            title: "Validation Error",
            description: "Doctor ID and appointment date are required.",
            variant: "destructive"
          });
          setSubmitting(false);
          return;
        }

        // Format the date properly for Spring Boot LocalDateTime parsing
        let formattedAppointmentDate = appointmentData.appointmentDate;
        
        // Simply add seconds if missing - don't convert through Date object to avoid timezone issues
        if (formattedAppointmentDate.includes('T') && formattedAppointmentDate.split('T')[1].split(':').length === 2) {
          formattedAppointmentDate = `${formattedAppointmentDate}:00`;
        }

        const requestBody = {
          doctorId: appointmentData.doctorId,
          appointmentDate: formattedAppointmentDate, // Properly formatted for LocalDateTime parsing
          reason: appointmentData.reason || "", // Ensure it's not null
          notes: appointmentData.notes || "" // Ensure it's not null
        };

        console.log('Sending appointment request:', requestBody);
        console.log('Original appointmentDate:', appointmentData.appointmentDate);
        console.log('Formatted appointmentDate:', formattedAppointmentDate);

        const response = await apiCall(API_CONFIG.APPOINTMENTS.BOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const appointmentResponse = await response.json();
          
          // Clear all payment data after successful booking
          const userId = user?.id || 'guest';
          const pendingPaymentKey = `pendingPayment_${userId}`;
          localStorage.removeItem(pendingPaymentKey);
          localStorage.removeItem(`paymentCompletionData_${userId}`);
          sessionStorage.removeItem(`paymentCompletionData_${userId}`);
          
          toast({
            title: "Success",
            description: "Appointment booked successfully!",
          });
          navigate('/patient/dashboard');
        } else {
          if (response.status === 401 || response.status === 403) {
            toast({
              title: "Authentication Error",
              description: "Please log in again to complete your appointment booking.",
              variant: "destructive"
            });
            navigate('/login');
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Failed to book appointment' }));
            toast({
              title: "Error",
              description: errorData.error || "Failed to book appointment",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Error booking appointment:', error);
        toast({
          title: "Error",
          description: "Failed to book appointment. Please try again.",
          variant: "destructive"
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      // Redirect to payment page for online payment
      const appointmentDetails = {
        doctorId: appointmentData.doctorId,
        appointmentDate: appointmentData.appointmentDate,
        reason: appointmentData.reason,
        notes: appointmentData.notes
      };

      const doctorInfo = {
        doctorName: selectedDoctor.firstName + ' ' + selectedDoctor.lastName,
        specialization: selectedDoctor.specialization,
        consultationFee: selectedDoctor.consultationFee || 0,
        profilePicture: selectedDoctor.profilePicture
      };

      navigate('/payment', {
        state: {
          appointmentDetails,
          doctorInfo,
          consultationFee: selectedDoctor.consultationFee || 0
        }
      });
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60); // Minimum 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  const getAvailabilityMessage = () => {
    if (!doctorAvailability) {
      return "Loading doctor availability...";
    }

    const availableDayNames = doctorAvailability.availableDays?.split(',').map(day => 
      day.trim().charAt(0) + day.trim().slice(1).toLowerCase()
    ).join(', ') || 'Not set';

    const timeRange = doctorAvailability.availableTimeStart && doctorAvailability.availableTimeEnd
      ? `${doctorAvailability.availableTimeStart} - ${doctorAvailability.availableTimeEnd}`
      : 'Not set';

    return `Available: ${availableDayNames} | Time: ${timeRange}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-gray-50 to-green-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Professional Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/patient/dashboard')}
              className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-2xl border border-blue-200 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Book Your Appointment
                </h1>
                <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mt-1"></div>
              </div>
            </div>
            <p className="text-gray-600 font-medium">
              Schedule an appointment with our available doctors for personalized healthcare.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Find a Doctor */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg shadow-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded-lg shadow-sm">
                    <Filter className="h-5 w-5" />
                  </div>
                  Find a Doctor
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Filter and search for a doctor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gray-50/50">
                {/* Show payment completion status if applicable */}
                {(() => {
                  const paymentData = getPaymentCompletionData();
                  if (paymentData?.paymentCompleted) {
                    return (
                      <div className="mb-4 p-4 border rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
                        <div className="text-sm font-medium text-green-800 flex items-center gap-2">
                          <div className="p-1 bg-green-500 rounded-full shadow-sm">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                          {paymentData.paymentMethod === 'cash' 
                            ? 'Cash Payment Selected'
                            : 'Payment Completed'
                          }
                        </div>
                        <div className="text-xs text-green-700 mt-1 ml-6">
                          {paymentData.paymentMethod === 'cash' 
                            ? 'You can still modify your appointment details'
                            : 'Your appointment details are locked'
                          }
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Specialization Filter */}
                <div className="space-y-3">
                  <Label htmlFor="specialization" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    Specialization
                  </Label>
                  <Select value={selectedSpecialization} onValueChange={(value) => setSelectedSpecialization(value === "all" ? undefined : value)}>
                    <SelectTrigger className="border-2 border-blue-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 shadow-sm">
                      <SelectValue placeholder="All Specializations" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-blue-200 shadow-xl bg-white">
                      <SelectItem value="all" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg m-1">All Specializations</SelectItem>
                      {specializations.map((spec) => (
                        <SelectItem key={spec} value={spec} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg m-1">{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Enhanced Search Input */}
                <div className="space-y-3">
                  <Label htmlFor="search" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                    Search Doctor
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-sm">
                      <Search className="h-3 w-3 text-white" />
                    </div>
                    <Input
                      id="search"
                      placeholder="Search by doctor name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 border-2 border-emerald-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 rounded-xl bg-gradient-to-r from-emerald-50/50 to-teal-50/50 hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 shadow-sm"
                    />
                  </div>
                </div>
                
                {/* Enhanced Results Summary */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-md">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-orange-800">
                      {loading ? (
                        "Loading doctors..."
                      ) : (
                        `Available ${filteredDoctors.length} doctor${filteredDoctors.length !== 1 ? 's' : ''}`
                      )}
                    </span>
                    {!loading && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse ml-auto"></div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Available Doctors */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg shadow-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded-lg shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                  Available Doctors
                </CardTitle>
                <CardDescription className="text-green-100">
                  {(() => {
                    const paymentData = getPaymentCompletionData();
                    const paymentCompleted = paymentData?.paymentCompleted || false;
                    const paymentMethod = paymentData?.paymentMethod || 'online';
                    
                    if (paymentCompleted && paymentMethod === 'online') {
                      return 'Doctor selection locked after online payment completion';
                    } else if (paymentCompleted && paymentMethod === 'cash') {
                      return 'Selected doctor for cash payment - editable if needed';
                    } else {
                      return 'Select a doctor from the list';
                    }
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-gray-50/50">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading doctors...</p>
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="mt-2 text-gray-700 font-medium">No doctors found</p>
                    <p className="text-sm text-gray-500">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {(() => {
                      const paymentData = getPaymentCompletionData();
                      const isPaymentCompleted = paymentData?.paymentCompleted || false;
                      let doctorsToShow = [...filteredDoctors];
                      
                      // If payment is completed and selected doctor is not in filtered list, add it
                      if (isPaymentCompleted && selectedDoctor && !doctorsToShow.find(d => d.doctorId === selectedDoctor.doctorId)) {
                        doctorsToShow.unshift(selectedDoctor);
                      }
                      
                      // Ensure we show at least the selected doctor if no doctors are filtered
                      if (doctorsToShow.length === 0 && selectedDoctor) {
                        doctorsToShow = [selectedDoctor];
                      }
                      
                      return doctorsToShow.map((doctor) => {
                        const isDisabled = isPaymentCompleted && paymentData?.paymentMethod === 'online' && selectedDoctor?.doctorId !== doctor.doctorId;
                        const isSelected = selectedDoctor?.doctorId === doctor.doctorId;
                        
                        return (
                          <div
                            key={doctor.doctorId}
                            className={`p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl ${
                              isDisabled 
                                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
                                : `${
                                    isSelected
                                      ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-xl'
                                      : 'border-gray-200 hover:border-green-300 bg-white hover:bg-gradient-to-r hover:from-green-50/30 hover:to-emerald-50/30'
                                  }`
                            }`}
                            onClick={() => !isDisabled && handleDoctorSelect(doctor)}
                          >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 flex-shrink-0 border-2 border-green-200 shadow-lg">
                                {doctor.profilePicture ? (
                                  <img 
                                    src={`data:image/jpeg;base64,${doctor.profilePicture}`}
                                    alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 text-green-600" />
                                )}
                              </div>
                              {isSelected && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                Dr. {doctor.firstName} {doctor.lastName}
                              </h3>
                              <p className="text-sm text-blue-600 font-medium truncate">{doctor.specialization}</p>
                              <p className="text-xs text-gray-500 truncate">{doctor.degree}</p>
                              {doctor.consultationFee && (
                                <p className="text-sm text-green-600 font-semibold mt-1">৳{doctor.consultationFee}</p>
                              )}
                            </div>
                            {isPaymentCompleted && isSelected && (
                              <div className="text-green-600">
                                <CheckCircle className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Appointment Details */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-t-lg shadow-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded-lg shadow-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Appointment Details
                </CardTitle>
                <CardDescription className="text-purple-100">
                  {selectedDoctor 
                    ? `${(() => {
                        const paymentData = getPaymentCompletionData();
                        const paymentCompleted = paymentData?.paymentCompleted || false;
                        
                        return paymentCompleted ? 'Locked - ' : '';
                      })()}Book with Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`
                    : 'Select a doctor to continue'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-gray-50/50">
                {selectedDoctor ? (
                  <div className="space-y-6">
                    {/* Selected Doctor Info */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-purple-300 shadow-sm">
                          {selectedDoctor.profilePicture ? (
                            <img 
                              src={`data:image/jpeg;base64,${selectedDoctor.profilePicture}`}
                              alt={`Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-purple-900">
                            Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                          </h3>
                          <p className="text-blue-600 text-sm font-medium">{selectedDoctor.specialization}</p>
                          {selectedDoctor.consultationFee && (
                            <p className="text-green-600 text-sm font-semibold">Fee: ৳{selectedDoctor.consultationFee}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Date and Time Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-sm">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <Label htmlFor="datetime" className="font-semibold text-gray-700">Date & Time *</Label>
                      </div>
                      
                      {/* Doctor Availability Information */}
                      {selectedDoctor && (
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                          <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {getAvailabilityMessage()}
                          </p>
                        </div>
                      )}
                      
                      {!dateTimeConfirmed ? (
                        <div className="space-y-4">
                          {/* Date/Time Input */}
                          <div className="relative">
                            <Input
                              id="datetime"
                              type="datetime-local"
                              value={tempDateTime}
                              onChange={(e) => handleDateTimeChange(e.target.value)}
                              min={getMinDateTime()}
                              required
                              disabled={(() => {
                                const paymentData = getPaymentCompletionData();
                                return paymentData?.paymentCompleted && paymentData?.paymentMethod === 'online';
                              })()}
                              className={`py-3 text-base border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 shadow-sm ${(() => {
                                const paymentData = getPaymentCompletionData();
                                return (paymentData?.paymentCompleted && paymentData?.paymentMethod === 'online') ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-gradient-to-r from-white to-purple-50/20 hover:shadow-md';
                              })()}`}
                              style={{
                                colorScheme: 'light',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                          
                          {/* Confirm Button */}
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              onClick={confirmDateTime}
                              size="lg"
                              disabled={!tempDateTime}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm Date & Time
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border-2 border-green-300 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <div className="flex flex-col border border-green-200 rounded px-3 py-2">
                            <span className="text-green-700 font-semibold text-sm">{new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                            <span className="text-green-700 font-semibold text-sm">{new Date(appointmentData.appointmentDate).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}</span>
                          </div>
                          <Button 
                            type="button" 
                            onClick={editDateTime} 
                            variant="outline" 
                            className="border-green-300 text-green-700 px-3 py-1 text-sm rounded"
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Reason Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-sm">
                          <Clipboard className="h-4 w-4 text-white" />
                        </div>
                        <Label htmlFor="reason" className="font-semibold text-gray-700">Reason for Visit</Label>
                      </div>
                      <Input
                        id="reason"
                        placeholder="e.g., Regular checkup, Consultation, Follow-up"
                        value={appointmentData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        disabled={(() => {
                          const paymentData = getPaymentCompletionData();
                          return paymentData?.paymentCompleted && paymentData?.paymentMethod === 'online';
                        })()}
                        className={`py-3 text-base border-2 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 shadow-sm ${(() => {
                          const paymentData = getPaymentCompletionData();
                          return (paymentData?.paymentCompleted && paymentData?.paymentMethod === 'online') ? 'bg-gray-100 cursor-not-allowed' : 'bg-gradient-to-r from-white to-pink-50/20 hover:shadow-md';
                        })()}`}
                      />
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <Label htmlFor="notes" className="font-semibold text-gray-700">Additional Notes</Label>
                      </div>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information, symptoms, or special requests..."
                        value={appointmentData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={4}
                        disabled={(() => {
                          const paymentData = getPaymentCompletionData();
                          return paymentData?.paymentCompleted && paymentData?.paymentMethod === 'online';
                        })()}
                        className={`py-3 text-base border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 resize-none shadow-sm ${(() => {
                          const paymentData = getPaymentCompletionData();
                          return (paymentData?.paymentCompleted && paymentData?.paymentMethod === 'online') ? 'bg-gray-100 cursor-not-allowed' : 'bg-gradient-to-r from-white to-teal-50/20 hover:shadow-md';
                        })()}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">No doctor selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Please select a doctor from the list to continue.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment and Book Appointment Section */}
        {selectedDoctor && (
          <div className="mt-8 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
              {/* Payment Completed Message - Only for online payments */}
              {(() => {
                const paymentData = getPaymentCompletionData();
                const paymentCompleted = paymentData?.paymentCompleted || false;
                const paymentMethod = paymentData?.paymentMethod || 'online';
                
                if (paymentCompleted && paymentMethod === 'online') {
                  return (
                    <Card className="mb-6 shadow-sm border border-green-200">
                      <CardHeader className="bg-green-50 border-b border-green-200">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-green-800">
                          <CheckCircle className="w-5 h-5" />
                          Payment Completed Successfully
                        </CardTitle>
                        <CardDescription className="text-green-600">Your online payment has been processed. You can now complete your appointment booking.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 p-4 border border-green-200 rounded-lg bg-green-50">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <div className="font-semibold text-green-800">Online Payment - Completed</div>
                          </div>
                          <div className="text-green-700 font-semibold">
                            ৳{selectedDoctor.consultationFee || 'Free'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                return null;
              })()}

              {/* Cash Payment Message */}
              {(() => {
                const paymentData = getPaymentCompletionData();
                const paymentCompleted = paymentData?.paymentCompleted || false;
                const paymentMethod = paymentData?.paymentMethod || 'online';
                
                if (paymentCompleted && (paymentMethod === 'cash' || paymentMethod === 'later')) {
                  return (
                    <Card className="mb-6 shadow-sm border border-orange-200">
                      <CardHeader className="bg-orange-50 border-b border-orange-200">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-orange-800">
                          <CheckCircle className="w-5 h-5" />
                          Cash Payment Selected
                        </CardTitle>
                        <CardDescription className="text-orange-600">You will pay during your visit at the clinic</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 p-4 border border-orange-200 rounded-lg bg-orange-50">
                          <CheckCircle className="w-5 h-5 text-orange-600" />
                          <div className="flex-1">
                            <div className="font-semibold text-orange-800">Pay at Clinic</div>
                            <div className="text-sm text-orange-600">Payment will be collected during your appointment</div>
                          </div>
                          <div className="text-orange-700 font-semibold">
                            ৳{selectedDoctor.consultationFee || 'Free'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                return null;
              })()}

              {/* Book Appointment Button */}
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                disabled={submitting || !appointmentData.appointmentDate}
              >
                {submitting ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Booking Appointment...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5" />
                    <span>{(() => {
                      const paymentData = getPaymentCompletionData();
                      const paymentCompleted = paymentData?.paymentCompleted || false;
                      
                      if (paymentCompleted) {
                        return `Book Appointment with Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`;
                      } else {
                        return `Make Payment & Book Appointment`;
                      }
                    })()}</span>
                  </div>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
