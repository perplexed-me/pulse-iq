package com.pulseiq.service;

import com.pulseiq.dto.TestResultUploadDto;
import com.pulseiq.dto.TestResultResponseDto;
import com.pulseiq.dto.TestResultStatsDto;
import com.pulseiq.entity.TestResult;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

public interface TestResultService {
    
    /**
     * Upload a new test result
     */
    TestResultResponseDto uploadTestResult(TestResultUploadDto uploadDto, String technicianId);
    
    /**
     * Get all test results for a specific patient
     */
    List<TestResultResponseDto> getTestResultsByPatientId(String patientId);
    
    /**
     * Get all test results uploaded by a specific technician
     */
    List<TestResultResponseDto> getTestResultsByTechnicianId(String technicianId);
    
    /**
     * Get all test results ordered by a specific doctor
     */
    List<TestResultResponseDto> getTestResultsByDoctorId(String doctorId);
    
    /**
     * Get test result by ID
     */
    TestResultResponseDto getTestResultById(Long testId);
    
    /**
     * Download PDF file of a test result
     */
    ResponseEntity<Resource> downloadTestResultPdf(Long testId, String userId);
    
    /**
     * Get test results by patient and date range
     */
    List<TestResultResponseDto> getTestResultsByPatientAndDateRange(String patientId, 
                                                                   LocalDateTime startDate, 
                                                                   LocalDateTime endDate);
    
    /**
     * Get test results by patient and test type
     */
    List<TestResultResponseDto> getTestResultsByPatientAndTestType(String patientId, String testType);
    
    /**
     * Update test result status
     */
    TestResultResponseDto updateTestResultStatus(Long testId, TestResult.TestStatus status, String userId);
    
    /**
     * Delete test result (soft delete by changing status)
     */
    void deleteTestResult(Long testId, String userId);
    
    /**
     * Get test statistics for a patient
     */
    TestResultStatsDto getTestStatsByPatientId(String patientId);
    
    /**
     * Get test statistics for a technician
     */
    TestResultStatsDto getTestStatsByTechnicianId(String technicianId);
    
    /**
     * Search test results with multiple criteria
     */
    List<TestResultResponseDto> searchTestResults(String patientId, String doctorId, 
                                                 String technicianId, String testType, 
                                                 TestResult.TestStatus status);
    
    /**
     * Get total count of test results (for debugging)
     */
    long getTotalTestResultCount();
    
    /**
     * Get all test results (for debugging)
     */
    List<TestResult> getAllTestResults();
}
