// Mock scrollIntoView
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
})

// Mock router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock the useAuth hook
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'P001', role: 'patient' },
    token: 'mock-jwt-token',
    logout: vi.fn(),
    login: vi.fn(),
    isLoading: false,
    lastLoginError: null,
    setUser: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock API
vi.mock('../../../config/api', () => ({
  API_CONFIG: {
    APPOINTMENTS: {
      SPECIALIZATIONS: 'http://localhost:8085/api/appointments/specializations',
      DOCTORS: 'http://localhost:8085/api/appointments/doctors',
      BOOK: 'http://localhost:8085/api/appointments/book',
    },
  },
  apiCall: vi.fn(),
}))

// Mock toast
vi.mock('../../../hooks/use-toast', () => ({
  useToast: vi.fn(),
  toast: vi.fn(),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BookAppointment from '../../../components/appointments/BookAppointment'
import { AuthProvider } from '../../../contexts/AuthContext'
import { apiCall } from '../../../config/api'
import { useToast } from '../../../hooks/use-toast'

// Get typed mock functions
const mockApiCall = vi.mocked(apiCall)
const mockUseToast = vi.mocked(useToast)

// Create a mock toast function
const mockToast = vi.fn()

// Helper function to create mock responses
const createMockResponse = (data: any, ok: boolean = true) => ({
  ok,
  status: ok ? 200 : 400,
  json: () => Promise.resolve(data),
  headers: new Headers(),
  redirected: false,
  statusText: ok ? 'OK' : 'Bad Request',
  type: 'default' as ResponseType,
  url: '',
  clone: () => createMockResponse(data, ok),
  body: null,
  bodyUsed: false,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  text: () => Promise.resolve(JSON.stringify(data)),
} as Response)

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('BookAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up the toast mock
    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    })
    
    // Mock specializations API response
    mockApiCall.mockImplementation((url) => {
      if (url.includes('specializations')) {
        return Promise.resolve(createMockResponse([
          'Cardiology',
          'Dermatology',
          'Pediatrics',
          'Orthopedics'
        ]))
      }
      
      // Mock doctors API response
      if (url.includes('doctors')) {
        return Promise.resolve(createMockResponse([
          {
            doctorId: 'D001',
            firstName: 'John',
            lastName: 'Smith',
            specialization: 'Cardiology',
            degree: 'MD',
            isAvailable: true,
            fullName: 'Dr. John Smith',
            consultationFee: 150
          },
          {
            doctorId: 'D002',
            firstName: 'Jane',
            lastName: 'Doe',
            specialization: 'Dermatology',
            degree: 'MD',
            isAvailable: true,
            fullName: 'Dr. Jane Doe',
            consultationFee: 120
          }
        ]))
      }
      
      // Mock booking API response
      if (url.includes('book')) {
        return Promise.resolve(createMockResponse({
          status: 'success',
          message: 'Appointment booked successfully',
          appointmentId: 123
        }))
      }
      
      return Promise.resolve(createMockResponse({ message: 'Not found' }, false))
    })
  })

  it('should render booking form', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(screen.getByText('Book Appointment')).toBeInTheDocument()
      expect(screen.getByText('Specialization')).toBeInTheDocument()
      expect(screen.getByText('Search Doctor')).toBeInTheDocument()
    })
  })

  it('should load specializations on mount', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(
        'http://localhost:8085/api/appointments/specializations',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })
  })

  it('should load doctors on mount', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(
        'http://localhost:8085/api/appointments/doctors',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })
  })

  it('should filter doctors by specialization', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(screen.getByText('Book Appointment')).toBeInTheDocument()
    })
    
    // Select a specialization
    const specializationSelect = screen.getByRole('combobox')
    fireEvent.click(specializationSelect)
    
    await waitFor(() => {
      // Use getAllByText to get all Cardiology elements, then click the one in the dropdown
      const cardiologyOptions = screen.getAllByText('Cardiology')
      // The dropdown option should be the last one (dropdown appears after the doctor card)
      const cardiologyOption = cardiologyOptions[cardiologyOptions.length - 1]
      fireEvent.click(cardiologyOption)
    })
    
    // Should show only cardiology doctors
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
      expect(screen.queryByText('Dr. Jane Doe')).not.toBeInTheDocument()
    })
  })

  it('should allow searching doctors by name', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(screen.getByText('Book Appointment')).toBeInTheDocument()
    })
    
    // Search for a doctor - fix the placeholder text
    const searchInput = screen.getByPlaceholderText('Search by doctor name')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
      expect(screen.queryByText('Dr. Jane Doe')).not.toBeInTheDocument()
    })
  })

  it('should handle doctor selection', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
    })
    
    // Select a doctor by clicking on the doctor card
    const doctorCard = screen.getByText('Dr. John Smith').closest('div')
    fireEvent.click(doctorCard!)
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Details')).toBeInTheDocument()
      expect(screen.getByText('Book with Dr. John Smith')).toBeInTheDocument()
    })
  })

  it('should validate appointment form', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
    })
    
    // Select a doctor first
    const doctorCard = screen.getByText('Dr. John Smith').closest('div')
    fireEvent.click(doctorCard!)
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Details')).toBeInTheDocument()
    })
    
    // The Book Appointment button should be disabled when no date is selected
    const bookButton = screen.getByRole('button', { name: /book appointment/i })
    expect(bookButton).toBeDisabled()
  })

  it('should successfully book appointment', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
    })
    
    // Select a doctor
    const doctorCard = screen.getByText('Dr. John Smith').closest('div')
    fireEvent.click(doctorCard!)
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Details')).toBeInTheDocument()
    })
    
    // Fill in appointment details
    const dateInput = screen.getByLabelText('Date & Time *')
    fireEvent.change(dateInput, { target: { value: '2024-12-25T10:00' } })
    
    const reasonInput = screen.getByLabelText('Reason for Visit')
    fireEvent.change(reasonInput, { target: { value: 'Regular checkup' } })
    
    const notesInput = screen.getByLabelText('Additional Notes')
    fireEvent.change(notesInput, { target: { value: 'No specific concerns' } })
    
    // Book the appointment
    const bookButton = screen.getByRole('button', { name: /book appointment/i })
    fireEvent.click(bookButton)
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(
        'http://localhost:8085/api/appointments/book',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('D001')
        })
      )
    })
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Appointment booked successfully!'
      })
    })
  })

  it('should handle booking errors', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
    })
    
    // Select doctor and fill form
    const doctorCard = screen.getByText('Dr. John Smith').closest('div')
    fireEvent.click(doctorCard!)
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Details')).toBeInTheDocument()
    })
    
    // Fill required fields
    const dateInput = screen.getByLabelText('Date & Time *')
    fireEvent.change(dateInput, { target: { value: '2024-12-25T10:00' } })
    
    const reasonInput = screen.getByLabelText('Reason for Visit')
    fireEvent.change(reasonInput, { target: { value: 'Regular checkup' } })
    
    // Mock API error for booking
    mockApiCall.mockImplementationOnce(() =>
      Promise.resolve(createMockResponse({
        error: 'Doctor not available at this time'
      }, false))
    )
    
    // Try to book
    const bookButton = screen.getByRole('button', { name: /book appointment/i })
    fireEvent.click(bookButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Doctor not available at this time'
      })
    })
  })

  it('should handle go back navigation', async () => {
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
    })
    
    // Select a doctor to show appointment form
    const doctorCard = screen.getByText('Dr. John Smith').closest('div')
    fireEvent.click(doctorCard!)
    
    await waitFor(() => {
      expect(screen.getByText('Appointment Details')).toBeInTheDocument()
    })
    
    // Click back button
    const backButton = screen.getByRole('button', { name: /back to dashboard/i })
    fireEvent.click(backButton)
    
    // Check that navigate was called with patient dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/patient/dashboard')
  })

  it('should show loading states', async () => {
    // Mock delayed API response
    mockApiCall.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve(createMockResponse([])), 100))
    )
    
    renderWithProviders(<BookAppointment />)
    
    // Use getAllByText to handle multiple loading elements
    const loadingElements = screen.getAllByText('Loading doctors...')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('should handle network errors', async () => {
    // Mock network error for doctors API
    mockApiCall.mockImplementation((url) => {
      if (url.includes('doctors')) {
        return Promise.reject(new Error('Network error'))
      }
      if (url.includes('specializations')) {
        return Promise.resolve(createMockResponse([]))
      }
      return Promise.resolve(createMockResponse({ message: 'Not found' }, false))
    })
    
    renderWithProviders(<BookAppointment />)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load doctors. Please try again.'
      })
    })
  })
})
