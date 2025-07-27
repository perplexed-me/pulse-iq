import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Calendar, User, Clock, Eye, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, apiCall } from '@/config/api';

interface PrescriptionMedicine {
  prescriptionMedicineId: number;
  medicineId: number;
  medicineName: string;
  medicinePower: string;
  medicineImage?: string;
  quantity: number;
  durationDays: number;
  morningDose: boolean;
  noonDose: boolean;
  eveningDose: boolean;
  mealTiming: 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'EMPTY_STOMACH';
  specialInstructions?: string;
}

interface Prescription {
  prescriptionId: number;
  doctorId: string;
  patientId: string;
  appointmentId: number;
  doctorName: string;
  patientName: string;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  prescriptionMedicines: PrescriptionMedicine[];
}

interface PrescriptionListProps {
  userRole: 'patient' | 'doctor';
}

const PrescriptionList: React.FC<PrescriptionListProps> = ({ userRole }) => {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [userRole]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const endpoint = userRole === 'patient' 
        ? API_CONFIG.PRESCRIPTIONS.MY_PRESCRIPTIONS 
        : API_CONFIG.PRESCRIPTIONS.MY_CREATED_PRESCRIPTIONS;
      
      const response = await apiCall(endpoint);
      if (response.ok) {
        const data = await response.json();
        
        // Sort prescriptions by creation date (latest first)
        const sortedPrescriptions = data.sort((a: Prescription, b: Prescription) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setPrescriptions(sortedPrescriptions);
      } else {
        toast({
          title: "Error",
          description: "Failed to load prescriptions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (prescriptionId: number) => {
    try {
      setDownloading(prescriptionId);
      
      const response = await apiCall(API_CONFIG.PRESCRIPTIONS.DOWNLOAD_PDF(prescriptionId), {
        method: 'GET'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Find the sequence number for this prescription
        const prescriptionIndex = prescriptions.findIndex(p => p.prescriptionId === prescriptionId);
        const sequenceNumber = prescriptionIndex + 1;
        
        link.download = `prescription_${sequenceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Prescription downloaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to download prescription",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast({
        title: "Error",
        description: "Failed to download prescription",
        variant: "destructive"
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMealTimingText = (timing: string) => {
    switch (timing) {
      case 'BEFORE_MEAL': return 'Before Meal';
      case 'AFTER_MEAL': return 'After Meal';
      case 'WITH_MEAL': return 'With Meal';
      case 'EMPTY_STOMACH': return 'Empty Stomach';
      default: return timing;
    }
  };

  const getDoseText = (medicine: PrescriptionMedicine) => {
    const doses = [];
    if (medicine.morningDose) doses.push('Morning');
    if (medicine.noonDose) doses.push('Noon');
    if (medicine.eveningDose) doses.push('Evening');
    return doses.join(', ');
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === 'patient' ? 'My Prescriptions' : 'Created Prescriptions'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {prescriptions.length} prescription(s) found
          </p>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {userRole === 'patient' 
                ? "You don't have any prescriptions yet." 
                : "You haven't created any prescriptions yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription, index) => (
            <Card key={prescription.prescriptionId} className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 hover:border-blue-200 group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent font-bold">
                        Prescription #{index + 1}
                      </span>
                    </CardTitle>
                    <CardDescription className="space-y-2 mt-2">
                      {userRole === 'patient' ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-semibold text-gray-700">Prescribed by Dr. {prescription.doctorName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-semibold text-gray-700">Patient: {prescription.patientName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                          <Calendar className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-medium text-gray-600">{formatDate(prescription.createdAt)}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
                      {prescription.prescriptionMedicines.length} medicine(s)
                    </Badge>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Medicine Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-sm mb-3 text-gray-800 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      Medicines:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {prescription.prescriptionMedicines.slice(0, 3).map((medicine) => (
                        <Badge key={medicine.prescriptionMedicineId} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-sm hover:shadow-md transition-all">
                          {medicine.medicineName} {medicine.medicinePower}
                        </Badge>
                      ))}
                      {prescription.prescriptionMedicines.length > 3 && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-sm hover:shadow-md transition-all">
                          +{prescription.prescriptionMedicines.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Doctor Notes Preview */}
                  {prescription.doctorNotes && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-100">
                      <h4 className="font-bold text-sm mb-2 text-gray-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                        Doctor's Notes:
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {prescription.doctorNotes.length > 100 
                          ? prescription.doctorNotes.substring(0, 100) + '...'
                          : prescription.doctorNotes
                        }
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(prescription)}
                      className="flex-1 border-2 border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
                    >
                      <Eye className="w-4 h-4 mr-2 group-hover:text-blue-600" />
                      <span className="font-semibold">View Details</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPdf(prescription.prescriptionId)}
                      disabled={downloading === prescription.prescriptionId}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {downloading === prescription.prescriptionId ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Prescription Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent font-bold">
                Prescription Details
              </span>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-2">
              <div className="p-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-gray-700">
                {userRole === 'patient' 
                  ? `Prescribed by ${selectedPrescription?.doctorName}`
                  : `For patient ${selectedPrescription?.patientName}`
                } on {selectedPrescription && formatDate(selectedPrescription.createdAt)}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedPrescription && (
            <div className="space-y-6">
              {/* Prescription Info */}
              <Card className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-blue-200/50 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="text-white font-bold">Prescription Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-xl border border-emerald-200">
                      <span className="font-bold text-emerald-800">Doctor:</span> 
                      <p className="text-emerald-700 font-semibold">{selectedPrescription.doctorName}</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
                      <span className="font-bold text-blue-800">Patient:</span> 
                      <p className="text-blue-700 font-semibold">{selectedPrescription.patientName}</p>
                    </div>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-200">
                      <span className="font-bold text-amber-800">Created:</span> 
                      <p className="text-amber-700 font-semibold">{formatDate(selectedPrescription.createdAt)}</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-200">
                      <span className="font-bold text-purple-800">Appointment ID:</span> 
                      <p className="text-purple-700 font-semibold">{selectedPrescription.appointmentId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medicines */}
              <Card className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 border-2 border-green-200/50 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
                  <CardTitle className="text-white font-bold">Medicines ({selectedPrescription.prescriptionMedicines.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {selectedPrescription.prescriptionMedicines.map((medicine, index) => (
                      <Card key={medicine.prescriptionMedicineId} className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 border-2 border-purple-200/50 shadow-md hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                                  <span className="text-white font-bold text-sm">💊</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-800">{medicine.medicineName}</h4>
                                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-md mt-1">
                                    {medicine.medicinePower}
                                  </Badge>
                                </div>
                              </div>
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
                                #{index + 1}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
                                <span className="font-bold text-blue-800">Quantity:</span>
                                <p className="text-blue-700 font-semibold">{medicine.quantity} tablet(s)</p>
                              </div>
                              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-xl border border-emerald-200">
                                <span className="font-bold text-emerald-800">Duration:</span>
                                <p className="text-emerald-700 font-semibold">{medicine.durationDays} day(s)</p>
                              </div>
                              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-200">
                                <span className="font-bold text-amber-800">Dose Times:</span>
                                <p className="text-amber-700 font-semibold">{getDoseText(medicine)}</p>
                              </div>
                              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-200">
                                <span className="font-bold text-purple-800">Meal Timing:</span>
                                <p className="text-purple-700 font-semibold">{getMealTimingText(medicine.mealTiming)}</p>
                              </div>
                            </div>
                            
                            {medicine.specialInstructions && (
                              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-xl border-2 border-blue-300 shadow-inner">
                                <div className="flex items-start gap-3">
                                  <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
                                  </div>
                                  <div>
                                    <span className="font-bold text-blue-900">Special Instructions:</span>
                                    <p className="text-blue-800 font-medium mt-1">{medicine.specialInstructions}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Notes */}
              {selectedPrescription.doctorNotes && (
                <Card className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 border-2 border-amber-200/50 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
                    <CardTitle className="text-white font-bold">Doctor's Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                      <p className="text-gray-800 font-medium leading-relaxed">{selectedPrescription.doctorNotes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Download Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => handleDownloadPdf(selectedPrescription.prescriptionId)}
                  disabled={downloading === selectedPrescription.prescriptionId}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
                >
                  {downloading === selectedPrescription.prescriptionId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrescriptionList;
