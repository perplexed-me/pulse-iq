import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock fetch globally - but only for non-integration tests
if (!global.fetch) {
  global.fetch = vi.fn()
}

// Mock Firebase to avoid initialization errors in tests
vi.mock('../lib/firebase', () => ({
  auth: {},
  googleProvider: {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

// Only mock API config for non-integration tests
// Integration tests should use the real API config
if (!process.env.VITEST_INTEGRATION_TEST) {
  vi.mock('../config/api', () => ({
    API_CONFIG: {
      USER_APPOINTMENT_BASE_URL: 'http://localhost:8085',
      AI_SERVICE_BASE_URL: 'http://localhost:8000',
      AUTH: {
        LOGIN: 'http://localhost:8085/api/auth/login',
        REGISTER_PATIENT: 'http://localhost:8085/api/auth/register/patient',
        REGISTER_DOCTOR: 'http://localhost:8085/api/auth/register/doctor',
        REGISTER_TECHNICIAN: 'http://localhost:8085/api/auth/register/technician',
        PROFILE: 'http://localhost:8085/api/auth/profile',
        VALIDATE: 'http://localhost:8085/api/auth/validate',
        GOOGLE_PATIENT: 'http://localhost:8085/api/auth/google-patient',
      },
    },
    apiCall: vi.fn(),
  }))
}

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_USER_APPOINTMENT_API_URL: 'http://localhost:8085',
    VITE_AI_SERVICE_API_URL: 'http://localhost:8000',
  },
  writable: true,
})
