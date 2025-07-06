import { http, HttpResponse } from 'msw'

// Types for request bodies
interface UpdateUserProfileRequest {
  firstName: string
  lastName: string
  age: number
  gender: string
  bloodGroup: string
  email: string
  phone: string
}

export const userHandlers = [
  // Mock get patients endpoint
  http.get('/api/users/patients', () => {
    return HttpResponse.json([
      {
        id: 'P001',
        name: 'John Patient',
        email: 'john.patient@example.com',
        phone: '+1234567890',
        age: 30,
        gender: 'Male',
        bloodGroup: 'O+'
      },
      {
        id: 'P002',
        name: 'Jane Patient',
        email: 'jane.patient@example.com',
        phone: '+1234567891',
        age: 25,
        gender: 'Female',
        bloodGroup: 'A+'
      },
      {
        id: 'P003',
        name: 'Bob Patient',
        email: 'bob.patient@example.com',
        phone: '+1234567892',
        age: 45,
        gender: 'Male',
        bloodGroup: 'B+'
      }
    ])
  }),

  // Mock get doctors endpoint
  http.get('/api/users/doctors', () => {
    return HttpResponse.json([
      {
        id: 'D001',
        name: 'Dr. John Smith',
        email: 'john.smith@hospital.com',
        specialization: 'Cardiology',
        degree: 'MD',
        experience: 10,
        licenseNumber: 'MD12345',
        consultationFee: 150
      },
      {
        id: 'D002',
        name: 'Dr. Jane Doe',
        email: 'jane.doe@hospital.com',
        specialization: 'Dermatology',
        degree: 'MD',
        experience: 8,
        licenseNumber: 'MD67890',
        consultationFee: 120
      },
      {
        id: 'D003',
        name: 'Dr. Mike Johnson',
        email: 'mike.johnson@hospital.com',
        specialization: 'Orthopedics',
        degree: 'MD',
        experience: 12,
        licenseNumber: 'MD11111',
        consultationFee: 180
      }
    ])
  }),

  // Mock get technicians endpoint
  http.get('/api/users/technicians', () => {
    return HttpResponse.json([
      {
        id: 'T001',
        name: 'John Technician',
        email: 'john.tech@hospital.com',
        department: 'Laboratory',
        certifications: ['Medical Laboratory Technology'],
        experience: 5
      },
      {
        id: 'T002',
        name: 'Sarah Tech',
        email: 'sarah.tech@hospital.com',
        department: 'Radiology',
        certifications: ['Radiologic Technology'],
        experience: 7
      }
    ])
  }),

  // Mock get user profile endpoint
  http.get('/api/auth/profile', () => {
    return HttpResponse.json({
      userId: 'P001',
      firstName: 'John',
      lastName: 'Patient',
      age: 30,
      gender: 'Male',
      bloodGroup: 'O+',
      email: 'john.patient@example.com',
      phone: '+1234567890',
      role: 'PATIENT',
      status: 'ACTIVE'
    })
  }),

  // Mock update user profile endpoint
  http.put('/api/auth/profile', async ({ request }) => {
    const body = await request.json() as UpdateUserProfileRequest
    
    return HttpResponse.json({
      status: 'success',
      message: 'Profile updated successfully',
      user: {
        userId: 'P001',
        firstName: body.firstName,
        lastName: body.lastName,
        age: body.age,
        gender: body.gender,
        bloodGroup: body.bloodGroup,
        email: body.email,
        phone: body.phone
      }
    })
  })
]
