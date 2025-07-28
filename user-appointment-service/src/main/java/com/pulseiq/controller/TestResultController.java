package com.pulseiq.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pulseiq.dto.TestResultResponseDto;
import com.pulseiq.dto.TestResultStatsDto;
import com.pulseiq.dto.TestResultUploadDto;
import com.pulseiq.entity.TestResult;
import com.pulseiq.service.NotificationService;
import com.pulseiq.service.PatientOtpService;
import com.pulseiq.service.TestResultService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/test-results")
@RequiredArgsConstructor
public class TestResultController {

    private final TestResultService testResultService;
    private final NotificationService notificationService;
    private final PatientOtpService patientOtpService;

    /**
     * Upload a new test result (Technician only)
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadTestResult(@Valid @ModelAttribute TestResultUploadDto uploadDto,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String technicianId = userDetails.getUsername(); // Assuming username is the user ID
            TestResultResponseDto response = testResultService.uploadTestResult(uploadDto, technicianId);
                        
            // Create notification ONLY for patient (not doctor)
            if (response.getPatientId() != null) {
                notificationService.createNotification(
                    response.getPatientId(),
                    "PATIENT", 
                    "Test Result Available",
                    "Your test result for " + response.getTestName() + " is now available.",
                    com.pulseiq.entity.Notification.NotificationType.TEST_RESULT_UPLOADED,
                    response.getTestId().toString(),
                    "TEST_RESULT",
                    technicianId
                );
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Test result uploaded successfully");
            result.put("testResult", response);
            
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get all test results for a patient
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<TestResultResponseDto>> getPatientTestResults(@PathVariable String patientId) {
        List<TestResultResponseDto> testResults = testResultService.getTestResultsByPatientId(patientId);
        return ResponseEntity.ok(testResults);
    }

    /**
     * Get test results uploaded by a technician
     */
    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<TestResultResponseDto>> getTechnicianTestResults(@PathVariable String technicianId) {
        List<TestResultResponseDto> testResults = testResultService.getTestResultsByTechnicianId(technicianId);
        return ResponseEntity.ok(testResults);
    }

    /**
     * Get test results ordered by a doctor
     */
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<TestResultResponseDto>> getDoctorTestResults(@PathVariable String doctorId) {
        List<TestResultResponseDto> testResults = testResultService.getTestResultsByDoctorId(doctorId);
        return ResponseEntity.ok(testResults);
    }

    /**
     * Get my test results (for authenticated patient)
     */
    @GetMapping("/my-tests")
    public ResponseEntity<List<TestResultResponseDto>> getMyTestResults(@AuthenticationPrincipal UserDetails userDetails) {
        String patientId = userDetails.getUsername();
        List<TestResultResponseDto> testResults = testResultService.getTestResultsByPatientId(patientId);
        return ResponseEntity.ok(testResults);
    }

    /**
     * Get test results uploaded by me (for authenticated technician)
     */
    @GetMapping("/my-uploads")
    public ResponseEntity<List<TestResultResponseDto>> getMyUploadedTests(@AuthenticationPrincipal UserDetails userDetails) {
        String technicianId = userDetails.getUsername();
        List<TestResultResponseDto> testResults = testResultService.getTestResultsByTechnicianId(technicianId);
        return ResponseEntity.ok(testResults);
    }

    /**
     * Get test results ordered by me (for authenticated doctor)
     */
    @GetMapping("/my-orders")
    public ResponseEntity<List<TestResultResponseDto>> getMyOrderedTests(@AuthenticationPrincipal UserDetails userDetails) {
        String doctorId = userDetails.getUsername();
        List<TestResultResponseDto> testResults = testResultService.getTestResultsByDoctorId(doctorId);
        return ResponseEntity.ok(testResults);
    }

    /**
     * Get a specific test result by ID
     */
    @GetMapping("/{testId}")
    public ResponseEntity<TestResultResponseDto> getTestResult(@PathVariable Long testId) {
        TestResultResponseDto testResult = testResultService.getTestResultById(testId);
        return ResponseEntity.ok(testResult);
    }

    /**
     * Download PDF of a test result
     */
    @GetMapping("/{testId}/download")
    public ResponseEntity<Resource> downloadTestResult(@PathVariable Long testId,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        return testResultService.downloadTestResultPdf(testId, userId);
    }

    /**
     * Get test results by patient and date range
     */
    @GetMapping("/patient/{patientId}/date-range")
    public ResponseEntity<List<TestResultResponseDto>> getTestResultsByDateRange(
            @PathVariable String patientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        List<TestResultResponseDto> testResults = testResultService.getTestResultsByPatientAndDateRange(
                patientId, startDate, endDate);
        return ResponseEntity.ok(testResults);
    }

    /**
     * Get test results by patient and test type
     */
    @GetMapping("/patient/{patientId}/test-type/{testType}")
    public ResponseEntity<List<TestResultResponseDto>> getTestResultsByTestType(
            @PathVariable String patientId,
            @PathVariable String testType) {
        
        List<TestResultResponseDto> testResults = testResultService.getTestResultsByPatientAndTestType(
                patientId, testType);
        return ResponseEntity.ok(testResults);
    }

    /**
     * Update test result status
     */
    @PutMapping("/{testId}/status")
    public ResponseEntity<?> updateTestResultStatus(@PathVariable Long testId,
                                                   @RequestParam TestResult.TestStatus status,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            TestResultResponseDto updatedTestResult = testResultService.updateTestResultStatus(testId, status, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Test result status updated successfully");
            response.put("testResult", updatedTestResult);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Delete test result (soft delete)
     */
    @DeleteMapping("/{testId}")
    public ResponseEntity<?> deleteTestResult(@PathVariable Long testId,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            testResultService.deleteTestResult(testId, userId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Test result deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get test statistics for a patient
     */
    @GetMapping("/patient/{patientId}/stats")
    public ResponseEntity<TestResultStatsDto> getPatientTestStats(@PathVariable String patientId) {
        TestResultStatsDto stats = testResultService.getTestStatsByPatientId(patientId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get test statistics for a technician
     */
    @GetMapping("/technician/{technicianId}/stats")
    public ResponseEntity<TestResultStatsDto> getTechnicianTestStats(@PathVariable String technicianId) {
        TestResultStatsDto stats = testResultService.getTestStatsByTechnicianId(technicianId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get my test statistics (for authenticated patient)
     */
    @GetMapping("/my-stats")
    public ResponseEntity<TestResultStatsDto> getMyTestStats(@AuthenticationPrincipal UserDetails userDetails) {
        String patientId = userDetails.getUsername();
        TestResultStatsDto stats = testResultService.getTestStatsByPatientId(patientId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get my upload statistics (for authenticated technician)
     */
    @GetMapping("/my-upload-stats")
    public ResponseEntity<TestResultStatsDto> getMyUploadStats(@AuthenticationPrincipal UserDetails userDetails) {
        String technicianId = userDetails.getUsername();
        TestResultStatsDto stats = testResultService.getTestStatsByTechnicianId(technicianId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Search test results with multiple criteria
     */
    @GetMapping("/search")
    public ResponseEntity<List<TestResultResponseDto>> searchTestResults(
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) String technicianId,
            @RequestParam(required = false) String testType,
            @RequestParam(required = false) TestResult.TestStatus status) {
        
        List<TestResultResponseDto> testResults = testResultService.searchTestResults(
                patientId, doctorId, technicianId, testType, status);
        return ResponseEntity.ok(testResults);
    }

    /**
     * Debug endpoint to get total count of test results (no auth required)
     */
    @GetMapping("/debug/count")
    public ResponseEntity<Map<String, Object>> getTestResultCount() {
        try {
            long totalCount = testResultService.getTotalTestResultCount();
            Map<String, Object> result = new HashMap<>();
            result.put("totalTestResults", totalCount);
            result.put("message", totalCount > 0 ? "Test results exist in database" : "No test results in database");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            return ResponseEntity.ok(errorResult);
        }
    }

    /**
     * Generate OTP for doctor to access patient test results
     */
    @PostMapping("/doctor/request-otp")
    public ResponseEntity<?> requestOtpForPatientResults(@RequestParam String patientId,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String doctorId = userDetails.getUsername();
            String result = patientOtpService.generateOtpForTestResults(patientId, doctorId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", result);
            response.put("info", "OTP has been sent to patient's email. Valid for 10 minutes.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Verify OTP and get patient test results for doctor
     */
    @PostMapping("/doctor/verify-otp")
    public ResponseEntity<?> verifyOtpAndGetPatientResults(@RequestParam String patientId,
                                                          @RequestParam String otp,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String doctorId = userDetails.getUsername();
            
            if (patientOtpService.verifyOtp(patientId, doctorId, otp)) {
                // OTP verified, get all test results for this patient
                List<TestResultResponseDto> testResults = testResultService.getTestResultsByPatientId(patientId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "OTP verified successfully");
                response.put("testResults", testResults);
                response.put("patientId", patientId);
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid or expired OTP");
                return ResponseEntity.badRequest().body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Download test result PDF with OTP verification for doctors
     */
    @PostMapping("/doctor/download-with-otp")
    public ResponseEntity<?> downloadTestResultWithOtp(@RequestParam Long testId,
                                                      @RequestParam String patientId,
                                                      @RequestParam String otp,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String doctorId = userDetails.getUsername();
            
            if (patientOtpService.verifyOtpForDownload(patientId, doctorId, otp)) {
                // OTP verified, now validate that test result belongs to the specified patient
                return testResultService.downloadTestResultForPatient(testId, doctorId, patientId);
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid or expired OTP");
                return ResponseEntity.badRequest().body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Debug endpoint to check which technician IDs exist (no auth required)
     */
    @GetMapping("/debug/technicians")
    public ResponseEntity<Map<String, Object>> getTestResultTechnicians() {
        try {
            // Use repository directly to avoid DTO mapping issues
            List<TestResult> allResults = testResultService.getAllTestResults();
            Map<String, Object> result = new HashMap<>();
            List<String> technicianIds = new ArrayList<>();
            Map<String, Integer> technicianCounts = new HashMap<>();
            
            for (TestResult testResult : allResults) {
                String techId = testResult.getTechnicianId();
                if (techId != null && !technicianIds.contains(techId)) {
                    technicianIds.add(techId);
                }
                technicianCounts.put(techId, technicianCounts.getOrDefault(techId, 0) + 1);
            }
            
            result.put("totalTestResults", allResults.size());
            result.put("technicianIds", technicianIds);
            result.put("technicianCounts", technicianCounts);
            result.put("yourTechnicianId", "T202506001");
            result.put("hasResultsForYou", technicianIds.contains("T202506001"));
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            errorResult.put("errorType", e.getClass().getSimpleName());
            return ResponseEntity.ok(errorResult);
        }
    }

    /**
     * Get distinct test types for a patient (Doctor only with permission validation)
     */
    @GetMapping("/patient/{patientId}/test-types")
    public ResponseEntity<?> getTestTypesByPatient(@PathVariable String patientId,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String doctorId = userDetails.getUsername();
            
            // Get test types for the patient
            List<String> testTypes = testResultService.getTestTypesByPatient(patientId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("patientId", patientId);
            result.put("testTypes", testTypes);
            result.put("success", true);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            errorResult.put("success", false);
            return ResponseEntity.badRequest().body(errorResult);
        }
    }

    /**
     * Request OTP for specific test type access
     */
    @PostMapping("/patient/{patientId}/test-type/{testType}/request-otp")
    public ResponseEntity<?> requestOtpForTestType(@PathVariable String patientId,
                                                   @PathVariable String testType,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String doctorId = userDetails.getUsername();
            
            String message = patientOtpService.generateOtpForTestType(patientId, doctorId, testType);
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", message);
            result.put("success", true);
            result.put("testType", testType);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            errorResult.put("success", false);
            return ResponseEntity.badRequest().body(errorResult);
        }
    }

    /**
     * Verify OTP and get test results for specific test type
     */
    @PostMapping("/patient/{patientId}/test-type/{testType}/verify-otp")
    public ResponseEntity<?> verifyOtpForTestType(@PathVariable String patientId,
                                                  @PathVariable String testType,
                                                  @RequestParam String otp,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String doctorId = userDetails.getUsername();
            
            // Verify OTP
            boolean isValid = patientOtpService.verifyOtpForTestType(patientId, doctorId, testType, otp);
            
            if (isValid) {
                // Get test results for this test type
                List<TestResultResponseDto> testResults = testResultService.getTestResultsByPatientAndTestTypeForDoctor(
                    patientId, testType, doctorId);
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "OTP verified successfully");
                result.put("testResults", testResults);
                result.put("testType", testType);
                
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("error", "Invalid or expired OTP");
                errorResult.put("success", false);
                return ResponseEntity.badRequest().body(errorResult);
            }
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            errorResult.put("success", false);
            return ResponseEntity.badRequest().body(errorResult);
        }
    }

    /**
     * Cancel OTP for test type (when dialog is closed)
     */
    @PostMapping("/patient/{patientId}/test-type/{testType}/cancel-otp")
    public ResponseEntity<?> cancelOtpForTestType(@PathVariable String patientId,
                                                  @PathVariable String testType,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String doctorId = userDetails.getUsername();
            
            patientOtpService.cancelOtpForTestType(patientId, doctorId, testType);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "OTP cancelled successfully");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            errorResult.put("success", false);
            return ResponseEntity.badRequest().body(errorResult);
        }
    }

    /**
     * Debug endpoint to test stats calculation for technician T202506001 (no auth required)
     */
    @GetMapping("/debug/stats-test")
    public ResponseEntity<Map<String, Object>> getStatsTest() {
        try {
            TestResultStatsDto stats = testResultService.getTestStatsByTechnicianId("T202506001");
            Map<String, Object> result = new HashMap<>();
            result.put("totalTests", stats.getTotalTests());
            result.put("completedTests", stats.getCompletedTests());
            result.put("pendingTests", stats.getPendingTests());
            result.put("reviewedTests", stats.getReviewedTests());
            result.put("cancelledTests", stats.getCancelledTests());
            result.put("testsThisMonth", stats.getTestsThisMonth());
            result.put("testsThisYear", stats.getTestsThisYear());
            result.put("mostFrequentTestType", stats.getMostFrequentTestType());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            errorResult.put("errorType", e.getClass().getSimpleName());
            errorResult.put("stackTrace", e.getStackTrace());
            return ResponseEntity.ok(errorResult);
        }
    }
}
