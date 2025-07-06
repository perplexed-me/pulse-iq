import { http, HttpResponse } from 'msw'

// Types for request bodies
interface UpdateTestStatusRequest {
  status: string
}

export const testResultHandlers = [
  // Mock get test results endpoint
  http.get('/api/test-results/my-tests', () => {
    return HttpResponse.json([
      {
        testId: 1,
        testName: 'Blood Test',
        testType: 'Laboratory',
        testDate: '2024-12-20',
        status: 'COMPLETED',
        doctorName: 'Dr. John Smith',
        patientName: 'John Patient'
      },
      {
        testId: 2,
        testName: 'X-Ray',
        testType: 'Imaging',
        testDate: '2024-12-15',
        status: 'PENDING',
        doctorName: 'Dr. Jane Doe',
        patientName: 'John Patient'
      }
    ])
  }),

  // Mock get test stats endpoint
  http.get('/api/test-results/my-stats', () => {
    return HttpResponse.json({
      totalTests: 10,
      completedTests: 8,
      pendingTests: 2,
      rejectedTests: 0
    })
  }),

  // Mock test result upload endpoint
  http.post('/api/test-results/upload', async ({ request }) => {
    const formData = await request.formData()
    const testName = formData.get('testName')
    const testType = formData.get('testType')
    const patientId = formData.get('patientId')
    const doctorId = formData.get('doctorId')
    const pdfFile = formData.get('pdfFile')

    // Validate required fields
    if (!testName || !testType || !patientId || !doctorId || !pdfFile) {
      return HttpResponse.json({
        status: 'error',
        message: 'All fields are required'
      }, { status: 400 })
    }

    // Validate file type
    if (pdfFile instanceof File && !pdfFile.type.includes('pdf')) {
      return HttpResponse.json({
        status: 'error',
        message: 'Only PDF files are allowed'
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (pdfFile instanceof File && pdfFile.size > 10 * 1024 * 1024) {
      return HttpResponse.json({
        status: 'error',
        message: 'File size must be less than 10MB'
      }, { status: 400 })
    }

    return HttpResponse.json({
      status: 'success',
      message: 'Test result uploaded successfully',
      testId: 123,
      testName: testName,
      testType: testType,
      uploadDate: new Date().toISOString()
    })
  }),

  // Mock test result download endpoint
  http.get('/api/test-results/:id/download', ({ params }) => {
    const { id } = params
    
    // Return a mock PDF blob
    const pdfContent = 'Mock PDF content for test result ' + id
    return new HttpResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="test-result-${id}.pdf"`
      }
    })
  }),

  // Mock update test status endpoint
  http.put('/api/test-results/:id/status', async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as UpdateTestStatusRequest
    
    return HttpResponse.json({
      status: 'success',
      message: 'Test status updated successfully',
      testId: id,
      newStatus: body.status
    })
  }),

  // Mock get doctor's test results
  http.get('/api/test-results/doctor/:doctorId', ({ params }) => {
    const { doctorId } = params
    
    return HttpResponse.json([
      {
        testId: 1,
        testName: 'Blood Test',
        testType: 'Laboratory',
        testDate: '2024-12-20',
        status: 'COMPLETED',
        patientName: 'John Patient',
        patientId: 'P001'
      },
      {
        testId: 2,
        testName: 'X-Ray Chest',
        testType: 'Imaging',
        testDate: '2024-12-18',
        status: 'PENDING',
        patientName: 'Jane Patient',
        patientId: 'P002'
      }
    ])
  })
]
