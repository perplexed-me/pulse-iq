import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Phone, Mail, FileText, X, CheckCircle, AlertCircle, Info, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG, apiCall } from '@/config/api';
import CreatePrescription from '../prescriptions/CreatePrescription';

interface Appointment {
  appointmentId: number;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
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
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [selectedPrescriptionAppointment, setSelectedPrescriptionAppointment] = useState<Appointment | null>(null);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousAppointmentsRef = useRef<Appointment[]>([]);

  // Check for changes and notify
  const checkForChanges = useCallback((newAppointments: Appointment[]) => {
    const previousAppointments = previousAppointmentsRef.current;
    
    if (previousAppointments.length > 0) {
      // Check for new appointments
      const newAppointmentsList = newAppointments.filter(
        newApp => !previousAppointments.find(prevApp => prevApp.appointmentId === newApp.appointmentId)
      );
      
      // Check for status changes
      const statusChanges = newAppointments.filter(newApp => {
        const prevApp = previousAppointments.find(prev => prev.appointmentId === newApp.appointmentId);
        return prevApp && prevApp.status !== newApp.status;
      });

      // Consolidate all changes into a single notification
      const totalChanges = newAppointmentsList.length + statusChanges.length;
      
      // if (totalChanges > 0) {
      //   let notificationTitle = "Appointment Updates";
      //   let notificationDescription = "";
        
      //   if (newAppointmentsList.length > 0 && statusChanges.length > 0) {
      //     notificationDescription = `${newAppointmentsList.length} new appointment(s) and ${statusChanges.length} status update(s)`;
      //   } else if (newAppointmentsList.length > 0) {
      //     notificationDescription = `${newAppointmentsList.length} new appointment(s) added`;
      //   } else if (statusChanges.length > 0) {
      //     notificationDescription = `${statusChanges.length} appointment(s) status updated`;
      //   }
        
      //   toast({
      //     title: notificationTitle,
      //     description: notificationDescription,
      //     duration: 5000,
      //   });
      // }
    }
    
    previousAppointmentsRef.current = [...newAppointments];
  }, [userRole, toast]);

  const fetchAppointments = useCallback(async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      
      const response = await apiCall(API_CONFIG.APPOINTMENTS.MY_APPOINTMENTS, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
        setLastUpdate(new Date());
        checkForChanges(data);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to load appointments",
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
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  }, [toast, checkForChanges]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchAppointments(true); // Initial load with spinner
    
    if (isAutoRefreshEnabled) {
      refreshIntervalRef.current = setInterval(() => {
        fetchAppointments(false); // Refresh without spinner
      }, 5000); // Refresh every 30 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchAppointments, isAutoRefreshEnabled]);

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(!isAutoRefreshEnabled);
    if (!isAutoRefreshEnabled) {
      // If enabling, start the interval
      refreshIntervalRef.current = setInterval(() => {
        fetchAppointments(false);
      }, 5000);
    } else {
      // If disabling, clear the interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }
  };

  const manualRefresh = () => {
    fetchAppointments(true);
  };

  const updateAppointmentStatus = async (appointmentId: number, status: 'CANCELLED' | 'COMPLETED') => {
    try {
      setUpdatingStatus(appointmentId);
      
      const response = await apiCall(API_CONFIG.APPOINTMENTS.UPDATE_STATUS(appointmentId, status), {
        method: 'PUT'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Appointment ${status.toLowerCase()} successfully`,
        });
        fetchAppointments(false); // Refresh without spinner
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
        
        // Create notification for appointment cancellation
        await createCancellationNotification(appointmentId);
        
        fetchAppointments(false); // Refresh the list
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

  const createCancellationNotification = async (appointmentId: number) => {
    try {
      const appointment = appointments.find(apt => apt.appointmentId === appointmentId);
      if (!appointment) return;

      // Create notification for the other party (not the one who cancelled)
      const targetRole = userRole === 'patient' ? 'doctor' : 'patient';
      const targetId = userRole === 'patient' ? appointment.doctorId : appointment.patientId;
      
      const notificationData = {
        title: "Appointment Cancelled",
        message: userRole === 'patient' 
          ? `Patient ${appointment.patientName} has cancelled their appointment`
          : `Dr. ${appointment.doctorName} has cancelled the appointment`,
        type: "APPOINTMENT_CANCELLED",
        recipientId: targetId,
        recipientType: targetRole.toUpperCase(),
        relatedEntityId: appointmentId.toString(),
        relatedEntityType: "APPOINTMENT",
        createdBy: userRole.toUpperCase()
      };

      console.log('Creating cancellation notification:', notificationData);

      // Try multiple potential API endpoints for notifications
      const endpoints = [
        API_CONFIG.NOTIFICATIONS.CREATE,
        `${API_CONFIG.USER_APPOINTMENT_BASE_URL}/api/notifications/create`,
        `${API_CONFIG.USER_APPOINTMENT_BASE_URL}/api/notification`
      ];

      let notificationCreated = false;
      for (const endpoint of endpoints) {
        try {
          const notificationResponse = await apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(notificationData)
          });

          if (notificationResponse.ok) {
            console.log('Notification created successfully via:', endpoint);
            notificationCreated = true;
            
            // Trigger notification refresh in other components
            window.dispatchEvent(new CustomEvent('notificationCreated', {
              detail: { 
                type: 'APPOINTMENT_CANCELLED',
                appointmentId: appointmentId,
                targetRole: targetRole
              }
            }));
            
            break;
          } else {
            console.log(`Failed to create notification via ${endpoint}:`, await notificationResponse.text());
          }
        } catch (error) {
          console.log(`Error trying endpoint ${endpoint}:`, error);
        }
      }

      if (!notificationCreated) {
        console.error('Failed to create cancellation notification via any endpoint');
        
        // Fallback: Create a client-side notification simulation
        const fallbackNotification = {
          id: Date.now(),
          title: "Appointment Cancelled",
          message: userRole === 'patient' 
            ? `Patient ${appointment.patientName} has cancelled appointment`
            : `Dr. ${appointment.doctorName} has cancelled the appointment`,
          type: "APPOINTMENT_CANCELLED",
          timestamp: new Date().toISOString(),
          isRead: false,
          appointmentId: appointmentId
        };

        // Store in localStorage as fallback
        const existingNotifications = JSON.parse(localStorage.getItem('fallbackNotifications') || '[]');
        existingNotifications.push(fallbackNotification);
        localStorage.setItem('fallbackNotifications', JSON.stringify(existingNotifications));
        
        // Dispatch event for real-time update
        window.dispatchEvent(new CustomEvent('fallbackNotificationCreated', {
          detail: fallbackNotification
        }));
        
        // Show warning toast
        toast({
          title: "Notification Warning",
          description: "Appointment cancelled. Notification system may be offline.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        console.log('Cancellation notification sent successfully');
      }
    } catch (error) {
      console.error('Error creating cancellation notification:', error);
      toast({
        title: "Notification Error",
        description: "Appointment cancelled, but failed to notify the other party.",
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const getStatusBadge = (appointment: Appointment) => {
    switch (appointment.status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border-blue-400 font-bold shadow-sm">Scheduled</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-emerald-200 text-green-900 border-green-400 font-bold shadow-sm">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-gradient-to-r from-red-100 to-pink-200 text-red-900 border-red-400 font-bold shadow-sm">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{appointment.status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (appointment: Appointment) => {
    if (!appointment.paymentStatus) return null;
    
    switch (appointment.paymentStatus) {
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-emerald-200 text-green-900 border-green-400 font-bold shadow-sm">Payment Completed</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-900 border-yellow-400 font-bold shadow-sm">Payment Pending</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="bg-gradient-to-r from-red-100 to-pink-200 text-red-900 border-red-400 font-bold shadow-sm">Payment Failed</Badge>;
      default:
        return <Badge variant="outline">Payment {appointment.paymentStatus}</Badge>;
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
          <span>{cancellerType} </span>
          {appointment.cancelledByName && (
            <span className="ml-1">({appointment.cancelledByName})</span>
          )}
          <span>&nbsp;cancelled this appointment</span>
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

  const canCreatePrescription = (appointment: Appointment) => {
    return userRole === 'doctor' && appointment.status === 'COMPLETED';
  };

  const handlePrescriptionSuccess = () => {
    setPrescriptionDialogOpen(false);
    setSelectedPrescriptionAppointment(null);
    toast({
      title: "Success",
      description: "Prescription created successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Appointments</h3>
          <p className="text-gray-600">Please wait while we fetch your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50 via-white to-cyan-50 min-h-screen">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          {userRole === 'patient' ? 'My Appointments' : 'Patient Appointments'}
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          {/* Last updated: {lastUpdate.toLocaleTimeString()}  */}
           Total Appointments {appointments.length}
        </p>
      </div>

      {appointments.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="mx-auto h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {userRole === 'patient' 
                ? "You haven't booked any appointments yet. Book your first appointment to get started!" 
                : "No patients have booked appointments with you yet. Your appointments will appear here once patients schedule with you."
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
              <Card 
                key={appointment.appointmentId} 
                className={`bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/20 backdrop-blur-sm border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 ${
                  upcoming ? 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-100/40 to-cyan-50/30' : ''
                }`}
              >
                <CardHeader className="bg-gradient-to-r from-blue-100/60 via-purple-50/40 to-cyan-100/60 rounded-t-lg py-3 border-b border-blue-200/30">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-200">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        {userRole === 'patient' ? (
                          <div>
                            <span className="text-gray-900 font-semibold">Dr. {appointment.doctorName}</span>
                            <p className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">{appointment.doctorSpecialization}</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-gray-900 font-semibold">{appointment.patientName}</span>
                            <p className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">Patient</p>
                          </div>
                        )}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {getStatusBadge(appointment)}
                      {getPaymentStatusBadge(appointment)}
                      {upcoming && <Badge variant="outline" className="bg-gradient-to-r from-cyan-100 to-blue-200 text-cyan-900 border-cyan-400 text-xs font-bold shadow-sm animate-pulse">Upcoming</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Date and Time - Compact Side by Side */}
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg border border-blue-300 shadow-sm">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md flex items-center justify-center shadow-md">
                            <Calendar className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-800 font-semibold">Date</p>
                            <p className="text-sm font-bold text-blue-900">{date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-100 to-emerald-200 rounded-lg border border-green-300 shadow-sm">
                          <div className="w-6 h-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-md flex items-center justify-center shadow-md">
                            <Clock className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-green-800 font-semibold">Time</p>
                            <p className="text-sm font-bold text-green-900">{time}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reason and Notes - Compact */}
                    <div className="space-y-2">
                      {appointment.reason && (
                        <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg border-l-4 border-purple-500 border border-purple-300 shadow-sm">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-purple-700 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-purple-800">Reason:</p>
                              <p className="text-gray-900 text-xs font-medium">{appointment.reason}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {appointment.notes && (
                        <div className="p-3 bg-gradient-to-r from-orange-100 to-amber-200 rounded-lg border-l-4 border-orange-500 border border-orange-300 shadow-sm">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-orange-700 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-orange-800">Notes:</p>
                              <p className="text-gray-900 text-xs font-medium">{appointment.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {!appointment.reason && !appointment.notes && (
                        <div className="p-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border border-gray-300 shadow-sm">
                          <p className="text-gray-700 text-xs text-center font-medium">No details available</p>
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
                  {(canCancelAppointment(appointment) || canComplete(appointment) || canCreatePrescription(appointment)) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      {canCancelAppointment(appointment) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAppointment(appointment)}
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel Appointment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-white">
                            <DialogHeader className="text-center pb-4">
                              <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <X className="w-8 h-8 text-red-500" />
                              </div>
                              <DialogTitle className="text-xl font-semibold text-gray-900">Cancel Appointment</DialogTitle>
                              <DialogDescription className="text-gray-600 mt-2">
                                Are you sure you want to cancel this appointment? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="bg-gray-50/50 p-3 rounded-lg border">
                                <Label htmlFor="cancel-reason" className="text-sm font-medium text-gray-700">
                                  Cancellation Reason (Optional)
                                </Label>
                                <Textarea
                                  id="cancel-reason"
                                  placeholder="Please provide a reason for cancellation..."
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  rows={3}
                                  className="mt-2 resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                />
                              </div>
                            </div>
                            <DialogFooter className="flex gap-2 pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedAppointment(null);
                                  setCancelReason('');
                                }}
                                className="flex-1 border-gray-300 hover:bg-gray-50"
                              >
                                Keep Appointment
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleCancelAppointment(appointment.appointmentId)}
                                disabled={cancelling === appointment.appointmentId}
                                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
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
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-xs"
                        >
                          {updatingStatus === appointment.appointmentId ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          Complete
                        </Button>
                      )}

                      {canCreatePrescription(appointment) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPrescriptionAppointment(appointment);
                            setPrescriptionDialogOpen(true);
                          }}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-xs"
                        >
                          <Pill className="h-3 w-3 mr-1" />
                          Prescription
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Appointment ID and Timestamps */}
                  <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100">
                    {/* <p>Appointment ID: {appointment.appointmentId}</p> */}
                    <p>Booked: {new Date(appointment.createdAt).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Prescription Dialog */}
      {selectedPrescriptionAppointment && (
        <CreatePrescription
          isOpen={prescriptionDialogOpen}
          onClose={() => {
            setPrescriptionDialogOpen(false);
            setSelectedPrescriptionAppointment(null);
          }}
          appointmentId={selectedPrescriptionAppointment.appointmentId}
          patientId={selectedPrescriptionAppointment.patientId}
          patientName={selectedPrescriptionAppointment.patientName}
          onPrescriptionCreated={handlePrescriptionSuccess}
        />
      )}
    </div>
  );
};

export default AppointmentList;
