package com.pulseiq.service;

import com.pulseiq.dto.TestResultUploadDto;
import com.pulseiq.dto.TestResultResponseDto;
import com.pulseiq.dto.TestResultStatsDto;
import com.pulseiq.entity.TestResult;
import com.pulseiq.entity.Appointment.AppointmentStatus;
import com.pulseiq.repository.TestResultRepository;
import com.pulseiq.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TestResultServiceImpl implements TestResultService {

    private final TestResultRepository testResultRepository;
    private final AppointmentRepository appointmentRepository;
    private final TestResultValidationService validationService;

    @Override
    public TestResultResponseDto uploadTestResult(TestResultUploadDto uploadDto, String technicianId) {
        // Comprehensive validation
        TestResultValidationService.ValidationResult validation = validationService.validateTestResultUpload(
            uploadDto.getTestName(), 
            uploadDto.getTestType(),
            uploadDto.getPatientId(),
            uploadDto.getDoctorId(),
            technicianId,
            uploadDto.getPdfFile()
        );

        if (!validation.isValid()) {
            throw new RuntimeException(validation.getErrorMessage());
        }

        // Get the PDF file from the DTO
        MultipartFile pdfFile = uploadDto.getPdfFile();

        // Create TestResult entity
        TestResult testResult = new TestResult();
        testResult.setTestName(uploadDto.getTestName());
        testResult.setTestType(uploadDto.getTestType());
        testResult.setDescription(uploadDto.getDescription());
        testResult.setPatientId(uploadDto.getPatientId());
        
        // Set doctor ID only if it's provided and not empty
        String doctorId = uploadDto.getDoctorId();
        if (doctorId != null && !doctorId.trim().isEmpty()) {
            testResult.setDoctorId(doctorId.trim());
        }
        
        testResult.setTechnicianId(technicianId);
        testResult.setPdfFilename(pdfFile.getOriginalFilename());
        testResult.setFileSize(pdfFile.getSize());
        testResult.setTestDate(uploadDto.getTestDate());
        testResult.setNotes(uploadDto.getNotes());
        testResult.setUploadedAt(LocalDateTime.now());
        testResult.setStatus(TestResult.TestStatus.COMPLETED);

        try {
            testResult.setPdfData(pdfFile.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to process PDF file", e);
        }

        // Save to database
        TestResult savedTestResult = testResultRepository.save(testResult);

        // Fetch the complete entity with relationships for response
        TestResult completeTestResult = testResultRepository.findById(savedTestResult.getTestId())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve saved test result"));

        return new TestResultResponseDto(completeTestResult);
    }

    @Override
    public List<TestResultResponseDto> getTestResultsByPatientId(String patientId) {
        List<TestResult> testResults = testResultRepository.findByPatientIdOrderByUploadedAtDesc(patientId);
        return testResults.stream()
                .map(TestResultResponseDto::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<TestResultResponseDto> getTestResultsByTechnicianId(String technicianId) {
        List<TestResult> testResults = testResultRepository.findByTechnicianIdOrderByUploadedAtDesc(technicianId);
        return testResults.stream()
                .map(TestResultResponseDto::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<TestResultResponseDto> getTestResultsByDoctorId(String doctorId) {
        List<TestResult> testResults = testResultRepository.findByDoctorIdOrderByUploadedAtDesc(doctorId);
        return testResults.stream()
                .map(TestResultResponseDto::new)
                .collect(Collectors.toList());
    }

    @Override
    public TestResultResponseDto getTestResultById(Long testId) {
        TestResult testResult = testResultRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test result not found with ID: " + testId));
        return new TestResultResponseDto(testResult);
    }

    @Override
    public ResponseEntity<Resource> downloadTestResultPdf(Long testId, String userId) {
        TestResult testResult = testResultRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test result not found with ID: " + testId));

        // Check if user has permission to download (patient, doctor, or technician involved)
        if (!hasDownloadPermission(testResult, userId)) {
            throw new RuntimeException("You don't have permission to download this test result");
        }

        ByteArrayResource resource = new ByteArrayResource(testResult.getPdfData());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(testResult.getFileSize())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + testResult.getPdfFilename() + "\"")
                .body(resource);
    }

    @Override
    public ResponseEntity<Resource> downloadTestResultForPatient(Long testId, String doctorId, String patientId) {
        TestResult testResult = testResultRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test result not found with ID: " + testId));

        // Validate that the test result belongs to the specified patient
        if (!testResult.getPatientId().equals(patientId)) {
            throw new RuntimeException("Test result does not belong to the specified patient");
        }

        // Validate that the doctor has completed appointments with this patient
        if (!hasCompletedAppointmentWithPatient(doctorId, patientId)) {
            throw new RuntimeException("You don't have permission to access this patient's test results");
        }

        ByteArrayResource resource = new ByteArrayResource(testResult.getPdfData());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(testResult.getFileSize())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + testResult.getPdfFilename() + "\"")
                .body(resource);
    }

    @Override
    public List<TestResultResponseDto> getTestResultsByPatientAndDateRange(String patientId, 
                                                                          LocalDateTime startDate, 
                                                                          LocalDateTime endDate) {
        List<TestResult> testResults = testResultRepository.findByPatientIdAndDateRange(patientId, startDate, endDate);
        return testResults.stream()
                .map(TestResultResponseDto::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<TestResultResponseDto> getTestResultsByPatientAndTestType(String patientId, String testType) {
        List<TestResult> testResults = testResultRepository.findByPatientIdAndTestTypeOrderByUploadedAtDesc(patientId, testType);
        return testResults.stream()
                .map(TestResultResponseDto::new)
                .collect(Collectors.toList());
    }

    @Override
    public TestResultResponseDto updateTestResultStatus(Long testId, TestResult.TestStatus status, String userId) {
        TestResult testResult = testResultRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test result not found with ID: " + testId));

        // Check permission (only doctor or technician can update status)
        if (!hasUpdatePermission(testResult, userId)) {
            throw new RuntimeException("You don't have permission to update this test result");
        }

        testResult.setStatus(status);
        TestResult updatedTestResult = testResultRepository.save(testResult);
        return new TestResultResponseDto(updatedTestResult);
    }

    @Override
    public void deleteTestResult(Long testId, String userId) {
        TestResult testResult = testResultRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test result not found with ID: " + testId));

        // Check permission (only technician who uploaded or admin can delete)
        if (!hasDeletePermission(testResult, userId)) {
            throw new RuntimeException("You don't have permission to delete this test result");
        }

        testResult.setStatus(TestResult.TestStatus.CANCELLED);
        testResultRepository.save(testResult);
    }

    @Override
    public TestResultStatsDto getTestStatsByPatientId(String patientId) {
        List<TestResult> allTests = testResultRepository.findByPatientIdOrderByUploadedAtDesc(patientId);
        
        long totalTests = allTests.size();
        long completedTests = allTests.stream().mapToLong(t -> t.getStatus() == TestResult.TestStatus.COMPLETED ? 1 : 0).sum();
        long reviewedTests = allTests.stream().mapToLong(t -> t.getStatus() == TestResult.TestStatus.REVIEWED ? 1 : 0).sum();
        long cancelledTests = allTests.stream().mapToLong(t -> t.getStatus() == TestResult.TestStatus.CANCELLED ? 1 : 0).sum();

        // Pending review = tests that are COMPLETED but not yet REVIEWED
        // This represents tests ready for doctor review
        long pendingTests = completedTests;

        // Find most frequent test type
        String mostFrequentTestType = allTests.stream()
                .collect(Collectors.groupingBy(TestResult::getTestType, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");

        // Tests this month and year
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime startOfYear = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
        
        long testsThisMonth = allTests.stream().mapToLong(t -> t.getUploadedAt().isAfter(startOfMonth) ? 1 : 0).sum();
        long testsThisYear = allTests.stream().mapToLong(t -> t.getUploadedAt().isAfter(startOfYear) ? 1 : 0).sum();

        return new TestResultStatsDto(totalTests, completedTests, pendingTests, reviewedTests, 
                                    cancelledTests, mostFrequentTestType, testsThisMonth, testsThisYear);
    }

    @Override
    public TestResultStatsDto getTestStatsByTechnicianId(String technicianId) {
        List<TestResult> allTests = testResultRepository.findByTechnicianIdOrderByUploadedAtDesc(technicianId);
        
        long totalTests = allTests.size();
        long completedTests = allTests.stream().mapToLong(t -> t.getStatus() == TestResult.TestStatus.COMPLETED ? 1 : 0).sum();
        long reviewedTests = allTests.stream().mapToLong(t -> t.getStatus() == TestResult.TestStatus.REVIEWED ? 1 : 0).sum();
        long cancelledTests = allTests.stream().mapToLong(t -> t.getStatus() == TestResult.TestStatus.CANCELLED ? 1 : 0).sum();
        
        // Pending review = tests that are COMPLETED (ready for review) but not yet REVIEWED
        // This represents tests ready for doctor review
        long pendingTests = completedTests;

        // Find most frequent test type uploaded by this technician
        String mostFrequentTestType = allTests.stream()
                .collect(Collectors.groupingBy(TestResult::getTestType, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");

        // Tests uploaded this month and year
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime startOfYear = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
        
        long testsThisMonth = allTests.stream().mapToLong(t -> t.getUploadedAt().isAfter(startOfMonth) ? 1 : 0).sum();
        long testsThisYear = allTests.stream().mapToLong(t -> t.getUploadedAt().isAfter(startOfYear) ? 1 : 0).sum();

        return new TestResultStatsDto(totalTests, completedTests, pendingTests, reviewedTests, 
                                    cancelledTests, mostFrequentTestType, testsThisMonth, testsThisYear);
    }

    @Override
    public List<TestResultResponseDto> searchTestResults(String patientId, String doctorId, 
                                                        String technicianId, String testType, 
                                                        TestResult.TestStatus status) {
        List<TestResult> testResults = testResultRepository.findTestResultsByCriteria(
                patientId, doctorId, technicianId, testType, status);
        return testResults.stream()
                .map(TestResultResponseDto::new)
                .collect(Collectors.toList());
    }

    private boolean hasDownloadPermission(TestResult testResult, String userId) {
        // Patient can download their own test results
        if (testResult.getPatientId().equals(userId)) {
            return true;
        }
        // Doctor who ordered the test can download
        if (testResult.getDoctorId().equals(userId)) {
            return true;
        }
        // Technician who uploaded can download
        if (testResult.getTechnicianId().equals(userId)) {
            return true;
        }
        // TODO: Add admin permission check if needed
        return false;
    }

    private boolean hasUpdatePermission(TestResult testResult, String userId) {
        // Doctor who ordered the test can update status
        if (testResult.getDoctorId().equals(userId)) {
            return true;
        }
        // Technician who uploaded can update status
        if (testResult.getTechnicianId().equals(userId)) {
            return true;
        }
        // TODO: Add admin permission check if needed
        return false;
    }

    private boolean hasDeletePermission(TestResult testResult, String userId) {
        // Only technician who uploaded can delete (soft delete)
        if (testResult.getTechnicianId().equals(userId)) {
            return true;
        }
        // TODO: Add admin permission check if needed
        return false;
    }

    private boolean hasCompletedAppointmentWithPatient(String doctorId, String patientId) {
        // Check if doctor has any completed appointments with this patient
        return appointmentRepository.existsByDoctorIdAndPatientIdAndStatus(
            doctorId, patientId, AppointmentStatus.COMPLETED
        );
    }

    @Override
    public long getTotalTestResultCount() {
        return testResultRepository.count();
    }
    
    @Override
    public List<TestResult> getAllTestResults() {
        return testResultRepository.findAll();
    }

    @Override
    public List<String> getTestTypesByPatient(String patientId) {
        return testResultRepository.findDistinctTestTypesByPatientId(patientId);
    }

    @Override
    public List<TestResultResponseDto> getTestResultsByPatientAndTestTypeForDoctor(String patientId, String testType, String doctorId) {
        // Validate that doctor has completed appointments with this patient
        if (!hasCompletedAppointmentWithPatient(doctorId, patientId)) {
            throw new RuntimeException("Doctor does not have permission to access this patient's test results");
        }
        
        // Get test results for the specific test type
        List<TestResult> testResults = testResultRepository.findByPatientIdAndTestTypeOrderByTestDateDesc(patientId, testType);
        
        return testResults.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    private TestResultResponseDto convertToResponseDto(TestResult testResult) {
        return new TestResultResponseDto(testResult);
    }
}
