import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../../../components/auth/Login'
import { AuthProvider } from '../../../contexts/AuthContext'
import { apiCall } from '../../../config/api'
import { useToast } from '../../../hooks/use-toast'

// Mock the useAuth hook
const mockLogin = vi.fn()
const mockUseAuth = {
  user: null,
  login: mockLogin,
  logout: vi.fn(),
  isLoading: false,
  lastLoginError: null,
  setUser: vi.fn(),
}

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Firebase
vi.mock('../../../lib/firebase', () => ({
  auth: {},
  googleProvider: {},
  signInWithPopup: vi.fn(),
}))

// Mock API
vi.mock('../../../config/api', () => ({
  API_CONFIG: {
    AUTH: {
      GOOGLE_PATIENT: 'http://localhost:8085/api/auth/google-patient',
    },
  },
  apiCall: vi.fn(),
}))

// Mock React Router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock toast
vi.mock('../../../hooks/use-toast', () => {
  const mockToast = vi.fn()
  return {
    useToast: () => ({
      toast: mockToast,
    }),
    toast: mockToast,
  }
})

// Mock scrollIntoView
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
})

// Get typed mock functions
const mockApiCall = vi.mocked(apiCall)
const mockUseToast = vi.mocked(useToast)

// Get the toast function from the mocked useToast
const getToastMock = () => mockUseToast().toast

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.isLoading = false
    mockUseAuth.user = null
    mockUseAuth.lastLoginError = null
  })

  it('should render login form with all elements', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByText('PulseIQ Login')).toBeInTheDocument()
    expect(screen.getByText('Access your healthcare management portal')).toBeInTheDocument()
    expect(screen.getByText('Sign in with Google (Patient Only)')).toBeInTheDocument()
    expect(screen.getByLabelText('User ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Sign In$/ })).toBeInTheDocument()
    expect(screen.getByText('Register here')).toBeInTheDocument()
  })

  it('should handle user input in form fields', () => {
    renderWithProviders(<Login />)
    
    const userIdInput = screen.getByLabelText('User ID')
    const passwordInput = screen.getByLabelText('Password')
    
    fireEvent.change(userIdInput, { target: { value: 'P001' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    expect(userIdInput).toHaveValue('P001')
    expect(passwordInput).toHaveValue('password123')
  })

  it('should show role selection when entering non-standard user ID', () => {
    renderWithProviders(<Login />)
    
    const userIdInput = screen.getByLabelText('User ID')
    
    fireEvent.change(userIdInput, { target: { value: 'customuser' } })
    
    expect(screen.getByText('Select Your Role')).toBeInTheDocument()
    expect(screen.getByText('Choose your role')).toBeInTheDocument()
  })

  it('should auto-detect role for standard user ID format', () => {
    renderWithProviders(<Login />)
    
    const userIdInput = screen.getByLabelText('User ID')
    
    fireEvent.change(userIdInput, { target: { value: 'P001' } })
    
    // Role selection should NOT be shown for standard format
    expect(screen.queryByText('Select Your Role')).not.toBeInTheDocument()
  })

  it('should handle successful login', async () => {
    mockLogin.mockResolvedValueOnce({
      success: true,
      user: { id: 'P001', role: 'patient', email: 'test@example.com' }
    })
    
    renderWithProviders(<Login />)
    
    const userIdInput = screen.getByLabelText('User ID')
    const passwordInput = screen.getByLabelText('Password')
    // Use more specific selector for submit button
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/ })
    
    fireEvent.change(userIdInput, { target: { value: 'P001' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitBtn)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'P001',
        password: 'password123'
      })
    })
  })

  it('should show loading state during login', () => {
    mockUseAuth.isLoading = true
    
    renderWithProviders(<Login />)
    
    const submitBtn = screen.getByRole('button', { name: /^Signing in...$/ })
    expect(submitBtn).toBeDisabled()
  })

  it('should validate required fields', () => {
    renderWithProviders(<Login />)
    
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/ })
    fireEvent.click(submitBtn)
    
    // Toast should be called with error message
    const toastMock = getToastMock()
    expect(toastMock).toHaveBeenCalledWith({
      title: "Error",
      description: "Password is required",
      variant: "destructive"
    })
  })

  it('should handle login error', async () => {
    mockLogin.mockResolvedValueOnce({
      success: false,
      errorMessage: 'Invalid credentials'
    })
    
    renderWithProviders(<Login />)
    
    const userIdInput = screen.getByLabelText('User ID')
    const passwordInput = screen.getByLabelText('Password')
    const submitBtn = screen.getByRole('button', { name: /^Sign In$/ })
    
    fireEvent.change(userIdInput, { target: { value: 'P001' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitBtn)
    
    await waitFor(() => {
      const toastMock = getToastMock()
      expect(toastMock).toHaveBeenCalledWith({
        title: "Login Failed",
        description: "Invalid credentials",
        variant: "destructive"
      })
    })
  })

  it('should navigate to register page', () => {
    renderWithProviders(<Login />)
    
    const registerBtn = screen.getByText('Register here')
    fireEvent.click(registerBtn)
    
    expect(mockNavigate).toHaveBeenCalledWith('/register')
  })
})

