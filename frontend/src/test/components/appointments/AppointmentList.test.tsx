// Mock scrollIntoView
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
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
      MY_APPOINTMENTS: 'http://localhost:8085/api/appointments/my-appointments',
      UPDATE_STATUS: (appointmentId: string | number, status: string) => 
        `http://localhost:8085/api/appointments/${appointmentId}/status?status=${status}`,
      CANCEL: (appointmentId: string | number) => 
        `http://localhost:8085/api/appointments/${appointmentId}/cancel`,
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
import AppointmentList from '../../../components/appointments/AppointmentList'
import { AuthProvider } from '../../../contexts/AuthContext'
import { apiCall } from '../../../config/api'
import { useToast } from '../../../hooks/use-toast'

// Get typed mock functions
const mockApiCall = vi.mocked(apiCall)
const mockUseToast = vi.mocked(useToast)
const mockToast = vi.fn()

const mockAppointments = [
  {
    appointmentId: 1,
    patientId: 'P001',
    patientName: 'John Patient',
    doctorId: 'D001',
    doctorName: 'John Smith',
    doctorSpecialization: 'Cardiology',
    appointmentDate: '2025-12-25T10:00:00Z', // Future date
    status: 'SCHEDULED' as const,
    reason: 'Regular checkup',
    notes: 'No specific concerns',
    createdAt: '2025-07-01T10:00:00Z',
    updatedAt: '2025-07-01T10:00:00Z'
  },
  {
    appointmentId: 2,
    patientId: 'P001',
    patientName: 'John Patient',
    doctorId: 'D002',
    doctorName: 'Jane Doe',
    doctorSpecialization: 'Dermatology',
    appointmentDate: '2025-07-01T14:00:00Z', // Past date
    status: 'COMPLETED' as const,
    reason: 'Skin consultation',
    notes: 'Follow-up required',
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2025-07-01T14:30:00Z'
  },
  {
    appointmentId: 3,
    patientId: 'P001',
    patientName: 'John Patient',
    doctorId: 'D003',
    doctorName: 'Mike Johnson',
    doctorSpecialization: 'Orthopedics',
    appointmentDate: '2025-06-18T09:00:00Z', // Past date
    status: 'CANCELLED' as const,
    reason: 'Knee pain',
    notes: 'Urgent consultation',
    createdAt: '2025-06-10T10:00:00Z',
    updatedAt: '2025-06-17T16:00:00Z',
    cancelledBy: 'P001',
    cancelledByName: 'John Patient',
    cancelledByRole: 'PATIENT' as const,
    cancellationReason: 'Schedule conflict'
  }
]

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

describe('AppointmentList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up the toast mock
    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    })
    
    // Mock appointments API response
    mockApiCall.mockImplementation((url) => {
      if (url.includes('my-appointments')) {
        return Promise.resolve(createMockResponse(mockAppointments))
      }
      
      if (url.includes('status')) {
        return Promise.resolve(createMockResponse({
          status: 'success',
          message: 'Appointment status updated'
        }))
      }
      
      if (url.includes('cancel')) {
        return Promise.resolve(createMockResponse({
          status: 'success',
          message: 'Appointment cancelled successfully'
        }))
      }
      
      return Promise.resolve(createMockResponse({ message: 'Not found' }, false))
    })
  })

  it('should render appointment list for patient', async () => {
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(screen.getByText('My Appointments')).toBeInTheDocument()
    })
  })

  it('should render appointment list for doctor', async () => {
    renderWithProviders(<AppointmentList userRole="doctor" />)
    
    await waitFor(() => {
      expect(screen.getByText('Patient Appointments')).toBeInTheDocument()
    })
  })

  it('should load appointments on mount', async () => {
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(
        'http://localhost:8085/api/appointments/my-appointments',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })
  })

  it('should display appointments', async () => {
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
      expect(screen.getByText('Cardiology')).toBeInTheDocument()
      expect(screen.getByText('Regular checkup')).toBeInTheDocument()
      expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('Dermatology')).toBeInTheDocument()
    })
  })

  it('should show appointment status badges', async () => {
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(screen.getByText('Scheduled')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Cancelled')).toBeInTheDocument()
    })
  })

  it('should handle appointment cancellation', async () => {
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
    })
    
    // Find the cancel button for the scheduled appointment
    const cancelButtons = screen.getAllByText('Cancel Appointment')
    fireEvent.click(cancelButtons[0])
    
    // Should show cancellation dialog - use getAllByText to handle multiple matches
    await waitFor(() => {
      const cancelTitles = screen.getAllByText('Cancel Appointment')
      expect(cancelTitles.length).toBeGreaterThan(0)
      expect(screen.getByText('Are you sure you want to cancel this appointment? This action cannot be undone.')).toBeInTheDocument()
    })
    
    // Fill in cancellation reason
    const reasonInput = screen.getByLabelText('Cancellation Reason (Optional)')
    fireEvent.change(reasonInput, { target: { value: 'Schedule conflict' } })
    
    // Confirm cancellation - look for the destructive button
    const confirmButton = screen.getByRole('button', { name: /cancel appointment/i })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(
        expect.stringContaining('cancel'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('Schedule conflict')
        })
      )
    })
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Appointment cancelled successfully'
      })
    })
  })

  it('should handle appointment status update (doctor role)', async () => {
    renderWithProviders(<AppointmentList userRole="doctor" />)
    
    await waitFor(() => {
      expect(screen.getByText('Patient Appointments')).toBeInTheDocument()
      const johnPatientElements = screen.getAllByText('John Patient')
      expect(johnPatientElements.length).toBeGreaterThan(0)
    })
    
    // Find the complete button for a scheduled appointment
    const completeButtons = screen.getAllByText('Mark Complete')
    fireEvent.click(completeButtons[0])
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(
        'http://localhost:8085/api/appointments/1/status?status=COMPLETED',
        expect.objectContaining({
          method: 'PUT'
        })
      )
    })
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Appointment completed successfully'
      })
    })
  })

  it('should show appointment details directly in cards', async () => {
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
      expect(screen.getByText('Regular checkup')).toBeInTheDocument()
      // Use getAllByText to handle multiple "Reason:" elements
      const reasonLabels = screen.getAllByText('Reason:')
      expect(reasonLabels.length).toBeGreaterThan(0)
    })
  })

  it('should display appointment count', async () => {
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(screen.getByText('3 total appointments')).toBeInTheDocument()
    })
  })

  it('should handle loading state', async () => {
    // Mock delayed API response
    mockApiCall.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve(createMockResponse([])), 100))
    )
    
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    expect(screen.getByText('Loading appointments...')).toBeInTheDocument()
  })

  it('should handle empty appointments', async () => {
    mockApiCall.mockImplementationOnce(() =>
      Promise.resolve(createMockResponse([]))
    )
    
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(screen.getByText('No appointments found')).toBeInTheDocument()
    })
  })

  it('should handle API errors', async () => {
    // Mock API error for appointments
    mockApiCall.mockImplementation((url) => {
      if (url.includes('my-appointments')) {
        return Promise.reject(new Error('Network error'))
      }
      return Promise.resolve(createMockResponse({ message: 'Not found' }, false))
    })
    
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load appointments'
      })
    })
  })

  it('should handle cancellation errors', async () => {
    // Reset the mock to return appointments first, then error on cancel
    mockApiCall.mockImplementation((url) => {
      if (url.includes('my-appointments')) {
        return Promise.resolve(createMockResponse(mockAppointments))
      }
      
      if (url.includes('cancel')) {
        return Promise.resolve(createMockResponse({
          error: 'Cannot cancel appointment less than 24 hours before scheduled time'
        }, false))
      }
      
      return Promise.resolve(createMockResponse({ message: 'Not found' }, false))
    })
    
    renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
    })
    
    // Try to cancel appointment
    const cancelButtons = screen.getAllByText('Cancel Appointment')
    fireEvent.click(cancelButtons[0])
    
    await waitFor(() => {
      // Use getAllByText to handle multiple matches
      const cancelTitles = screen.getAllByText('Cancel Appointment')
      expect(cancelTitles.length).toBeGreaterThan(0)
      expect(screen.getByText('Are you sure you want to cancel this appointment? This action cannot be undone.')).toBeInTheDocument()
    })
    
    const reasonInput = screen.getByLabelText('Cancellation Reason (Optional)')
    fireEvent.change(reasonInput, { target: { value: 'Schedule conflict' } })
    
    const confirmButton = screen.getByRole('button', { name: /cancel appointment/i })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot cancel appointment less than 24 hours before scheduled time'
      })
    })
  })

  it('should show different UI for doctor vs patient role', async () => {
    const { rerender } = renderWithProviders(<AppointmentList userRole="patient" />)
    
    await waitFor(() => {
      expect(screen.getByText('My Appointments')).toBeInTheDocument()
    })
    
    // Rerender with doctor role
    rerender(
      <BrowserRouter>
        <AuthProvider>
          <AppointmentList userRole="doctor" />
        </AuthProvider>
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Patient Appointments')).toBeInTheDocument()
    })
  })
})
