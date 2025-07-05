import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Search, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://132.196.64.104:8085";

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

interface AppointmentData {
  doctorId: string;
  appointmentDate: string;
  reason: string;
  notes: string;
}

const BookAppointment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token } = useAuth();
  
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

  useEffect(() => {
    if (token) {
      fetchSpecializations();
      fetchAllDoctors();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    filterDoctors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecialization, searchQuery, allDoctors]);

  const fetchSpecializations = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/appointments/specializations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSpecializations(data);
      } else {
        console.error('Failed to fetch specializations');
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const fetchAllDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/appointments/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllDoctors(data);
        setFilteredDoctors(data);
      } else {
        console.error('Failed to fetch doctors');
        toast({
          title: "Error",
          description: "Failed to load doctors. Please try again.",
          variant: "destructive"
        });
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
  };

  const handleInputChange = (field: keyof AppointmentData, value: string) => {
    setAppointmentData(prev => ({ ...prev, [field]: value }));
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

    try {
      setSubmitting(true);
      
      const requestBody = {
        doctorId: appointmentData.doctorId,
        appointmentDate: appointmentData.appointmentDate,
        reason: appointmentData.reason,
        notes: appointmentData.notes
      };

      const response = await fetch(`${BASE_URL}/api/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const appointmentResponse = await response.json();
        toast({
          title: "Success",
          description: "Appointment booked successfully!",
        });
        navigate('/patient/dashboard');
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to book appointment",
          variant: "destructive"
        });
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
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60); // Minimum 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/patient/dashboard')}
            className="mb-2 w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-600">Schedule an appointment with our available doctors</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Find a Doctor */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Find a Doctor</CardTitle>
                <CardDescription>Filter and search for a doctor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Specialization Filter */}
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Select value={selectedSpecialization} onValueChange={(value) => setSelectedSpecialization(value === "all" ? undefined : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Specializations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specializations</SelectItem>
                      {specializations.map((spec) => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Search Input */}
                <div>
                  <Label htmlFor="search">Search Doctor</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by doctor name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {/* Results Summary */}
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {loading ? (
                    "Loading doctors..."
                  ) : (
                    `Found ${filteredDoctors.length} doctor${filteredDoctors.length !== 1 ? 's' : ''}`
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Available Doctors */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Available Doctors</CardTitle>
                <CardDescription>Select a doctor from the list</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading doctors...</p>
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-600">No doctors found</p>
                    <p className="text-sm text-gray-500">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {filteredDoctors.map((doctor) => (
                      <div
                        key={doctor.doctorId}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedDoctor?.doctorId === doctor.doctorId
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-blue-100 flex-shrink-0">
                            {doctor.profilePicture ? (
                              <img 
                                src={`data:image/jpeg;base64,${doctor.profilePicture}`}
                                alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm truncate">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </h3>
                            <p className="text-xs text-gray-600 truncate">{doctor.specialization}</p>
                            <p className="text-xs text-gray-500 truncate">{doctor.degree}</p>
                            {doctor.consultationFee && (
                              <p className="text-xs text-green-600 font-medium">Fee: ${doctor.consultationFee}</p>
                            )}
                          </div>
                          {selectedDoctor?.doctorId === doctor.doctorId && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Appointment Details */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
                <CardDescription>
                  {selectedDoctor 
                    ? `Book with Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`
                    : 'Select a doctor to continue'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDoctor ? (
                  <div className="space-y-4">
                    {/* Selected Doctor Info */}
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-blue-100">
                        {selectedDoctor.profilePicture ? (
                          <img 
                            src={`data:image/jpeg;base64,${selectedDoctor.profilePicture}`}
                            alt={`Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{selectedDoctor.specialization}</p>
                        {selectedDoctor.consultationFee && (
                          <p className="text-sm text-green-600 font-medium">Fee: ${selectedDoctor.consultationFee}</p>
                        )}
                      </div>
                    </div>

                    {/* Date and Time */}
                    <div>
                      <Label htmlFor="datetime">Date & Time *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="datetime"
                          type="datetime-local"
                          value={appointmentData.appointmentDate}
                          onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                          min={getMinDateTime()}
                          required
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Reason */}
                    <div>
                      <Label htmlFor="reason">Reason for Visit</Label>
                      <Input
                        id="reason"
                        placeholder="e.g., Regular checkup, Consultation"
                        value={appointmentData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information"
                        value={appointmentData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No doctor selected</h3>
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
            {/* Online Payment Option */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Options</CardTitle>
                <CardDescription>Choose your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" id="online-payment" name="payment" value="online" defaultChecked className="text-blue-600" />
                    <label htmlFor="online-payment" className="flex-1 cursor-pointer">
                      <div className="font-medium">Online Payment</div>
                      <div className="text-sm text-gray-500">Pay securely with credit/debit card or digital wallet</div>
                    </label>
                    <div className="text-green-600 font-medium">
                      {selectedDoctor.consultationFee ? `$${selectedDoctor.consultationFee}` : 'Free'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" id="pay-later" name="payment" value="later" className="text-blue-600" />
                    <label htmlFor="pay-later" className="flex-1 cursor-pointer">
                      <div className="font-medium">Pay at Clinic</div>
                      <div className="text-sm text-gray-500">Pay during your visit at the clinic</div>
                    </label>
                    <div className="text-green-600 font-medium">
                      {selectedDoctor.consultationFee ? `$${selectedDoctor.consultationFee}` : 'Free'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Appointment Button */}
            <form onSubmit={handleSubmit}>
              <Button 
                type="submit" 
                className="w-full h-12 text-lg" 
                disabled={submitting || !appointmentData.appointmentDate}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Booking Appointment...
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 mr-2" />
                    Book Appointment with Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </>
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
