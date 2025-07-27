// import { useEffect, useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { CheckCircle2, XCircle, AlertCircle, Download, Banknote, ArrowRight } from 'lucide-react';
// import { apiCall, API_CONFIG } from '@/config/api';

// const PaymentResult = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [status, setStatus] = useState<'success' | 'fail' | 'loading'>('loading');
//   const [downloading, setDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);

//   // Extract transaction ID from query string
//   const searchParams = new URLSearchParams(location.search);
//   const transactionId = searchParams.get('tran_id');

//   // Download receipt PDF
//   const downloadReceipt = async () => {
//     if (!transactionId) return;
//     setDownloading(true);
//     setDownloadError(null);
//     try {
//       // Adjust the base URL if needed (e.g., use env or relative path)
//       const response = await apiCall(API_CONFIG.PAYMENT.RECEIPT(transactionId));
//       if (!response.ok) throw new Error('Failed to download receipt.');
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `payment-receipt-${transactionId}.pdf`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (err: any) {
//       setDownloadError(err.message || 'Could not download receipt.');
//     } finally {
//       setDownloading(false);
//     }
//   };

//   // Auto-download on payment success
//   useEffect(() => {
//     // Retrieve pending payment data from localStorage with user-specific key
//     const pendingPaymentKey = `pendingPayment_${user?.id || 'guest'}`;
//     const storedPendingPayment = localStorage.getItem(pendingPaymentKey);
//     if (storedPendingPayment) {
//       try {
//         const parsedData = JSON.parse(storedPendingPayment);
//         setPendingPaymentData(parsedData);
//       } catch (error) {
//         console.error('Error parsing pending payment data:', error);
//       }
//     }

//     // Get payment status from URL path
//     const path = location.pathname;
//     if (path.includes('success')) {
//       setStatus('success');
//       if (transactionId) {
//         downloadReceipt();
//       }
//     } else if (path.includes('fail')) {
//       setStatus('fail');
//     }
//   }, [location, transactionId]);

//   const handleContinue = () => {
//     if (status === 'success') {
//       // Store payment completion data in sessionStorage for the booking page
//       if (pendingPaymentData) {
//         const paymentCompletionData = {
//           paymentCompleted: true,
//           paymentMethod: 'online',
//           paymentId: transactionId,
//           appointmentDetails: pendingPaymentData.appointmentDetails,
//           doctorInfo: pendingPaymentData.doctorInfo,
//           paymentData: pendingPaymentData.paymentData
//         };

//         // Use user-specific keys like PaymentPage does
//         const userId = user?.id || 'guest';
//         sessionStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));
//         localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));
        
//         // Clean up pending payment data with user-specific key
//         const pendingPaymentKey = `pendingPayment_${user?.id || 'guest'}`;
//         localStorage.removeItem(pendingPaymentKey);
        
//         // Navigate to booking page with payment completion state
//         navigate('/book-appointment', { 
//           state: paymentCompletionData
//         });
//       } else {
//         // Fallback if no pending payment data
//         const userId = user?.id || 'guest';
//         const fallbackData = { paymentCompleted: true, paymentMethod: 'online' };
//         sessionStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(fallbackData));
//         localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(fallbackData));
//         navigate('/book-appointment', { state: fallbackData });
//       }
//     } else {
//       // On failure, go back to payment page to retry with preserved data
//       if (pendingPaymentData) {
//         navigate('/payment', {
//           state: {
//             appointmentDetails: pendingPaymentData.appointmentDetails,
//             doctorInfo: pendingPaymentData.doctorInfo,
//             consultationFee: pendingPaymentData.doctorInfo?.consultationFee || pendingPaymentData.paymentData?.consultationFee || 0
//           }
//         });
//       } else {
//         navigate('/payment');
//       }
//     }
//   };

//   const handleCashPayment = () => {
//     // Allow falling back to cash payment with appointment details if available
//     if (pendingPaymentData) {
//       const paymentCompletionData = {
//         paymentCompleted: true,
//         paymentMethod: 'cash',
//         appointmentDetails: pendingPaymentData.appointmentDetails,
//         doctorInfo: pendingPaymentData.doctorInfo
//       };

//       const userId = user?.id || 'guest';
//       sessionStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));
//       localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));
      
//       navigate('/book-appointment', { 
//         state: paymentCompletionData
//       });
//     } else {
//       // Fallback if no pending payment data
//       const userId = user?.id || 'guest';
//       const fallbackData = { 
//         paymentMethod: 'cash',
//         paymentCompleted: true 
//       };
//       sessionStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(fallbackData));
//       localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(fallbackData));
//       navigate('/book-appointment', { 
//         state: fallbackData
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
//       <div className="container mx-auto max-w-md">
//         <Card className="shadow-lg border-0 bg-white rounded-xl overflow-hidden">
          
//           <div className="p-6">
//             {/* Success State */}
//             {status === 'success' && (
//               <div className="text-center">
//                 {/* Success Icon */}
//                 <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
//                   <CheckCircle2 className="h-8 w-8 text-green-600" />
//                 </div>

//                 {/* Success Message */}
//                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
//                 <p className="text-gray-600 mb-6">
//                   Your payment has been processed successfully. Your receipt will be downloaded automatically.
//                 </p>

//                 {/* Success Alert */}
//                 <Alert className="mb-6 bg-green-50 border-green-200">
//                   <CheckCircle2 className="h-4 w-4 text-green-600" />
//                   <AlertTitle className="text-green-800">Transaction Complete</AlertTitle>
//                   <AlertDescription className="text-green-700">
//                     Click continue to complete your appointment booking.
//                   </AlertDescription>
//                 </Alert>
//               </div>
//             )}

//             {/* Failure State */}
//             {status === 'fail' && (
//               <div className="text-center">
//                 {/* Fail Icon */}
//                 <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
//                   <XCircle className="h-8 w-8 text-red-600" />
//                 </div>

//                 {/* Fail Message */}
//                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
//                 <p className="text-gray-600 mb-6">
//                   We couldn't process your payment. Please try again or choose a different payment method.
//                 </p>

//                 {/* Fail Alert */}
//                 <Alert className="mb-6 bg-red-50 border-red-200">
//                   <XCircle className="h-4 w-4 text-red-600" />
//                   <AlertTitle className="text-red-800">Transaction Failed</AlertTitle>
//                   <AlertDescription className="text-red-700">
//                     You can try again or switch to cash payment.
//                   </AlertDescription>
//                 </Alert>
//               </div>
//             )}

//             {/* Loading State */}
//             {status === 'loading' && (
//               <div className="text-center">
//                 {/* Loading Icon */}
//                 <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                 </div>

//                 {/* Loading Message */}
//                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
//                 <p className="text-gray-600 mb-6">
//                   Please wait while we verify your payment status...
//                 </p>

//                 {/* Loading Alert */}
//                 <Alert className="mb-6 bg-blue-50 border-blue-200">
//                   <AlertCircle className="h-4 w-4 text-blue-600" />
//                   <AlertTitle className="text-blue-800">Verifying Payment</AlertTitle>
//                   <AlertDescription className="text-blue-700">
//                     This usually takes just a few seconds.
//                   </AlertDescription>
//                 </Alert>
//               </div>
//             )}

//             {/* Download Receipt Button */}
//             {status === 'success' && (
//               <div className="mb-6">
//                 <Button
//                   variant="outline"
//                   onClick={downloadReceipt}
//                   disabled={downloading || !transactionId}
//                   className="w-full flex items-center justify-center gap-2 py-4 border-2 border-green-300 hover:bg-green-50 text-green-700 hover:text-green-800 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50"
//                 >
//                   <Download className="h-5 w-5" />
//                   {downloading ? 'Downloading...' : 'Download Receipt'}
//                 </Button>
//                 {downloadError && (
//                   <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
//                     {downloadError}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="space-y-4">
//               <Button 
//                 onClick={handleContinue}
//                 className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
//               >
//                 {status === 'success' ? (
//                   <>
//                     <ArrowRight className="h-5 w-5" />
//                     Continue to Booking
//                   </>
//                 ) : (
//                   'Try Again'
//                 )}
//               </Button>
              
//               {status === 'fail' && (
//                 <Button 
//                   variant="outline" 
//                   onClick={handleCashPayment}
//                   className="w-full py-4 border-2 border-orange-300 hover:bg-orange-50 text-orange-700 hover:text-orange-800 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2"
//                 >
//                   <Banknote className="h-5 w-5" />
//                   Switch to Cash Payment
//                 </Button>
//               )}
//             </div>
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default PaymentResult;


import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Download, Banknote, ArrowRight } from 'lucide-react';
import { apiCall, API_CONFIG } from '@/config/api';

const PaymentResult = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'success' | 'fail' | 'loading'>('loading');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);

  // Extract transaction ID from query string
  const searchParams = new URLSearchParams(location.search);
  const transactionId = searchParams.get('tran_id');

  // Download receipt PDF
  const downloadReceipt = async () => {
    if (!transactionId) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      // Adjust the base URL if needed (e.g., use env or relative path)
      const response = await apiCall(API_CONFIG.PAYMENT.RECEIPT(transactionId));
      if (!response.ok) throw new Error('Failed to download receipt.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-receipt-${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setDownloadError(err.message || 'Could not download receipt.');
    } finally {
      setDownloading(false);
    }
  };

  // Auto-download on payment success
  useEffect(() => {
    // Retrieve pending payment data from localStorage with user-specific key
    const pendingPaymentKey = `pendingPayment_${user?.id || 'guest'}`;
    const storedPendingPayment = localStorage.getItem(pendingPaymentKey);
    if (storedPendingPayment) {
      try {
        const parsedData = JSON.parse(storedPendingPayment);
        setPendingPaymentData(parsedData);
      } catch (error) {
        console.error('Error parsing pending payment data:', error);
      }
    }

    // Get payment status from URL path
    const path = location.pathname;
    if (path.includes('success')) {
      setStatus('success');
      if (transactionId) {
        downloadReceipt();
      }
    } else if (path.includes('fail')) {
      setStatus('fail');
    }
  }, [location, transactionId]);

  const handleContinue = () => {
    if (status === 'success') {
      // Store payment completion data in sessionStorage for the booking page
      if (pendingPaymentData) {
        const paymentCompletionData = {
          paymentCompleted: true,
          paymentMethod: 'online',
          paymentId: transactionId,
          appointmentDetails: pendingPaymentData.appointmentDetails,
          doctorInfo: pendingPaymentData.doctorInfo,
          paymentData: pendingPaymentData.paymentData
        };

        // Use user-specific keys like PaymentPage does
        const userId = user?.id || 'guest';
        sessionStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));
        localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));
        
        // Clean up pending payment data with user-specific key
        const pendingPaymentKey = `pendingPayment_${user?.id || 'guest'}`;
        localStorage.removeItem(pendingPaymentKey);
        
        // Navigate to booking page with payment completion state
        navigate('/book-appointment', { 
          state: paymentCompletionData
        });
      } else {
        // Fallback if no pending payment data
        const userId = user?.id || 'guest';
        const fallbackData = { paymentCompleted: true, paymentMethod: 'online' };
        sessionStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(fallbackData));
        localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(fallbackData));
        navigate('/book-appointment', { state: fallbackData });
      }
    } else {
      // On failure, go back to payment page to retry with preserved data
      if (pendingPaymentData) {
        navigate('/payment', {
          state: {
            appointmentDetails: pendingPaymentData.appointmentDetails,
            doctorInfo: pendingPaymentData.doctorInfo,
            consultationFee: pendingPaymentData.doctorInfo?.consultationFee || pendingPaymentData.paymentData?.consultationFee || 0
          }
        });
      } else {
        navigate('/payment');
      }
    }
  };

  const handleCashPayment = () => {
    // Allow falling back to cash payment with appointment details if available
    if (pendingPaymentData) {
      const paymentCompletionData = {
        paymentCompleted: true,
        paymentMethod: 'cash',
        appointmentDetails: pendingPaymentData.appointmentDetails,
        doctorInfo: pendingPaymentData.doctorInfo
      };

      const userId = user?.id || 'guest';
      sessionStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));
      localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(paymentCompletionData));
      
      navigate('/book-appointment', { 
        state: paymentCompletionData
      });
    } else {
      // Fallback if no pending payment data
      const userId = user?.id || 'guest';
      const fallbackData = { 
        paymentMethod: 'cash',
        paymentCompleted: true 
      };
      sessionStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(fallbackData));
      localStorage.setItem(`paymentCompletionData_${userId}`, JSON.stringify(fallbackData));
      navigate('/book-appointment', { 
        state: fallbackData
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4 relative overflow-hidden">
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

      <div className="container mx-auto max-w-md relative z-10">
        <Card className="shadow-2xl border-0 bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-blue-200/50">
          
          <div className="p-8">
            {/* Success State */}
            {status === 'success' && (
              <div className="text-center">
                {/* Success Icon with enhanced styling */}
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>

                {/* Success Message */}
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">Payment Successful!</h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Your payment has been processed successfully. Your receipt will be downloaded automatically.
                </p>

                {/* Success Alert with enhanced design */}
                <Alert className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-800 font-semibold">Transaction Complete</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Click continue to complete your appointment booking.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Failure State */}
            {status === 'fail' && (
              <div className="text-center">
                {/* Fail Icon with enhanced styling */}
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <XCircle className="h-10 w-10 text-white" />
                </div>

                {/* Fail Message */}
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">Payment Failed</h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  We couldn't process your payment. Please try again or choose a different payment method.
                </p>

                {/* Fail Alert with enhanced design */}
                <Alert className="mb-8 bg-gradient-to-r from-red-50 to-red-50 border-2 border-red-200 shadow-lg rounded-xl">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="text-red-800 font-semibold">Transaction Failed</AlertTitle>
                  <AlertDescription className="text-red-700">
                    You can try again or switch to cash payment.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center">
                {/* Loading Icon with enhanced styling */}
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-white"></div>
                </div>

                {/* Loading Message */}
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">Processing Payment</h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Please wait while we verify your payment status...
                </p>

                {/* Loading Alert with enhanced design */}
                <Alert className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg rounded-xl">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <AlertTitle className="text-blue-800 font-semibold">Verifying Payment</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    This usually takes just a few seconds.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Download Receipt Button */}
            {status === 'success' && (
              <div className="mb-8">
                <Button
                  variant="outline"
                  onClick={downloadReceipt}
                  disabled={downloading || !transactionId}
                  className="w-full flex items-center justify-center gap-3 py-5 border-2 border-green-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-700 hover:text-green-800 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <Download className="h-6 w-6" />
                  {downloading ? 'Downloading...' : 'Download Receipt'}
                </Button>
                {downloadError && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 text-sm rounded-xl shadow-lg">
                    {downloadError}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-5">
              <Button 
                onClick={handleContinue}
                className="w-full py-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-[1.02]"
              >
                {status === 'success' ? (
                  <>
                    <ArrowRight className="h-6 w-6" />
                    Continue to Booking
                  </>
                ) : (
                  'Try Again'
                )}
              </Button>
              
              {status === 'fail' && (
                <Button 
                  variant="outline" 
                  onClick={handleCashPayment}
                  className="w-full py-5 border-2 border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 text-orange-700 hover:text-orange-800 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <Banknote className="h-6 w-6" />
                  Switch to Cash Payment
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentResult;

