import { http, HttpResponse } from 'msw'

// Types for request bodies
interface BookAppointmentRequest {
  patientId: string
  doctorId: string
  appointmentDate: string
  notes?: string
}

interface CancelAppointmentRequest {
  reason: string
}

export const appointmentHandlers = [
  // Mock get appointments endpoint
  http.get('/api/appointments', () => {
    return HttpResponse.json([
      {
        id: 1,
        patientId: 'P001',
        doctorId: 'D001',
        appointmentDate: '2024-01-15T10:00:00Z',
        status: 'SCHEDULED',
        notes: 'Regular checkup',
        doctor: {
          name: 'Dr. Smith',
          specialization: 'Cardiology'
        }
      },
      {
        id: 2,
        patientId: 'P001',
        doctorId: 'D002',
        appointmentDate: '2024-01-20T14:30:00Z',
        status: 'COMPLETED',
        notes: 'Follow-up appointment',
        doctor: {
          name: 'Dr. Johnson',
          specialization: 'Internal Medicine'
        }
      }
    ])
  }),
  
  // Mock get my appointments endpoint
  http.get('/api/appointments/my-appointments', () => {
    return HttpResponse.json([
      {
        appointmentId: 1,
        patientId: 'P001',
        patientName: 'John Patient',
        doctorId: 'D001',
        doctorName: 'Dr. John Smith',
        doctorSpecialization: 'Cardiology',
        appointmentDate: '2024-12-25T10:00:00Z',
        status: 'SCHEDULED',
        reason: 'Regular checkup',
        notes: 'No specific concerns',
        createdAt: '2024-12-20T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z'
      },
      {
        appointmentId: 2,
        patientId: 'P001',
        patientName: 'John Patient',
        doctorId: 'D002',
        doctorName: 'Dr. Jane Doe',
        doctorSpecialization: 'Dermatology',
        appointmentDate: '2024-12-20T14:00:00Z',
        status: 'COMPLETED',
        reason: 'Skin consultation',
        notes: 'Follow-up required',
        createdAt: '2024-12-15T10:00:00Z',
        updatedAt: '2024-12-20T14:30:00Z'
      }
    ])
  }),

  // Mock get upcoming appointments endpoint
  http.get('/api/appointments/upcoming', () => {
    return HttpResponse.json([
      {
        appointmentId: 1,
        doctorName: 'Dr. John Smith',
        doctorSpecialization: 'Cardiology',
        appointmentDate: '2024-12-25T10:00:00Z',
        status: 'SCHEDULED'
      },
      {
        appointmentId: 2,
        doctorName: 'Dr. Jane Doe',
        doctorSpecialization: 'Dermatology',
        appointmentDate: '2024-12-28T14:00:00Z',
        status: 'SCHEDULED'
      }
    ])
  }),

  // Mock get specializations endpoint
  http.get('/api/appointments/specializations', () => {
    return HttpResponse.json([
      'Cardiology',
      'Dermatology',
      'Pediatrics',
      'Orthopedics',
      'Neurology',
      'Oncology'
    ])
  }),

  // Mock get doctors endpoint
  http.get('/api/appointments/doctors', () => {
    return HttpResponse.json([
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
    ])
  }),

  // Mock book appointment endpoint
  http.post('/api/appointments/book', async ({ request }) => {
    const body = await request.json() as BookAppointmentRequest
    
    return HttpResponse.json({
      status: 'success',
      message: 'Appointment booked successfully',
      appointmentId: 3,
      appointment: {
        id: 3,
        patientId: body.patientId,
        doctorId: body.doctorId,
        appointmentDate: body.appointmentDate,
        status: 'SCHEDULED',
        notes: body.notes
      }
    })
  }),

  // Mock update appointment status endpoint
  http.put('/api/appointments/:id/status', async ({ params }) => {
    const { id } = params
    
    return HttpResponse.json({
      status: 'success',
      message: 'Appointment status updated',
      appointmentId: id
    })
  }),

  // Mock cancel appointment endpoint
  http.post('/api/appointments/:id/cancel', async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as CancelAppointmentRequest
    
    return HttpResponse.json({
      status: 'success',
      message: 'Appointment cancelled successfully',
      appointmentId: id,
      cancellationReason: body.reason
    })
  }),

  // Mock get doctors endpoint (legacy)
  http.get('/api/doctors', () => {
    return HttpResponse.json([
      {
        id: 1,
        userId: 'D001',
        name: 'Dr. Smith',
        specialization: 'Cardiology',
        experience: 10,
        licenseNumber: 'MD12345',
        status: 'ACTIVE'
      },
      {
        id: 2,
        userId: 'D002',
        name: 'Dr. Johnson',
        specialization: 'Internal Medicine',
        experience: 8,
        licenseNumber: 'MD67890',
        status: 'ACTIVE'
      }
    ])
  })
]
