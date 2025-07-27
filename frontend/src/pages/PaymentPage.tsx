import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Shield, Banknote, Info, CheckCircle } from "lucide-react";
import { apiCall, API_CONFIG } from '@/config/api';

interface PatientDetails {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

const PaymentPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get appointment details and doctor info from location state
  const appointmentDetails = location.state?.appointmentDetails;
  const doctorInfo = location.state?.doctorInfo;
  const consultationFee = location.state?.consultationFee || doctorInfo?.consultationFee || 0; // Use doctor's actual fee
  
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    amount: "",
    currency: "BDT",
    description: `Consultation fee for ${doctorInfo?.doctorName || 'Doctor'}`,
  });

  // Update form amount when consultationFee changes
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amount: consultationFee.toString(),
      description: `Consultation fee for ${doctorInfo?.doctorName || 'Doctor'}`
    }));
  }, [consultationFee, doctorInfo?.doctorName]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');

  // Fetch patient details on component mount
  useEffect(() => {
    if (user && user.role === 'patient' && token) {
      fetchPatientDetails();
    }
  }, [user, token]);

  const fetchPatientDetails = async () => {
    try {
      const response = await apiCall(API_CONFIG.PAYMENT.ME, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatientDetails(data);
        
        // Auto-fill the form with patient details
        setForm(prev => ({
          ...prev,
          customerName: `${data.firstName} ${data.lastName}`,
          customerEmail: data.email,
          customerPhone: data.phone,
          customerAddress: data.address || "",
        }));
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCashPayment = () => {
    // Debug logging
    console.log('handleCashPayment called');
    console.log('appointmentDetails:', appointmentDetails);
    console.log('doctorInfo:', doctorInfo);
    
    // Validate required data
    if (!appointmentDetails || !doctorInfo) {
      toast({
        title: "Error",
        description: "Missing appointment details. Please go back and select a doctor first.",
        variant: "destructive"
      });
      navigate('/book-appointment');
      return;
    }

    // For cash payment, redirect directly to appointment booking with payment status as PENDING
    const paymentCompletionData = {
      appointmentDetails: {
        ...appointmentDetails,
        paymentStatus: 'PENDING',
        paymentMethod: 'cash'
      },
      doctorInfo,
      paymentCompleted: true,
      paymentMethod: 'cash'
    };

    console.log('Cash payment completion data:', paymentCompletionData);

    // Store payment completion data for persistence across navigation (user-specific)
    const userId = appointmentDetails.patientId || 'guest';
    sessionStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));
    localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));

    navigate('/book-appointment', {
      state: paymentCompletionData
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await apiCall(API_CONFIG.PAYMENT.INITIATE_DIRECT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      }, false); // false = don't include auth headers for payment initiation
      
      const data = await response.json();
      
      if (response.ok && data && (data.gatewayPageURL || data.GatewayPageURL)) {
        // Store payment details in localStorage with user-specific key before redirecting
        const pendingPaymentKey = `pendingPayment_${user?.id || 'guest'}`;
        localStorage.setItem(pendingPaymentKey, JSON.stringify({
          appointmentDetails,
          doctorInfo,
          paymentData: data
        }));
        
        // Redirect to payment gateway
        window.location.href = data.gatewayPageURL || data.GatewayPageURL;
      } else {
        setError(data.error || "Failed to proceed to payment. No gateway URL received.");
      }
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setError(`Failed to initiate payment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 relative overflow-hidden">
      {/* CSS for floating animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-20px) rotate(1deg); }
            66% { transform: translateY(-10px) rotate(-1deg); }
          }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animation-delay-0 { animation-delay: 0s; }
          .animation-delay-1000 { animation-delay: 1s; }
          .animation-delay-1500 { animation-delay: 1.5s; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-3000 { animation-delay: 3s; }
        `
      }} />
      
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full animate-float animation-delay-0 blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full animate-float animation-delay-1000 blur-lg"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full animate-float animation-delay-2000 blur-2xl"></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full animate-float animation-delay-3000 blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-blue-500/20 rounded-full animate-float animation-delay-1500 blur-lg transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Enhanced Header with Back Button on Top Right */}
        <div className="mb-8">
          <div className="flex justify-end mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-sm hover:from-white hover:to-blue-50 transition-all duration-300 shadow-xl border-2 border-blue-200/50 hover:border-blue-300 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:text-blue-600 transition-colors" />
              <span className="font-semibold">Back</span>
            </Button>
          </div>
          
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200/50 shadow-2xl">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Payment
                  </h1>
                </div>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
                  Choose your payment method
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Enhanced Appointment Summary */}
          {doctorInfo && (
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  Appointment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <span className="text-gray-700 font-semibold">Doctor:</span>
                  <span className="font-bold text-blue-800">{doctorInfo.doctorName}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <span className="text-gray-700 font-semibold">Specialization:</span>
                  <span className="font-bold text-purple-800">{doctorInfo.specialization}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-lg">
                  <span className="text-gray-700 font-semibold text-lg">Consultation Fee:</span>
                  <span className="font-bold text-2xl text-green-700">৳{consultationFee}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Payment Method Selection */}
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-bold">Payment Method</CardTitle>
              <CardDescription className="text-purple-100 font-medium">Choose how you want to pay</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button
                  type="button"
                  variant={paymentMethod === 'online' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('online')}
                  className={`h-24 flex-col space-y-3 text-lg font-bold transition-all duration-300 transform hover:scale-105 rounded-xl shadow-lg hover:shadow-xl ${
                    paymentMethod === 'online' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0' 
                      : 'border-2 border-blue-300 hover:border-blue-500 bg-gradient-to-r from-white to-blue-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${paymentMethod === 'online' ? 'bg-white/20' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'online' ? 'text-white' : 'text-white'}`} />
                  </div>
                  <span>Online Payment</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className={`h-24 flex-col space-y-3 text-lg font-bold transition-all duration-300 transform hover:scale-105 rounded-xl shadow-lg hover:shadow-xl ${
                    paymentMethod === 'cash' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0' 
                      : 'border-2 border-green-300 hover:border-green-500 bg-gradient-to-r from-white to-green-50'
                  }`}
                >
                  <div className={`text-2xl p-2 rounded-lg ${paymentMethod === 'cash' ? 'bg-white/20' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                    💵
                  </div>
                  <span>Cash Payment</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Online Payment Form */}
          {paymentMethod === 'online' && (
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  Payment Details
                </CardTitle>
                <CardDescription className="text-blue-100 font-medium">Enter your payment information</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                        Full Name
                      </Label>
                      <Input
                        id="customerName"
                        name="customerName"
                        value={form.customerName}
                        onChange={handleChange}
                        required
                        className="border-2 border-blue-200 focus:border-indigo-400 focus:ring-indigo-400/20 rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 shadow-md py-3 text-base font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                        Email
                      </Label>
                      <Input
                        id="customerEmail"
                        name="customerEmail"
                        type="email"
                        value={form.customerEmail}
                        onChange={handleChange}
                        required
                        className="border-2 border-emerald-200 focus:border-teal-400 focus:ring-teal-400/20 rounded-xl bg-gradient-to-r from-emerald-50/50 to-teal-50/50 hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 shadow-md py-3 text-base font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        Phone
                      </Label>
                      <Input
                        id="customerPhone"
                        name="customerPhone"
                        value={form.customerPhone}
                        onChange={handleChange}
                        required
                        className="border-2 border-purple-200 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-50 hover:to-pink-50 transition-all duration-300 shadow-md py-3 text-base font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                        Amount (BDT)
                      </Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={form.amount}
                        onChange={handleChange}
                        required
                        readOnly
                        className="border-2 border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl shadow-md py-3 text-base font-bold text-green-700 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                      Address
                    </Label>
                    <Textarea
                      id="customerAddress"
                      name="customerAddress"
                      value={form.customerAddress}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="border-2 border-orange-200 focus:border-red-400 focus:ring-red-400/20 rounded-xl bg-gradient-to-r from-orange-50/50 to-red-50/50 hover:from-orange-50 hover:to-red-50 transition-all duration-300 shadow-md py-3 text-base font-medium resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                      Description
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      readOnly
                      className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl shadow-md py-3 text-base font-medium text-indigo-700 cursor-not-allowed"
                    />
                  </div>

                  {error && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-700 text-sm p-4 rounded-xl shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="font-bold">Error:</span>
                      </div>
                      <p className="mt-1">{error}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6" />
                        <span>Pay Now</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Cash Payment Section */}
          {paymentMethod === 'cash' && (
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Banknote className="w-5 h-5" />
                </div>
                Cash Payment
              </CardTitle>
              <CardDescription className="text-green-100 font-medium">Pay at the clinic during your appointment</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white">
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Payment at Clinic</h3>
                      <p className="text-green-600 font-medium">Pay directly at the clinic during your appointment</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/80 p-4 rounded-lg border border-green-200 shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                        <span className="text-sm font-bold text-gray-700">Amount</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700">{consultationFee} BDT</p>
                    </div>
                    
                    <div className="bg-white/80 p-4 rounded-lg border border-emerald-200 shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                        <span className="text-sm font-bold text-gray-700">Doctor</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-700">{doctorInfo?.doctorName}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-300 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white flex-shrink-0">
                      <Info className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-800 mb-3">Important Information</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="font-medium">Please arrive 15 minutes before your appointment time</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="font-medium">Bring exact change if possible</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="font-medium">Payment receipt will be provided at the clinic</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="font-medium">For now, your appointment will be confirmed but payment status will remain pending</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleCashPayment}
                  className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6" />
                    <span>Continue with Cash Payment</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;