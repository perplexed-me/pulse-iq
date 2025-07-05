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

// API endpoints configuration
export const API_CONFIG = {
  USER_APPOINTMENT_BASE_URL: getUserAppointmentApiUrl(),
  AI_SERVICE_BASE_URL: getAiServiceApiUrl(),
  
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
  },
  
  USERS: {
    PATIENTS: `${getUserAppointmentApiUrl()}/api/users/patients`,
    DOCTORS: `${getUserAppointmentApiUrl()}/api/users/doctors`,
  },
  
  DOCTORS: {
    PROFILE: (doctorId: string) => `${getUserAppointmentApiUrl()}/api/doctors/${doctorId}/profile`,
    PROFILE_PICTURE: (doctorId: string) => `${getUserAppointmentApiUrl()}/api/doctors/${doctorId}/profile-picture`,
  },
  
  ADMIN: {
    PENDING: `${getUserAppointmentApiUrl()}/api/admin/pending`,
    APPROVED: `${getUserAppointmentApiUrl()}/api/admin/approved`,
    REJECTED: `${getUserAppointmentApiUrl()}/api/admin/rejected`,
    APPROVE: (userId: string) => `${getUserAppointmentApiUrl()}/api/admin/approve/${userId}`,
    REJECT: (userId: string) => `${getUserAppointmentApiUrl()}/api/admin/reject/${userId}`,
  },
  
  HEALTH: {
    USER_APPOINTMENT: `${getUserAppointmentApiUrl()}/actuator/health`,
    AI_SERVICE: `${getAiServiceApiUrl()}/health`,
  },

  // AI Service endpoints
  AI: {
    CHAT: `${getAiServiceApiUrl()}/chat`,
    HEALTH: `${getAiServiceApiUrl()}/health`,
  }
};

// Helper function to get headers with authentication
export const getAuthHeaders = (includeAuth: boolean = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Helper function for making authenticated API calls
export const apiCall = async (
  url: string,
  options: RequestInit = {},
  includeAuth: boolean = true
) => {
  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: getAuthHeaders(includeAuth),
    credentials: 'include',
    ...options,
  };

  return fetch(url, defaultOptions);
};
