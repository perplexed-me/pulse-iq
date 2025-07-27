import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Search, Trash2, Download, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, apiCall } from '@/config/api';

interface Medicine {
  medicineId: number;
  medicineName: string;
  medicinePower: string;
  medicineImage?: string;
  description?: string;
  category: string;
  manufacturer?: string;
  price?: number;
}

interface PrescriptionMedicine {
  medicineId: number;
  medicineName: string;
  medicinePower: string;
  quantity: number;
  durationDays: number;
  morningDose: boolean;
  noonDose: boolean;
  eveningDose: boolean;
  mealTiming: 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'EMPTY_STOMACH';
  specialInstructions?: string;
}

interface CreatePrescriptionProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  patientId: string;
  patientName: string;
  onPrescriptionCreated: () => void;
}

const CreatePrescription: React.FC<CreatePrescriptionProps> = ({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  patientName,
  onPrescriptionCreated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<PrescriptionMedicine[]>([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [letters, setLetters] = useState<string[]>([]);
  
  // Medicine selection dialog
  const [showMedicineDialog, setShowMedicineDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [medicineForm, setMedicineForm] = useState<Partial<PrescriptionMedicine>>({
    quantity: 1,
    durationDays: 1,
    morningDose: false,
    noonDose: false,
    eveningDose: false,
    mealTiming: 'AFTER_MEAL',
    specialInstructions: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchMedicines();
      fetchCategories();
      fetchLetters();
    }
  }, [isOpen]);

  useEffect(() => {
    filterMedicines();
  }, [medicines, searchTerm, selectedLetter, selectedCategory]);

  const fetchMedicines = async () => {
    try {
      console.log('Fetching medicines from:', API_CONFIG.MEDICINES.ALL);
      const response = await apiCall(API_CONFIG.MEDICINES.ALL);
      console.log('Medicine fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched medicines data:', data);
        console.log('Number of medicines fetched:', data.length);
        
        if (data.length === 0) {
          console.warn('No medicines found in database, using fallback data');
          // Fallback dummy medicines if database is empty
          const fallbackMedicines = [
            {
              medicineId: 1,
              medicineName: 'Paracetamol',
              medicinePower: '500mg',
              category: 'Pain Relief',
              description: 'Pain reliever and fever reducer',
              manufacturer: 'GSK',
              price: 8.50,
              isActive: true
            },
            {
              medicineId: 2,
              medicineName: 'Amoxicillin',
              medicinePower: '500mg',
              category: 'Antibiotic',
              description: 'Antibiotic used to treat bacterial infections',
              manufacturer: 'Pfizer',
              price: 15.50,
              isActive: true
            },
            {
              medicineId: 3,
              medicineName: 'Ibuprofen',
              medicinePower: '400mg',
              category: 'Pain Relief',
              description: 'Anti-inflammatory pain reliever',
              manufacturer: 'Johnson & Johnson',
              price: 12.00,
              isActive: true
            }
          ];
          setMedicines(fallbackMedicines);
        } else {
          setMedicines(data);
        }
      } else {
        console.error('Failed to fetch medicines. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Use fallback medicines on API error
        console.warn('Using fallback medicines due to API error');
        const fallbackMedicines = [
          {
            medicineId: 1,
            medicineName: 'Paracetamol',
            medicinePower: '500mg',
            category: 'Pain Relief',
            description: 'Pain reliever and fever reducer',
            manufacturer: 'GSK',
            price: 8.50,
            isActive: true
          },
          {
            medicineId: 2,
            medicineName: 'Amoxicillin',
            medicinePower: '500mg',
            category: 'Antibiotic',
            description: 'Antibiotic used to treat bacterial infections',
            manufacturer: 'Pfizer',
            price: 15.50,
            isActive: true
          }
        ];
        setMedicines(fallbackMedicines);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      
      // Use fallback medicines on network error
      console.warn('Using fallback medicines due to network error');
      const fallbackMedicines = [
        {
          medicineId: 1,
          medicineName: 'Paracetamol',
          medicinePower: '500mg',
          category: 'Pain Relief',
          description: 'Pain reliever and fever reducer',
          manufacturer: 'GSK',
          price: 8.50,
          isActive: true
        }
      ];
      setMedicines(fallbackMedicines);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiCall(API_CONFIG.MEDICINES.CATEGORIES);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLetters = async () => {
    try {
      const response = await apiCall(API_CONFIG.MEDICINES.LETTERS);
      if (response.ok) {
        const data = await response.json();
        setLetters(data);
      }
    } catch (error) {
      console.error('Error fetching letters:', error);
    }
  };

  const filterMedicines = () => {
    let filtered = medicines;

    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.medicineName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter(medicine =>
        medicine.medicineName.toUpperCase().startsWith(selectedLetter)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(medicine =>
        medicine.category === selectedCategory
      );
    }

    setFilteredMedicines(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLetter('');
    setSelectedCategory('');
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setMedicineForm({
      quantity: 1,
      durationDays: 1,
      morningDose: false,
      noonDose: false,
      eveningDose: false,
      mealTiming: 'AFTER_MEAL',
      specialInstructions: ''
    });
    setShowMedicineDialog(true);
  };

  const handleAddMedicine = () => {
    if (!selectedMedicine) return;

    // Check if at least one dose is selected
    if (!medicineForm.morningDose && !medicineForm.noonDose && !medicineForm.eveningDose) {
      toast({
        title: "Error",
        description: "Please select at least one dose time (Morning, Noon, or Eveningcreate)",
        variant: "destructive"
      });
      return;
    }

    // Check if medicine is already added
    const existingIndex = selectedMedicines.findIndex(m => m.medicineId === selectedMedicine.medicineId);
    
    const newMedicine: PrescriptionMedicine = {
      medicineId: selectedMedicine.medicineId,
      medicineName: selectedMedicine.medicineName,
      medicinePower: selectedMedicine.medicinePower,
      quantity: medicineForm.quantity || 1,
      durationDays: medicineForm.durationDays || 1,
      morningDose: medicineForm.morningDose || false,
      noonDose: medicineForm.noonDose || false,
      eveningDose: medicineForm.eveningDose || false,
      mealTiming: medicineForm.mealTiming || 'AFTER_MEAL',
      specialInstructions: medicineForm.specialInstructions || ''
    };

    if (existingIndex >= 0) {
      // Update existing medicine
      const updatedMedicines = [...selectedMedicines];
      updatedMedicines[existingIndex] = newMedicine;
      setSelectedMedicines(updatedMedicines);
    } else {
      // Add new medicine
      setSelectedMedicines([...selectedMedicines, newMedicine]);
    }

    setShowMedicineDialog(false);
    setSelectedMedicine(null);
  };

  const handleRemoveMedicine = (medicineId: number) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.medicineId !== medicineId));
  };

  const handleCreatePrescription = async () => {
    if (selectedMedicines.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one medicine to the prescription",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Debug: Log the selected medicines to check medicineId
      console.log('Selected medicines before sending:', selectedMedicines);
      
      const prescriptionData = {
        patientId,
        appointmentId,
        doctorNotes,
        medicines: selectedMedicines.map(medicine => {
          console.log('Processing medicine:', medicine, 'medicineId:', medicine.medicineId);
          return {
            medicineId: medicine.medicineId,
            quantity: medicine.quantity,
            durationDays: medicine.durationDays,
            morningDose: medicine.morningDose,
            noonDose: medicine.noonDose,
            eveningDose: medicine.eveningDose,
            mealTiming: medicine.mealTiming,
            specialInstructions: medicine.specialInstructions
          };
        })
      };
      
      console.log('Final prescription data being sent:', prescriptionData);

      const response = await apiCall(API_CONFIG.PRESCRIPTIONS.CREATE, {
        method: 'POST',
        body: JSON.stringify(prescriptionData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Prescription created successfully and patient has been notified",
        });
        onPrescriptionCreated();
        onClose();
        
        // Reset form
        setSelectedMedicines([]);
        setDoctorNotes('');
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to create prescription",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDoseText = (medicine: PrescriptionMedicine) => {
    const doses = [];
    if (medicine.morningDose) doses.push('Morning');
    if (medicine.noonDose) doses.push('Noon');
    if (medicine.eveningDose) doses.push('Evening');
    return doses.join(', ');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg -mx-6 -mt-6 mb-4">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              Create Prescription for {patientName}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-2">
              Select medicines and create a comprehensive prescription for the patient.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(85vh-210px)] pr-4">
            <div className="space-y-4">
            {/* Selected Medicines Section */}
            <div className="bg-gradient-to-r from-emerald-50/70 via-green-50/50 to-teal-50/70 p-4 rounded-xl border border-emerald-100/70 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <Label className="text-base font-bold text-gray-800">Selected Medicines</Label>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                    {selectedMedicines.length} {selectedMedicines.length === 1 ? 'medicine' : 'medicines'}
                  </Badge>
                </div>
                <Button 
                  onClick={() => setShowMedicineDialog(true)} 
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medicine
                </Button>
              </div>
              
              {selectedMedicines.length === 0 ? (
                <Card className="border-2 border-dashed border-emerald-200 bg-white/80 shadow-sm">
                  <CardContent className="text-center py-6">
                    <div className="p-3 bg-emerald-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 mb-2">No medicines added yet</h3>
                    <p className="text-sm text-gray-600 mb-3">Start building the prescription by adding medicines</p>
                    <Button 
                      onClick={() => setShowMedicineDialog(true)} 
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      variant="default"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Medicine
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {selectedMedicines.map((medicine, index) => (
                    <Card key={index} className="bg-white/90 border border-emerald-100 hover:shadow-md transition-all duration-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-800 text-base">{medicine.medicineName}</h4>
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">{medicine.medicinePower}</Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div className="bg-blue-50/80 p-2 rounded-lg shadow-sm">
                                <span className="font-medium text-blue-700 text-xs">Quantity:</span>
                                <div className="text-blue-900 font-bold text-sm">{medicine.quantity}</div>
                              </div>
                              <div className="bg-purple-50/80 p-2 rounded-lg shadow-sm">
                                <span className="font-medium text-purple-700 text-xs">Duration:</span>
                                <div className="text-purple-900 font-bold text-sm">{medicine.durationDays} days</div>
                              </div>
                              <div className="bg-orange-50/80 p-2 rounded-lg shadow-sm">
                                <span className="font-medium text-orange-700 text-xs">Doses:</span>
                                <div className="text-orange-900 font-bold text-sm">{getDoseText(medicine)}</div>
                              </div>
                              <div className="bg-cyan-50/80 p-2 rounded-lg shadow-sm">
                                <span className="font-medium text-cyan-700 text-xs">Timing:</span>
                                <div className="text-cyan-900 font-bold text-sm">{medicine.mealTiming.replace('_', ' ')}</div>
                              </div>
                            </div>
                            {medicine.specialInstructions && (
                              <div className="mt-3 p-2 bg-amber-50/80 rounded-lg border border-amber-200 shadow-sm">
                                <span className="font-medium text-amber-700 text-xs">Special Instructions:</span>
                                <div className="text-amber-900 mt-1 text-sm">{medicine.specialInstructions}</div>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMedicine(medicine.medicineId)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Notes Section */}
            <div className="bg-gradient-to-r from-violet-50/70 via-purple-50/50 to-indigo-50/70 p-4 rounded-xl border border-violet-100/70 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                <Label htmlFor="doctorNotes" className="text-base font-bold text-gray-800">Doctor's Notes</Label>
                <Badge variant="outline" className="text-violet-700 border-violet-300 text-xs">Optional</Badge>
              </div>
              <Textarea
                id="doctorNotes"
                placeholder="Add any additional instructions, warnings, or special notes for the patient..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={3}
                className="bg-white/90 border-violet-200 focus:border-violet-400 focus:ring-violet-200 transition-all duration-200 text-sm shadow-sm"
              />
            </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-3 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 h-9 px-4 text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePrescription} 
              disabled={loading || selectedMedicines.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 h-9 px-4 text-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Create Prescription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medicine Selection Dialog */}
      <Dialog open={showMedicineDialog} onOpenChange={setShowMedicineDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-t-lg -mx-6 -mt-6 mb-4 shrink-0">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="p-2 bg-white/20 rounded-lg">
                <Search className="w-5 h-5" />
              </div>
              {selectedMedicine ? `Configure ${selectedMedicine.medicineName}` : 'Select Medicine'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-[calc(85vh-120px)]">
            <ScrollArea className="flex-1 px-1 max-h-full">
              {selectedMedicine ? (
                /* Medicine Configuration Form */
                <div className="space-y-4 pb-4 pr-4">
                <Card className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-green-50/80 border border-emerald-200 shadow-md">
                  <CardHeader className="bg-white/90 rounded-t-lg border-b border-emerald-100 p-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      {selectedMedicine.medicineName}
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">{selectedMedicine.medicinePower}</Badge>
                    </CardTitle>
                    {selectedMedicine.description && (
                      <CardDescription className="text-emerald-700 bg-emerald-50/50 p-3 rounded-lg mt-2">
                        {selectedMedicine.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>

                {/* Dosage Information Section */}
                <div className="bg-gradient-to-r from-blue-50/50 via-cyan-50/30 to-blue-50/50 p-6 rounded-xl border border-blue-200 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Dosage Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></span>
                        Quantity (Total tablets/doses)
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={medicineForm.quantity}
                        onChange={(e) => setMedicineForm({...medicineForm, quantity: parseInt(e.target.value)})}
                        className="bg-white/80 border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="durationDays" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></span>
                        Duration (Days)
                      </Label>
                      <Input
                        id="durationDays"
                        type="number"
                        min="1"
                        value={medicineForm.durationDays}
                        onChange={(e) => setMedicineForm({...medicineForm, durationDays: parseInt(e.target.value)})}
                        className="bg-white/80 border-cyan-200 focus:border-cyan-400 focus:ring-cyan-200 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Dose Timing Section */}
                <div className="bg-gradient-to-r from-purple-50/50 via-violet-50/30 to-purple-50/50 p-6 rounded-xl border border-purple-200 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Dose Timing
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-3 bg-white/70 p-3 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
                      <Checkbox
                        id="morning"
                        checked={medicineForm.morningDose}
                        onCheckedChange={(checked) => setMedicineForm({...medicineForm, morningDose: !!checked})}
                        className="border-purple-300 text-purple-600 focus:ring-purple-200"
                      />
                      <Label htmlFor="morning" className="font-medium text-gray-700 cursor-pointer">🌅 Morning</Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/70 p-3 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
                      <Checkbox
                        id="noon"
                        checked={medicineForm.noonDose}
                        onCheckedChange={(checked) => setMedicineForm({...medicineForm, noonDose: !!checked})}
                        className="border-purple-300 text-purple-600 focus:ring-purple-200"
                      />
                      <Label htmlFor="noon" className="font-medium text-gray-700 cursor-pointer">☀️ Noon</Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/70 p-3 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
                      <Checkbox
                        id="evening"
                        checked={medicineForm.eveningDose}
                        onCheckedChange={(checked) => setMedicineForm({...medicineForm, eveningDose: !!checked})}
                        className="border-purple-300 text-purple-600 focus:ring-purple-200"
                      />
                      <Label htmlFor="evening" className="font-medium text-gray-700 cursor-pointer">🌙 Evening</Label>
                    </div>
                  </div>
                </div>

                {/* Meal Timing Section */}
                <div className="bg-gradient-to-r from-orange-50/50 via-amber-50/30 to-orange-50/50 p-6 rounded-xl border border-orange-200 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Meal Timing
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="mealTiming" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-orange-500 to-amber-600 rounded-full"></span>
                      When to take medicine
                    </Label>
                    <Select
                      value={medicineForm.mealTiming}
                      onValueChange={(value: any) => setMedicineForm({...medicineForm, mealTiming: value})}
                    >
                      <SelectTrigger className="bg-white/80 border-orange-200 focus:border-orange-400 focus:ring-orange-200 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-orange-200">
                        <SelectItem value="BEFORE_MEAL" className="hover:bg-orange-50">🍽️ Before Meal</SelectItem>
                        <SelectItem value="AFTER_MEAL" className="hover:bg-orange-50">🍴 After Meal</SelectItem>
                        <SelectItem value="WITH_MEAL" className="hover:bg-orange-50">🥗 With Meal</SelectItem>
                        <SelectItem value="EMPTY_STOMACH" className="hover:bg-orange-50">⭐ Empty Stomach</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Special Instructions Section */}
                <div className="bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-rose-50/50 p-6 rounded-xl border border-rose-200 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                    Special Instructions
                    <Badge variant="outline" className="text-rose-700 border-rose-300">Optional</Badge>
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="instructions" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-rose-500 to-pink-600 rounded-full"></span>
                      Additional instructions for the patient
                    </Label>
                    <Textarea
                      id="instructions"
                      placeholder="Any special instructions for taking this medicine..."
                      value={medicineForm.specialInstructions}
                      onChange={(e) => setMedicineForm({...medicineForm, specialInstructions: e.target.value})}
                      rows={4}
                      className="bg-white/80 border-rose-200 focus:border-rose-400 focus:ring-rose-200 transition-all duration-200"
                    />
                  </div>
                </div>
                </div>
              ) : (
                /* Medicine Selection List */
                <div className="space-y-6">
                {/* Enhanced Search and Filters */}
                <div className="bg-gradient-to-r from-indigo-50/50 via-blue-50/30 to-indigo-50/50 p-6 rounded-xl border border-indigo-200 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Search Medicines
                  </h3>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="🔍 Search medicines by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/80 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200 transition-all duration-200"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={clearFilters} 
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Enhanced Filter Tabs */}
                <Tabs defaultValue="letter" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200">
                    <TabsTrigger 
                      value="letter" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                    >
                      📝 By Letter
                    </TabsTrigger>
                    <TabsTrigger 
                      value="category" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                    >
                      🏷️ By Category
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="letter" className="mt-6">
                    <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
                      <div className="flex flex-wrap gap-2">
                        {letters.map(letter => (
                          <Button
                            key={letter}
                            variant={selectedLetter === letter ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedLetter(selectedLetter === letter ? '' : letter)}
                            className={selectedLetter === letter ? 
                              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : 
                              "hover:bg-blue-50 hover:border-blue-300"
                            }
                          >
                            {letter}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="category" className="mt-6">
                    <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
                      <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                            className={selectedCategory === category ? 
                              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : 
                              "hover:bg-blue-50 hover:border-blue-300"
                            }
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Enhanced Medicine List */}
                <div className="bg-gradient-to-r from-gray-50/50 via-blue-50/20 to-gray-50/50 p-6 rounded-xl border border-gray-200 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Available Medicines
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {filteredMedicines.length} found
                    </Badge>
                  </h3>
                  <div className="h-80 w-full overflow-y-auto border border-gray-200 rounded-lg p-2">
                    <div className="space-y-3 pr-2">
                      {filteredMedicines.map(medicine => (
                        <Card 
                          key={medicine.medicineId} 
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/80 border border-gray-200 hover:border-emerald-300"
                          onClick={() => handleMedicineSelect(medicine)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                                  <h4 className="font-semibold text-gray-800">{medicine.medicineName}</h4>
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                                    {medicine.medicinePower}
                                  </Badge>
                                </div>
                                {medicine.description && (
                                  <p className="text-sm text-gray-600 mt-1 ml-5">{medicine.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 ml-5 text-xs text-gray-500">
                                  <span className="bg-blue-50 px-2 py-1 rounded-full">
                                    📋 {medicine.category}
                                  </span>
                                  {medicine.manufacturer && (
                                    <span className="bg-purple-50 px-2 py-1 rounded-full">
                                      🏭 {medicine.manufacturer}
                                    </span>
                                  )}
                                  {medicine.price && (
                                    <span className="bg-green-50 px-2 py-1 rounded-full">
                                      💰 ৳{medicine.price}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                Select
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Action Buttons for Medicine Configuration - Fixed at bottom */}
          {selectedMedicine && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white/90 backdrop-blur-sm shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setSelectedMedicine(null)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Back to List
              </Button>
              <Button 
                onClick={handleAddMedicine}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add Medicine
              </Button>
            </div>
          )}
        </div>

          {!selectedMedicine && (
            <DialogFooter className="shrink-0 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setShowMedicineDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatePrescription;
