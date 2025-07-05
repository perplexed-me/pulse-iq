import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Phone, Mail, FileText, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG, apiCall } from '@/config/api';

interface Appointment {
  appointmentId: number;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledByRole?: 'PATIENT' | 'DOCTOR';
  cancellationReason?: string;
}

interface AppointmentListProps {
  userRole: 'patient' | 'doctor';
}

const AppointmentList: React.FC<AppointmentListProps> = ({ userRole }) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await apiCall(API_CONFIG.APPOINTMENTS.MY_APPOINTMENTS, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        console.error('Failed to fetch appointments');
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error", 
        description: "Failed to load appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateAppointmentStatus = async (appointmentId: number, status: 'CANCELLED' | 'COMPLETED') => {
    try {
      setUpdatingStatus(appointmentId);
      
      const response = await apiCall(API_CONFIG.APPOINTMENTS.UPDATE_STATUS(appointmentId, status), {
        method: 'PUT'
      });

      if (response.ok) {
        await fetchAppointments(); // Refresh the list
        toast({
          title: "Success",
          description: `Appointment ${status.toLowerCase()} successfully`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || `Failed to ${status.toLowerCase()} appointment`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: `Failed to ${status.toLowerCase()} appointment`,
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      setCancelling(appointmentId);
      
      const response = await apiCall(API_CONFIG.APPOINTMENTS.CANCEL(appointmentId), {
        method: 'PUT',
        body: JSON.stringify({
          cancellationReason: cancelReason
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Appointment cancelled successfully",
        });
        fetchAppointments(); // Refresh the list
        setCancelReason('');
        setSelectedAppointment(null);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to cancel appointment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      });
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (appointment: Appointment) => {
    switch (appointment.status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{appointment.status}</Badge>;
    }
  };

  const getCancellationInfo = (appointment: Appointment) => {
    if (appointment.status !== 'CANCELLED' || !appointment.cancelledByRole) {
      return null;
    }

    const isCancelledByCurrentUser = 
      (userRole === 'patient' && appointment.cancelledByRole === 'PATIENT') ||
      (userRole === 'doctor' && appointment.cancelledByRole === 'DOCTOR');

    if (isCancelledByCurrentUser) {
      return (
        <div className="flex items-center text-sm text-gray-600 mt-2">
          <Info className="w-4 h-4 mr-1" />
          <span>You cancelled this appointment</span>
        </div>
      );
    } else {
      const cancellerType = appointment.cancelledByRole === 'PATIENT' ? 'Patient' : 'Doctor';
      return (
        <div className="flex items-center text-sm text-orange-600 mt-2">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span>{cancellerType} cancelled this appointment</span>
          {appointment.cancelledByName && (
            <span className="ml-1">({appointment.cancelledByName})</span>
          )}
        </div>
      );
    }
  };

  const canCancelAppointment = (appointment: Appointment) => {
    return appointment.status === 'SCHEDULED' && new Date(appointment.appointmentDate) > new Date();
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const isUpcoming = (appointmentDate: string) => {
    return new Date(appointmentDate) > new Date();
  };

  const canComplete = (appointment: Appointment) => {
    return userRole === 'doctor' && appointment.status === 'SCHEDULED';
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {userRole === 'patient' ? 'My Appointments' : 'Patient Appointments'}
        </h2>
        <p className="text-gray-600">{appointments.length} total appointments</p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {userRole === 'patient' 
                ? "You haven't booked any appointments yet." 
                : "No patients have booked appointments with you yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const { date, time } = formatDateTime(appointment.appointmentDate);
            const upcoming = isUpcoming(appointment.appointmentDate);
            
            return (
              <Card key={appointment.appointmentId} className={upcoming ? 'border-l-4 border-l-blue-500' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {userRole === 'patient' ? (
                          <>
                            <User className="h-5 w-5" />
                            Dr. {appointment.doctorName}
                          </>
                        ) : (
                          <>
                            <User className="h-5 w-5" />
                            {appointment.patientName}
                          </>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {userRole === 'patient' && (
                          <span className="text-sm text-gray-600">{appointment.doctorSpecialization}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(appointment)}
                      {upcoming && <Badge variant="outline">Upcoming</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date and Time */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{time}</span>
                      </div>
                    </div>

                    {/* Reason and Notes */}
                    <div className="space-y-2">
                      {appointment.reason && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Reason:</p>
                            <p className="text-gray-600">{appointment.reason}</p>
                          </div>
                        </div>
                      )}
                      {appointment.notes && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Notes:</p>
                            <p className="text-gray-600">{appointment.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cancellation Information */}
                  {getCancellationInfo(appointment)}

                  {appointment.status === 'CANCELLED' && appointment.cancellationReason && (
                    <div className="text-sm bg-gray-50 p-2 rounded mt-2">
                      <span className="font-medium text-gray-700">Cancellation Reason: </span>
                      <span className="text-gray-600">{appointment.cancellationReason}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {(canCancelAppointment(appointment) || canComplete(appointment)) && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      {canCancelAppointment(appointment) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAppointment(appointment)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel Appointment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancel Appointment</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to cancel this appointment? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="cancel-reason">Cancellation Reason (Optional)</Label>
                                <Textarea
                                  id="cancel-reason"
                                  placeholder="Please provide a reason for cancellation..."
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  rows={3}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedAppointment(null);
                                  setCancelReason('');
                                }}
                              >
                                Keep Appointment
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleCancelAppointment(appointment.appointmentId)}
                                disabled={cancelling === appointment.appointmentId}
                              >
                                {cancelling === appointment.appointmentId ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel Appointment
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {canComplete(appointment) && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.appointmentId, 'COMPLETED')}
                          disabled={updatingStatus === appointment.appointmentId}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updatingStatus === appointment.appointmentId ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Appointment ID and Timestamps */}
                  <div className="text-xs text-gray-500 mt-4 pt-2 border-t">
                    <p>Appointment ID: {appointment.appointmentId}</p>
                    <p>Booked: {new Date(appointment.createdAt).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
