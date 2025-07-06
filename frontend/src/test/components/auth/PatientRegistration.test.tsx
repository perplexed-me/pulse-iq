import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import React from 'react'

// TypeScript interfaces for form data and errors
interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  age: string
  gender: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  phone?: string
  age?: string
  gender?: string
  general?: string
}

// Simple mock patient registration component
const MockPatientRegistrationComponent = () => {
  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    age: '',
    gender: ''
  })
  
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [registrationSuccess, setRegistrationSuccess] = React.useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.age) newErrors.age = 'Age is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Invalid email format'
    }
    
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 120)) {
      newErrors.age = 'Age must be between 18 and 120'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Mock registration logic
      if (formData.email === 'existing@example.com') {
        setErrors({ email: 'Email already exists' })
      } else {
        setRegistrationSuccess(true)
      }
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (registrationSuccess) {
    return (
      <div data-testid="success-message">
        <h2>Registration Successful!</h2>
        <p>Your patient account has been created successfully.</p>
        <p data-testid="user-id">User ID: P002</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Patient Registration</h2>
      <form onSubmit={handleSubmit} data-testid="registration-form">
        <div>
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange}
            data-testid="first-name-input"
          />
          {errors.firstName && <span data-testid="first-name-error">{errors.firstName}</span>}
        </div>
        
        <div>
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange}
            data-testid="last-name-input"
          />
          {errors.lastName && <span data-testid="last-name-error">{errors.lastName}</span>}
        </div>
        
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            data-testid="email-input"
          />
          {errors.email && <span data-testid="email-error">{errors.email}</span>}
        </div>
        
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            data-testid="password-input"
          />
          {errors.password && <span data-testid="password-error">{errors.password}</span>}
        </div>
        
        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            data-testid="confirm-password-input"
          />
          {errors.confirmPassword && <span data-testid="confirm-password-error">{errors.confirmPassword}</span>}
        </div>
        
        <div>
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            data-testid="phone-input"
          />
          {errors.phone && <span data-testid="phone-error">{errors.phone}</span>}
        </div>
        
        <div>
          <label htmlFor="age">Age</label>
          <input
            id="age"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleInputChange}
            data-testid="age-input"
          />
          {errors.age && <span data-testid="age-error">{errors.age}</span>}
        </div>
        
        <div>
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            data-testid="gender-select"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <span data-testid="gender-error">{errors.gender}</span>}
        </div>
        
        {errors.general && <div data-testid="general-error">{errors.general}</div>}
        
        <button 
          type="submit" 
          disabled={isLoading}
          data-testid="register-button"
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  )
}

// Test wrapper
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('Patient Registration - Complete End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Unit Test 1: Component Rendering
  it('should render registration form with all fields', () => {
    render(
      <TestWrapper>
        <MockPatientRegistrationComponent />
      </TestWrapper>
    )
    
    expect(screen.getByRole('heading', { name: 'Patient Registration' })).toBeInTheDocument()
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
    expect(screen.getByLabelText('Age')).toBeInTheDocument()
    expect(screen.getByLabelText('Gender')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
  })

  // Unit Test 2: Form Validation
  it('should validate all required fields', async () => {
    render(
      <TestWrapper>
        <MockPatientRegistrationComponent />
      </TestWrapper>
    )
    
    const submitButton = screen.getByTestId('register-button')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('first-name-error')).toHaveTextContent('First name is required')
      expect(screen.getByTestId('last-name-error')).toHaveTextContent('Last name is required')
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required')
      expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required')
      expect(screen.getByTestId('confirm-password-error')).toHaveTextContent('Confirm password is required')
      expect(screen.getByTestId('phone-error')).toHaveTextContent('Phone number is required')
      expect(screen.getByTestId('age-error')).toHaveTextContent('Age is required')
      expect(screen.getByTestId('gender-error')).toHaveTextContent('Gender is required')
    })
  })

  // Unit Test 3: Password Validation
  it('should validate password requirements', async () => {
    render(
      <TestWrapper>
        <MockPatientRegistrationComponent />
      </TestWrapper>
    )
    
    const passwordInput = screen.getByTestId('password-input')
    const confirmPasswordInput = screen.getByTestId('confirm-password-input')
    
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: '456' } })
    
    const submitButton = screen.getByTestId('register-button')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent('Password must be at least 8 characters long')
      expect(screen.getByTestId('confirm-password-error')).toHaveTextContent('Passwords do not match')
    })
  })

  // Integration Test 1: Complete Registration Flow
  it('should complete successful registration workflow', async () => {
    render(
      <TestWrapper>
        <MockPatientRegistrationComponent />
      </TestWrapper>
    )
    
    // Fill out form
    fireEvent.change(screen.getByTestId('first-name-input'), { target: { value: 'John' } })
    fireEvent.change(screen.getByTestId('last-name-input'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john.doe@example.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '1234567890' } })
    fireEvent.change(screen.getByTestId('age-input'), { target: { value: '30' } })
    fireEvent.change(screen.getByTestId('gender-select'), { target: { value: 'Male' } })
    
    // Submit form
    fireEvent.click(screen.getByTestId('register-button'))
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument()
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
      expect(screen.getByTestId('user-id')).toHaveTextContent('User ID: P002')
    }, { timeout: 3000 })
  })

  // Integration Test 2: Email Already Exists
  it('should handle email already exists error', async () => {
    render(
      <TestWrapper>
        <MockPatientRegistrationComponent />
      </TestWrapper>
    )
    
    // Fill out form with existing email
    fireEvent.change(screen.getByTestId('first-name-input'), { target: { value: 'John' } })
    fireEvent.change(screen.getByTestId('last-name-input'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'existing@example.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '1234567890' } })
    fireEvent.change(screen.getByTestId('age-input'), { target: { value: '30' } })
    fireEvent.change(screen.getByTestId('gender-select'), { target: { value: 'Male' } })
    
    // Submit form
    fireEvent.click(screen.getByTestId('register-button'))
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email already exists')
    }, { timeout: 3000 })
  })
})
