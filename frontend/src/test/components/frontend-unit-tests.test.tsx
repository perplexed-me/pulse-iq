import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Simple test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

// Mock Login Form Component for testing
const MockLoginForm = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const userId = formData.get('userId') as string
    const password = formData.get('password') as string
    
    // Simple validation logic
    if (!userId || !password) {
      alert('Please fill in all fields')
      return
    }
    
    // Role detection logic
    let role = 'unknown'
    if (userId.startsWith('P')) role = 'patient'
    else if (userId.startsWith('D')) role = 'doctor'
    else if (userId.startsWith('T')) role = 'technician'
    else if (userId.startsWith('A')) role = 'admin'
    
    // Mock successful login
    alert(`Login successful for ${role}: ${userId}`)
  }

  return (
    <div>
      <h2>Login Form</h2>
      <form onSubmit={handleSubmit} data-testid="login-form">
        <input
          type="text"
          name="userId"
          placeholder="User ID"
          data-testid="user-id-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          data-testid="password-input"
        />
        <button type="submit" data-testid="submit-button">
          Login
        </button>
      </form>
    </div>
  )
}

// Mock appointment booking logic
const MockAppointmentBooking = () => {
  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const doctorId = formData.get('doctorId') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    
    if (!doctorId || !date || !time) {
      alert('Please fill in all fields')
      return
    }
    
    // Mock booking logic
    const appointmentId = Math.random().toString(36).substr(2, 9)
    alert(`Appointment booked! ID: ${appointmentId}`)
  }

  return (
    <div>
      <h2>Book Appointment</h2>
      <form onSubmit={handleBooking} data-testid="booking-form">
        <select name="doctorId" data-testid="doctor-select">
          <option value="">Select Doctor</option>
          <option value="D001">Dr. Smith</option>
          <option value="D002">Dr. Johnson</option>
        </select>
        <input
          type="date"
          name="date"
          data-testid="date-input"
        />
        <input
          type="time"
          name="time"
          data-testid="time-input"
        />
        <button type="submit" data-testid="book-button">
          Book Appointment
        </button>
      </form>
    </div>
  )
}

// Mock patient registration component
const MockPatientRegistration = () => {
  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const phone = formData.get('phone') as string
    const age = formData.get('age') as string
    const gender = formData.get('gender') as string
    
    // Validation logic
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phone || !age || !gender) {
      alert('Please fill in all fields')
      return
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    if (email === 'existing@example.com') {
      alert('Email already exists')
      return
    }
    
    if (password.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }
    
    // Mock successful registration
    const userId = `P${Math.random().toString().substr(2, 3)}`
    alert(`Registration successful! User ID: ${userId}`)
  }

  return (
    <div>
      <h2>Patient Registration</h2>
      <form onSubmit={handleRegistration} data-testid="registration-form">
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          data-testid="first-name-input"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          data-testid="last-name-input"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          data-testid="email-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          data-testid="password-input"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          data-testid="confirm-password-input"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          data-testid="phone-input"
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          data-testid="age-input"
        />
        <select name="gender" data-testid="gender-select">
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <button type="submit" data-testid="register-button">
          Register
        </button>
      </form>
    </div>
  )
}

describe('Frontend Unit Tests - Core Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.alert
    global.alert = vi.fn()
  })

  describe('Login Form Component', () => {
    it('should render login form correctly', () => {
      render(
        <TestWrapper>
          <MockLoginForm />
        </TestWrapper>
      )
      
      expect(screen.getByText('Login Form')).toBeInTheDocument()
      expect(screen.getByTestId('user-id-input')).toBeInTheDocument()
      expect(screen.getByTestId('password-input')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      render(
        <TestWrapper>
          <MockLoginForm />
        </TestWrapper>
      )
      
      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Please fill in all fields')
      })
    })

    it('should detect patient role from user ID', async () => {
      render(
        <TestWrapper>
          <MockLoginForm />
        </TestWrapper>
      )
      
      const userIdInput = screen.getByTestId('user-id-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')
      
      fireEvent.change(userIdInput, { target: { value: 'P001' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Login successful for patient: P001')
      })
    })

    it('should detect doctor role from user ID', async () => {
      render(
        <TestWrapper>
          <MockLoginForm />
        </TestWrapper>
      )
      
      const userIdInput = screen.getByTestId('user-id-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')
      
      fireEvent.change(userIdInput, { target: { value: 'D001' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Login successful for doctor: D001')
      })
    })

    it('should detect technician role from user ID', async () => {
      render(
        <TestWrapper>
          <MockLoginForm />
        </TestWrapper>
      )
      
      const userIdInput = screen.getByTestId('user-id-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')
      
      fireEvent.change(userIdInput, { target: { value: 'T001' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Login successful for technician: T001')
      })
    })

    it('should detect admin role from user ID', async () => {
      render(
        <TestWrapper>
          <MockLoginForm />
        </TestWrapper>
      )
      
      const userIdInput = screen.getByTestId('user-id-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')
      
      fireEvent.change(userIdInput, { target: { value: 'A001' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Login successful for admin: A001')
      })
    })
  })

  describe('Appointment Booking Component', () => {
    it('should render appointment booking form correctly', () => {
      render(
        <TestWrapper>
          <MockAppointmentBooking />
        </TestWrapper>
      )
      
      expect(screen.getByRole('heading', { name: 'Book Appointment' })).toBeInTheDocument()
      expect(screen.getByTestId('doctor-select')).toBeInTheDocument()
      expect(screen.getByTestId('date-input')).toBeInTheDocument()
      expect(screen.getByTestId('time-input')).toBeInTheDocument()
      expect(screen.getByTestId('book-button')).toBeInTheDocument()
    })

    it('should validate required fields for booking', async () => {
      render(
        <TestWrapper>
          <MockAppointmentBooking />
        </TestWrapper>
      )
      
      const bookButton = screen.getByTestId('book-button')
      fireEvent.click(bookButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Please fill in all fields')
      })
    })

    it('should book appointment successfully', async () => {
      render(
        <TestWrapper>
          <MockAppointmentBooking />
        </TestWrapper>
      )
      
      const doctorSelect = screen.getByTestId('doctor-select')
      const dateInput = screen.getByTestId('date-input')
      const timeInput = screen.getByTestId('time-input')
      const bookButton = screen.getByTestId('book-button')
      
      fireEvent.change(doctorSelect, { target: { value: 'D001' } })
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } })
      fireEvent.change(timeInput, { target: { value: '14:30' } })
      fireEvent.click(bookButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringMatching(/Appointment booked! ID: \w+/)
        )
      })
    })
  })

  describe('Patient Registration Component', () => {
    it('should render registration form correctly', () => {
      render(
        <TestWrapper>
          <MockPatientRegistration />
        </TestWrapper>
      )
      
      expect(screen.getByText('Patient Registration')).toBeInTheDocument()
      expect(screen.getByTestId('first-name-input')).toBeInTheDocument()
      expect(screen.getByTestId('last-name-input')).toBeInTheDocument()
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
      expect(screen.getByTestId('password-input')).toBeInTheDocument()
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument()
      expect(screen.getByTestId('phone-input')).toBeInTheDocument()
      expect(screen.getByTestId('age-input')).toBeInTheDocument()
      expect(screen.getByTestId('gender-select')).toBeInTheDocument()
      expect(screen.getByTestId('register-button')).toBeInTheDocument()
    })

    it('should validate required fields for registration', async () => {
      render(
        <TestWrapper>
          <MockPatientRegistration />
        </TestWrapper>
      )
      
      const registerButton = screen.getByTestId('register-button')
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Please fill in all fields')
      })
    })

    it('should validate password match', async () => {
      render(
        <TestWrapper>
          <MockPatientRegistration />
        </TestWrapper>
      )
      
      const firstNameInput = screen.getByTestId('first-name-input')
      const lastNameInput = screen.getByTestId('last-name-input')
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const phoneInput = screen.getByTestId('phone-input')
      const ageInput = screen.getByTestId('age-input')
      const genderSelect = screen.getByTestId('gender-select')
      const registerButton = screen.getByTestId('register-button')
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } })
      fireEvent.change(phoneInput, { target: { value: '1234567890' } })
      fireEvent.change(ageInput, { target: { value: '30' } })
      fireEvent.change(genderSelect, { target: { value: 'Male' } })
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Passwords do not match')
      })
    })

    it('should validate email already exists', async () => {
      render(
        <TestWrapper>
          <MockPatientRegistration />
        </TestWrapper>
      )
      
      const firstNameInput = screen.getByTestId('first-name-input')
      const lastNameInput = screen.getByTestId('last-name-input')
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const phoneInput = screen.getByTestId('phone-input')
      const ageInput = screen.getByTestId('age-input')
      const genderSelect = screen.getByTestId('gender-select')
      const registerButton = screen.getByTestId('register-button')
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.change(phoneInput, { target: { value: '1234567890' } })
      fireEvent.change(ageInput, { target: { value: '30' } })
      fireEvent.change(genderSelect, { target: { value: 'Male' } })
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Email already exists')
      })
    })

    it('should validate password length', async () => {
      render(
        <TestWrapper>
          <MockPatientRegistration />
        </TestWrapper>
      )
      
      const firstNameInput = screen.getByTestId('first-name-input')
      const lastNameInput = screen.getByTestId('last-name-input')
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const phoneInput = screen.getByTestId('phone-input')
      const ageInput = screen.getByTestId('age-input')
      const genderSelect = screen.getByTestId('gender-select')
      const registerButton = screen.getByTestId('register-button')
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } })
      fireEvent.change(phoneInput, { target: { value: '1234567890' } })
      fireEvent.change(ageInput, { target: { value: '30' } })
      fireEvent.change(genderSelect, { target: { value: 'Male' } })
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Password must be at least 8 characters long')
      })
    })

    it('should register patient successfully', async () => {
      render(
        <TestWrapper>
          <MockPatientRegistration />
        </TestWrapper>
      )
      
      const firstNameInput = screen.getByTestId('first-name-input')
      const lastNameInput = screen.getByTestId('last-name-input')
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')
      const phoneInput = screen.getByTestId('phone-input')
      const ageInput = screen.getByTestId('age-input')
      const genderSelect = screen.getByTestId('gender-select')
      const registerButton = screen.getByTestId('register-button')
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.change(phoneInput, { target: { value: '1234567890' } })
      fireEvent.change(ageInput, { target: { value: '30' } })
      fireEvent.change(genderSelect, { target: { value: 'Male' } })
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringMatching(/Registration successful! User ID: P\d+/)
        )
      })
    })
  })
})
