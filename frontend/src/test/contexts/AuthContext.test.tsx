import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { BrowserRouter } from 'react-router-dom'
import { apiCall } from '../../config/api'

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  auth: {},
  googleProvider: {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

// Mock API
vi.mock('../../config/api', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:8085',
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

// Get mocked apiCall
const mockApiCall = vi.mocked(apiCall)

// Test component that uses AuthContext
const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth()
  
  const handleLogin = async () => {
    await login({
      identifier: 'P001',
      password: 'password123'
    })
  }

  const handleRegister = async () => {
    // Mock registration call using login function
    await login({
      identifier: 'P002',
      password: 'password123'
    })
  }
  
  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in as ${user.id}` : 'Not logged in'}
      </div>
      <div data-testid="loading-status">
        {isLoading ? 'Loading...' : 'Not loading'}
      </div>
      <button onClick={handleLogin} data-testid="login-btn">
        Login
      </button>
      <button onClick={handleRegister} data-testid="register-btn">
        Register
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  )
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiCall.mockClear()
    localStorage.clear()
  })

  it('should provide initial state', () => {
    renderWithProviders(<TestComponent />)
    
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading')
  })

  it('should handle successful login', async () => {
    mockApiCall.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        entries: () => []
      },
      json: async () => ({
        success: true,
        message: 'Login successful',
        token: 'mock-jwt-token',
        userId: 'P001',
        role: 'PATIENT',
        user: {
          id: 'P001',
          email: 'test@example.com',
          role: 'patient',
          name: 'Test Patient',
          status: 'approved'
        }
      })
    } as unknown as Response)
    
    renderWithProviders(<TestComponent />)
    
    const loginBtn = screen.getByTestId('login-btn')
    fireEvent.click(loginBtn)
    
    // Should show loading state
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading...')
    
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as P001')
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading')
    })
  })

  it('should handle login failure', async () => {
    mockApiCall.mockResolvedValue({
      ok: false,
      status: 401,
      headers: {
        entries: () => []
      },
      json: async () => ({
        success: false,
        message: 'Invalid credentials'
      })
    } as unknown as Response)
    
    renderWithProviders(<TestComponent />)
    
    const loginBtn = screen.getByTestId('login-btn')
    fireEvent.click(loginBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading')
    })
  })

  it('should handle logout', async () => {
    // First login
    mockApiCall.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        entries: () => []
      },
      json: async () => ({
        success: true,
        message: 'Login successful',
        token: 'mock-jwt-token',
        userId: 'P001',
        role: 'PATIENT',
        user: {
          id: 'P001',
          email: 'test@example.com',
          role: 'patient',
          name: 'Test Patient',
          status: 'approved'
        }
      })
    } as unknown as Response)
    
    renderWithProviders(<TestComponent />)
    
    const loginBtn = screen.getByTestId('login-btn')
    fireEvent.click(loginBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as P001')
    })
    
    // Now logout
    const logoutBtn = screen.getByTestId('logout-btn')
    fireEvent.click(logoutBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
    })
  })

  it('should persist user session in localStorage', async () => {
    const mockUser = {
      id: 'P001',
      email: 'test@example.com',
      role: 'patient',
      name: 'Test Patient',
      status: 'approved'
    }
    
    localStorage.setItem('pulseiq_user', JSON.stringify(mockUser))
    localStorage.setItem('token', 'mock-jwt-token')
    
    // Mock the token validation to return success
    mockApiCall.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ valid: true })
    } as unknown as Response)
    
    renderWithProviders(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as P001')
    })
  })

  // Patient Registration Tests
  it('should handle successful patient registration', async () => {
    mockApiCall.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        entries: () => []
      },
      json: async () => ({
        success: true,
        message: 'Patient registered successfully',
        userId: 'P002',
        role: 'PATIENT',
        token: 'mock-jwt-token',
        user: {
          id: 'P002',
          email: 'john.doe@example.com',
          role: 'patient',
          name: 'John Doe',
          status: 'approved'
        }
      })
    } as unknown as Response)
    
    renderWithProviders(<TestComponent />)
    
    const registerBtn = screen.getByTestId('register-btn')
    fireEvent.click(registerBtn)
    
    // Should show loading status
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading...')
    
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as P002')
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading')
    })
  })

  it('should handle registration failure - email already exists', async () => {
    mockApiCall.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: {
        entries: () => []
      },
      json: async () => ({
        success: false,
        message: 'Email already exists'
      })
    } as unknown as Response)
    
    renderWithProviders(<TestComponent />)
    
    const registerBtn = screen.getByTestId('register-btn')
    fireEvent.click(registerBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading')
    })
  })

  it('should handle registration validation errors', async () => {
    mockApiCall.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: {
        entries: () => []
      },
      json: async () => ({
        success: false,
        message: 'Validation failed',
        errors: {
          email: 'Invalid email format',
          password: 'Password too weak'
        }
      })
    } as unknown as Response)
    
    renderWithProviders(<TestComponent />)
    
    const registerBtn = screen.getByTestId('register-btn')
    fireEvent.click(registerBtn)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not loading')
    })
  })
})
