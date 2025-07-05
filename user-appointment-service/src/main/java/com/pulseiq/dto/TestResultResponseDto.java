package com.pulseiq.dto;

import lombok.Data;
import com.pulseiq.entity.TestResult;
import java.time.LocalDateTime;

@Data
public class TestResultResponseDto {

    private Long testId;
    private String testName;
    private String testType;
    private String description;
    private String pdfFilename;
    private Long fileSize;
    private String patientId;
    private String patientName;
    private String doctorId;
    private String doctorName;
    private String technicianId;
    private String technicianName;
    private LocalDateTime uploadedAt;
    private LocalDateTime testDate;
    private TestResult.TestStatus status;
    private String notes;

    // Constructor for easy mapping from entity
    public TestResultResponseDto(TestResult testResult) {
        this.testId = testResult.getTestId();
        this.testName = testResult.getTestName();
        this.testType = testResult.getTestType();
        this.description = testResult.getDescription();
        this.pdfFilename = testResult.getPdfFilename();
        this.fileSize = testResult.getFileSize();
        this.patientId = testResult.getPatientId();
        this.doctorId = testResult.getDoctorId();
        this.technicianId = testResult.getTechnicianId();
        this.uploadedAt = testResult.getUploadedAt();
        this.testDate = testResult.getTestDate();
        this.status = testResult.getStatus();
        this.notes = testResult.getNotes();
        
        // Set names from related entities if available - with safe lazy loading
        try {
            if (testResult.getPatient() != null) {
                this.patientName = testResult.getPatient().getFirstName() + " " + testResult.getPatient().getLastName();
            }
        } catch (Exception e) {
            // Handle lazy loading issues
            this.patientName = null;
        }
        
        try {
            if (testResult.getDoctor() != null) {
                this.doctorName = testResult.getDoctor().getFirstName() + " " + testResult.getDoctor().getLastName();
            }
        } catch (Exception e) {
            // Handle lazy loading issues
            this.doctorName = null;
        }
        
        try {
            if (testResult.getTechnician() != null) {
                this.technicianName = testResult.getTechnician().getFirstName() + " " + testResult.getTechnician().getLastName();
            }
        } catch (Exception e) {
            // Handle lazy loading issues
            this.technicianName = null;
        }
    }
}
