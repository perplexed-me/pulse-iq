import { http, HttpResponse } from 'msw'

export const authHandlers = [
  // Mock login endpoint
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { identifier: string; password: string }
    
    // Mock successful login
    if (body.identifier === 'P001' && body.password === 'password123') {
      return HttpResponse.json({
        status: 'success',
        message: 'Login successful',
        token: 'mock-jwt-token',
        userId: 'P001',
        role: 'PATIENT',
        user: {
          id: 1,
          userId: 'P001',
          email: 'test@example.com',
          role: 'PATIENT',
          status: 'ACTIVE'
        }
      })
    }
    
    // Mock invalid credentials
    return HttpResponse.json({
      status: 'error',
      message: 'Invalid credentials'
    }, { status: 401 })
  }),
  
  // Mock patient registration endpoint
  http.post('/api/auth/register/patient', async ({ request }) => {
    const body = await request.json() as any
    
    // Mock validation errors
    if (!body.firstName || !body.lastName || !body.email || !body.password || 
        !body.phone || !body.age || !body.gender) {
      return HttpResponse.json({
        status: 'error',
        message: 'All fields are required for registration validation'
      }, { status: 400 })
    }
    
    // Mock email format validation
    if (body.email && !body.email.includes('@')) {
      return HttpResponse.json({
        status: 'error',
        message: 'Invalid email format validation'
      }, { status: 400 })
    }
    
    // Mock password validation
    if (body.password && body.password.length < 8) {
      return HttpResponse.json({
        status: 'error',
        message: 'Password too short validation'
      }, { status: 400 })
    }
    
    // Mock email already exists
    if (body.email === 'existing@example.com') {
      return HttpResponse.json({
        status: 'error',
        message: 'Email already exists'
      }, { status: 409 })
    }
    
    // Mock successful registration
    return HttpResponse.json({
      status: 'success',
      message: 'Patient registered successfully',
      userId: 'P002',
      token: 'mock-jwt-token',
      user: {
        id: 'P002',
        userId: 'P002',
        email: body.email,
        role: 'PATIENT',
        status: 'ACTIVE',
        patient: {
          firstName: body.firstName,
          lastName: body.lastName,
          age: body.age,
          gender: body.gender,
          phone: body.phone
        }
      }
    })
  }),
  
  // Mock Firebase login endpoint
  http.post('/api/auth/firebase-login', async ({ request }) => {
    const body = await request.json() as { idToken: string }
    
    if (body.idToken === 'valid-firebase-token') {
      return HttpResponse.json({
        status: 'success',
        message: 'Firebase login successful',
        token: 'mock-jwt-token',
        userId: 'P001',
        role: 'PATIENT'
      })
    }
    
    return HttpResponse.json({
      status: 'error',
      message: 'Invalid Firebase token'
    }, { status: 401 })
  }),
  
  // Mock user profile endpoint
  http.get('/api/user/profile', () => {
    return HttpResponse.json({
      id: 1,
      userId: 'P001',
      email: 'test@example.com',
      role: 'PATIENT',
      status: 'ACTIVE',
      patient: {
        firstName: 'Test',
        lastName: 'Patient',
        age: 25,
        gender: 'Male'
      }
    })
  })
]
