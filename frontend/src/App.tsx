import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from './components/ErrorBoundary';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import SeeDoctors from "./pages/SeeDoctors";
import HealthDiagnosis from "./pages/HealthDiagnosis";
import HealthConsultation from "./pages/HealthConsultation";
import HealthPackages from "./pages/HealthPackages";
import PaymentPage from './pages/PaymentPage';
import PaymentResult from './pages/PaymentResult';
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import AdminLogin from "./components/auth/AdminLogin";
import DoctorDashboard from "./components/dashboards/DoctorDashboard";
import PatientDashboard from "./components/dashboards/PatientDashboard";
import TechnicianDashboard from "./components/dashboards/TechnicianDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import SystemHealth from "./components/SystemHealth";
import HealthChat from "./components/chat/HealthChat";
import BookAppointment from "./components/appointments/BookAppointment";
import ScrollToTop from "./components/ScrollToTop";

// const queryClient = new QueryClient();

// // Protected Route Component
// const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
//   const { user, isLoading } = useAuth();
  
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
//       </div>
//     );
//   }
  
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }
  
//   if (allowedRoles && !allowedRoles.includes(user.role)) {
//     return <Navigate to="/login" replace />;
//   }
  
//   return <>{children}</>;
// };

// const AppRoutes = () => {
//   return (
//     <Routes>
//       <Route path="/" element={<Index />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Register />} />
//       <Route path="/admin" element={<AdminLogin />} />
      
//       {/* Protected Dashboard Routes */}
//       <Route
//         path="/doctor/dashboard"
//         element={
//           <ProtectedRoute allowedRoles={['doctor']}>
//             <DoctorDashboard />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/patient/dashboard"
//         element={
//           <ProtectedRoute allowedRoles={['patient']}>
//             <PatientDashboard />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/technician/dashboard"
//         element={
//           <ProtectedRoute allowedRoles={['technician']}>
//             <TechnicianDashboard />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/admin/dashboard"
//         element={
//           <ProtectedRoute allowedRoles={['admin']}>
//             <AdminDashboard />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/system-health"
//         element={
//           <ProtectedRoute allowedRoles={['admin']}>
//             <SystemHealth />
//           </ProtectedRoute>
//         }
//       />
      
//       {/* Health Chat Route - Available to all authenticated users */}
//       <Route
//         path="/health-chat"
//         element={
//           <ProtectedRoute>
//             <HealthChat />
//           </ProtectedRoute>
//         }
//       />
      
//       {/* Book Appointment Route - Available only to patients */}
//       <Route
//         path="/book-appointment"
//         element={
//           <ProtectedRoute allowedRoles={['patient']}>
//             <BookAppointment />
//           </ProtectedRoute>
//         }
//       />
      
//       {/* Catch-all route */}
//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   );
// };

// const App = () => (
//   <BrowserRouter>
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />
//         <AuthProvider>
//           <AppRoutes />
//         </AuthProvider>
//       </TooltipProvider>
//     </QueryClientProvider>
//   </BrowserRouter>
// );

// export default App;



// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[];
  requireAuth?: boolean;
}> = ({ children, allowedRoles, requireAuth = true }) => {
  const { user, isLoading } = useAuth();
  
  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  // If auth is required but user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }
  
  // If specific roles are required, check user role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  // If user is logged in, redirect to appropriate dashboard
  if (user) {
    switch (user.role) {
      case 'patient':
        return <Navigate to="/patient/dashboard" replace />;
      case 'doctor':
        return <Navigate to="/doctor/dashboard" replace />;
      case 'technician':
        return <Navigate to="/technician/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/see-doctors" element={<SeeDoctors />} />
              <Route path="/health-diagnosis" element={<HealthDiagnosis />} />
              <Route path="/health-consultation" element={<HealthConsultation />} />
              <Route path="/health-packages" element={<HealthPackages />} />
              
              {/* Public routes (redirect to dashboard if logged in) */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/admin" element={
                <PublicRoute>
                  <AdminLogin />
                </PublicRoute>
              } />
              
              {/* Protected dashboard routes */}
              <Route path="/patient/dashboard" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/doctor/dashboard" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/technician/dashboard" element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <TechnicianDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              {/* Protected functional routes */}
              <Route path="/book-appointment" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <BookAppointment />
                </ProtectedRoute>
              } />
              <Route path="/appointments/book" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <BookAppointment />
                </ProtectedRoute>
              } />
              <Route path="/health-chat" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <HealthChat />
                </ProtectedRoute>
              } />
              <Route path="/payment" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PaymentPage />
                </ProtectedRoute>
              } />
              <Route path="/payment-result" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PaymentResult />
                </ProtectedRoute>
              } />
              <Route path="/result/success" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PaymentResult />
                </ProtectedRoute>
              } />
              <Route path="/result/fail" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PaymentResult />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;


