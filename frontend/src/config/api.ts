// API Configuration
// This file centralizes all API endpoint configurations
// Environment variables are injected at build time

// Get the base URL for the user appointment service
const getUserAppointmentApiUrl = (): string => {
  // In production (when built), use the environment variable
  // In development, fallback to localhost
  return import.meta.env.VITE_USER_APPOINTMENT_API_URL || 'http://localhost:8085';
};

// Get the base URL for the AI service
const getAiServiceApiUrl = (): string => {
  return import.meta.env.VITE_AI_SERVICE_API_URL || 'http://localhost:8000';
};

const getPaymentServiceApiUrl = (): string => {
  return import.meta.env.VITE_PAYMENT_SERVICE_API_URL || 'http://localhost:8082';
}

// API endpoints configuration
export const API_CONFIG = {
  USER_APPOINTMENT_BASE_URL: getUserAppointmentApiUrl(),
  AI_SERVICE_BASE_URL: getAiServiceApiUrl(),
  PAYMENT_SERVICE_BASE_URL: getPaymentServiceApiUrl(),
  
  // User Appointment Service endpoints
  AUTH: {
    REGISTER_PATIENT: `${getUserAppointmentApiUrl()}/api/auth/register/patient`,
    REGISTER_DOCTOR: `${getUserAppointmentApiUrl()}/api/auth/register/doctor`,
    REGISTER_TECHNICIAN: `${getUserAppointmentApiUrl()}/api/auth/register/technician`,
    LOGIN: `${getUserAppointmentApiUrl()}/api/auth/login`,
    PROFILE: `${getUserAppointmentApiUrl()}/api/auth/profile`,
    VALIDATE: `${getUserAppointmentApiUrl()}/api/auth/validate`,
    GOOGLE_PATIENT: `${getUserAppointmentApiUrl()}/api/auth/google-patient`,
  },
  
  APPOINTMENTS: {
    UPCOMING: `${getUserAppointmentApiUrl()}/api/appointments/upcoming`,
    MY_APPOINTMENTS: `${getUserAppointmentApiUrl()}/api/appointments/my-appointments`,
    BOOK: `${getUserAppointmentApiUrl()}/api/appointments/book`,
    SPECIALIZATIONS: `${getUserAppointmentApiUrl()}/api/appointments/specializations`,
    DOCTORS: `${getUserAppointmentApiUrl()}/api/appointments/doctors`,
    UPDATE_STATUS: (appointmentId: string | number, status: string) => `${getUserAppointmentApiUrl()}/api/appointments/${appointmentId}/status?status=${status}`,
    CANCEL: (appointmentId: string | number) => `${getUserAppointmentApiUrl()}/api/appointments/${appointmentId}/cancel`,
  },
  
  TEST_RESULTS: {
    MY_TESTS: `${getUserAppointmentApiUrl()}/api/test-results/my-tests`,
    MY_STATS: `${getUserAppointmentApiUrl()}/api/test-results/my-stats`,
    MY_UPLOADS: `${getUserAppointmentApiUrl()}/api/test-results/my-uploads`,
    MY_UPLOAD_STATS: `${getUserAppointmentApiUrl()}/api/test-results/my-upload-stats`,
    MY_ORDERS: `${getUserAppointmentApiUrl()}/api/test-results/my-orders`,
    UPLOAD: `${getUserAppointmentApiUrl()}/api/test-results/upload`,
    DOWNLOAD: (testId: string | number) => `${getUserAppointmentApiUrl()}/api/test-results/${testId}/download`,
    DOCTOR_TESTS: (doctorId: string) => `${getUserAppointmentApiUrl()}/api/test-results/doctor/${doctorId}`,
    UPDATE_STATUS: (testId: string | number, status: string) => `${getUserAppointmentApiUrl()}/api/test-results/${testId}/status?status=${status}`,
    // New test type-based endpoints
    GET_TEST_TYPES_BY_PATIENT: (patientId: string) => `${getUserAppointmentApiUrl()}/api/test-results/patient/${patientId}/test-types`,
    REQUEST_OTP_FOR_TEST_TYPE: (patientId: string, testType: string) => `${getUserAppointmentApiUrl()}/api/test-results/patient/${patientId}/test-type/${testType}/request-otp`,
    VERIFY_OTP_FOR_TEST_TYPE: (patientId: string, testType: string) => `${getUserAppointmentApiUrl()}/api/test-results/patient/${patientId}/test-type/${testType}/verify-otp`,
    CANCEL_OTP_FOR_TEST_TYPE: (patientId: string, testType: string) => `${getUserAppointmentApiUrl()}/api/test-results/patient/${patientId}/test-type/${testType}/cancel-otp`,
    DOWNLOAD_WITH_OTP: (testId: string | number) => `${getUserAppointmentApiUrl()}/api/test-results/${testId}/download-with-otp`,
  },
  
  USERS: {
    PATIENTS: `${getUserAppointmentApiUrl()}/api/users/patients`,
    DOCTORS: `${getUserAppointmentApiUrl()}/api/users/doctors`,
  },
  
  DOCTORS: {
    PROFILE: (doctorId: string) => `${getUserAppointmentApiUrl()}/api/doctors/${doctorId}/profile`,
    PROFILE_PICTURE: (doctorId: string) => `${getUserAppointmentApiUrl()}/api/doctors/${doctorId}/profile-picture`,
    COMPLETED_PATIENTS: (doctorId: string) => `${getUserAppointmentApiUrl()}/api/doctors/${doctorId}/completed-patients`,
    APPOINTMENT_STATS: (doctorId: string) => `${getUserAppointmentApiUrl()}/api/doctors/${doctorId}/appointment-stats`,
    AVAILABILITY: (doctorId: string) => `${getUserAppointmentApiUrl()}/api/doctors/${doctorId}/availability`,
    REQUEST_OTP: `${getUserAppointmentApiUrl()}/api/test-results/doctor/request-otp`,
    VERIFY_OTP: `${getUserAppointmentApiUrl()}/api/test-results/doctor/verify-otp`,
    CANCEL_OTP: `${getUserAppointmentApiUrl()}/api/test-results/doctor/cancel-otp`,
    DOWNLOAD_WITH_OTP: `${getUserAppointmentApiUrl()}/api/test-results/doctor/download-with-otp`,
  },
  
  ADMIN: {
    PENDING: `${getUserAppointmentApiUrl()}/api/admin/pending`,
    APPROVED: `${getUserAppointmentApiUrl()}/api/admin/approved`,
    REJECTED: `${getUserAppointmentApiUrl()}/api/admin/rejected`,
    APPROVE: (userId: string) => `${getUserAppointmentApiUrl()}/api/admin/approve/${userId}`,
    REJECT: (userId: string) => `${getUserAppointmentApiUrl()}/api/admin/reject/${userId}`,
  },

  NOTIFICATIONS: {
    CREATE: `${getUserAppointmentApiUrl()}/api/notifications`,
    ALL: `${getUserAppointmentApiUrl()}/api/notifications`,
    MY_NOTIFICATIONS: `${getUserAppointmentApiUrl()}/api/notifications/my`,
    MARK_READ: (notificationId: string | number) => `${getUserAppointmentApiUrl()}/api/notifications/${notificationId}/read`,
    MARK_ALL_READ: `${getUserAppointmentApiUrl()}/api/notifications/read-all`,
    UNREAD_COUNT: `${getUserAppointmentApiUrl()}/api/notifications/unread/count`,
  },
  
  PRESCRIPTIONS: {
    CREATE: `${getUserAppointmentApiUrl()}/api/prescriptions`,
    MY_PRESCRIPTIONS: `${getUserAppointmentApiUrl()}/api/prescriptions/my-prescriptions`,
    MY_CREATED_PRESCRIPTIONS: `${getUserAppointmentApiUrl()}/api/prescriptions/my-created-prescriptions`,
    BY_APPOINTMENT: (appointmentId: string | number) => `${getUserAppointmentApiUrl()}/api/prescriptions/appointment/${appointmentId}`,
    BY_ID: (prescriptionId: string | number) => `${getUserAppointmentApiUrl()}/api/prescriptions/${prescriptionId}`,
    DOWNLOAD_PDF: (prescriptionId: string | number) => `${getUserAppointmentApiUrl()}/api/prescriptions/${prescriptionId}/pdf`,
    BY_PATIENT: (patientId: string) => `${getUserAppointmentApiUrl()}/api/prescriptions/patient/${patientId}`,
    BY_DOCTOR: (doctorId: string) => `${getUserAppointmentApiUrl()}/api/prescriptions/doctor/${doctorId}`,
  },
  
  MEDICINES: {
    ALL: `${getUserAppointmentApiUrl()}/api/medicines`,
    SEARCH: (name: string) => `${getUserAppointmentApiUrl()}/api/medicines/search?name=${encodeURIComponent(name)}`,
    BY_LETTER: (letter: string) => `${getUserAppointmentApiUrl()}/api/medicines/filter/letter/${letter}`,
    BY_CATEGORY: (category: string) => `${getUserAppointmentApiUrl()}/api/medicines/filter/category/${encodeURIComponent(category)}`,
    CATEGORIES: `${getUserAppointmentApiUrl()}/api/medicines/categories`,
    LETTERS: `${getUserAppointmentApiUrl()}/api/medicines/letters`,
    BY_ID: (medicineId: string | number) => `${getUserAppointmentApiUrl()}/api/medicines/${medicineId}`,
  },
  
  HEALTH: {
    USER_APPOINTMENT: `${getUserAppointmentApiUrl()}/actuator/health`,
    AI_SERVICE: `${getAiServiceApiUrl()}/health`,
  },

  // AI Service endpoints
  AI: {
    CHAT: `${getAiServiceApiUrl()}/chat`,
    HEALTH: `${getAiServiceApiUrl()}/health`,
  },

  // Payment Service endpoints
  PAYMENT: {
    INITIATE: `${getPaymentServiceApiUrl()}/payments/initiate-direct`,
    INITIATE_DIRECT: `${getPaymentServiceApiUrl()}/payments/initiate-direct`,
    VERIFY: `${getPaymentServiceApiUrl()}/payments/verify`,
    RECEIPT: (transactionId: string) => `${getPaymentServiceApiUrl()}/payments/receipt/${transactionId}`,
    ME: `${getUserAppointmentApiUrl()}/api/patients/me`,
  },
};

// Helper function to get headers with authentication
export const getAuthHeaders = (includeAuth: boolean = true) => {
  console.log('=== GET AUTH HEADERS ===');
  console.log('Include auth:', includeAuth);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    // Check sessionStorage first, then localStorage as fallback
    let token = sessionStorage.getItem('token');
    console.log('SessionStorage token:', token ? 'Present' : 'Not found');
    
    if (!token) {
      token = localStorage.getItem('token');
      console.log('LocalStorage token:', token ? 'Present' : 'Not found');
      
      // If found in localStorage, restore to sessionStorage for current session
      if (token) {
        console.log('Restoring token from localStorage to sessionStorage');
        sessionStorage.setItem('token', token);
      }
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set with token');
    } else {
      console.log('No token found - no Authorization header');
    }
  }
  
  console.log('Final headers:', headers);
  return headers;
};

// Helper function for making authenticated API calls
export const apiCall = async (
  url: string,
  options: RequestInit = {},
  includeAuth: boolean = true
) => {
  console.log(`=== API CALL: ${url} ===`);
  console.log('Include auth:', includeAuth);
  
  const headers = getAuthHeaders(includeAuth);
  console.log('API headers:', headers);
  
  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: headers,
    credentials: 'include',
    ...options,
  };

  console.log('Request options:', defaultOptions);
  
  const response = await fetch(url, defaultOptions);
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  // Handle authentication errors globally
  if (response.status === 401 && includeAuth) {
    console.error('Authentication error (401) detected');
    // Call global auth error handler if available
    if (typeof (window as any).handleAuthError === 'function') {
      (window as any).handleAuthError();
    }
  }
  
  return response;
};
