package com.pulseiq.repository;

import com.pulseiq.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    
    // Find all test results for a specific patient
    List<TestResult> findByPatientIdOrderByUploadedAtDesc(String patientId);
    
    // Find all test results uploaded by a specific technician
    List<TestResult> findByTechnicianIdOrderByUploadedAtDesc(String technicianId);
    
    // Find all test results ordered by a specific doctor
    List<TestResult> findByDoctorIdOrderByUploadedAtDesc(String doctorId);
    
    // Find test results by status
    List<TestResult> findByStatusOrderByUploadedAtDesc(TestResult.TestStatus status);
    
    // Find test results for a patient by date range
    @Query("SELECT tr FROM TestResult tr WHERE tr.patientId = :patientId AND tr.uploadedAt BETWEEN :startDate AND :endDate ORDER BY tr.uploadedAt DESC")
    List<TestResult> findByPatientIdAndDateRange(@Param("patientId") String patientId, 
                                               @Param("startDate") LocalDateTime startDate, 
                                               @Param("endDate") LocalDateTime endDate);
    
    // Find test results by test type for a patient
    List<TestResult> findByPatientIdAndTestTypeOrderByUploadedAtDesc(String patientId, String testType);
    
    // Find latest test results for a patient (limit by count)
    @Query("SELECT tr FROM TestResult tr WHERE tr.patientId = :patientId ORDER BY tr.uploadedAt DESC")
    List<TestResult> findLatestTestResultsByPatientId(@Param("patientId") String patientId);
    
    // Count total tests for a patient
    long countByPatientId(String patientId);
    
    // Count tests uploaded by a technician
    long countByTechnicianId(String technicianId);
    
    // Find test results by multiple criteria
    @Query("SELECT tr FROM TestResult tr WHERE " +
           "(:patientId IS NULL OR tr.patientId = :patientId) AND " +
           "(:doctorId IS NULL OR tr.doctorId = :doctorId) AND " +
           "(:technicianId IS NULL OR tr.technicianId = :technicianId) AND " +
           "(:testType IS NULL OR tr.testType = :testType) AND " +
           "(:status IS NULL OR tr.status = :status) " +
           "ORDER BY tr.uploadedAt DESC")
    List<TestResult> findTestResultsByCriteria(@Param("patientId") String patientId,
                                             @Param("doctorId") String doctorId,
                                             @Param("technicianId") String technicianId,
                                             @Param("testType") String testType,
                                             @Param("status") TestResult.TestStatus status);

    // Get distinct test types for a specific patient
    @Query("SELECT DISTINCT tr.testType FROM TestResult tr WHERE tr.patientId = :patientId ORDER BY tr.testType")
    List<String> findDistinctTestTypesByPatientId(@Param("patientId") String patientId);

    // Find test results by patient and test type ordered by test date
    List<TestResult> findByPatientIdAndTestTypeOrderByTestDateDesc(String patientId, String testType);
}
