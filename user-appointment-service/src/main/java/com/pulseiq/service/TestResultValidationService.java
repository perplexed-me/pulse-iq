package com.pulseiq.service;

import com.pulseiq.repository.PatientRepository;
import com.pulseiq.repository.DoctorRepository;
import com.pulseiq.repository.TechnicianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class TestResultValidationService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final TechnicianRepository technicianRepository;

    // Maximum file size: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    
    // Allowed MIME types
    private static final String[] ALLOWED_MIME_TYPES = {
        "application/pdf"
    };

    /**
     * Validate if patient exists
     */
    public boolean isValidPatient(String patientId) {
        return patientRepository.existsByPatientId(patientId);
    }

    /**
     * Validate if doctor exists
     */
    public boolean isValidDoctor(String doctorId) {
        return doctorRepository.existsByDoctorId(doctorId);
    }

    /**
     * Validate if technician exists
     */
    public boolean isValidTechnician(String technicianId) {
        return technicianRepository.existsByTechnicianId(technicianId);
    }

    /**
     * Validate PDF file
     */
    public ValidationResult validatePdfFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ValidationResult.invalid("PDF file is required");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            return ValidationResult.invalid("File size exceeds maximum limit of 10MB");
        }

        // Check MIME type
        String contentType = file.getContentType();
        if (contentType == null || !isAllowedMimeType(contentType)) {
            return ValidationResult.invalid("Only PDF files are allowed");
        }

        // Check file extension
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            return ValidationResult.invalid("File must have .pdf extension");
        }

        // Additional security check: validate file header
        try {
            byte[] fileHeader = new byte[4];
            file.getInputStream().read(fileHeader);
            
            // PDF files start with %PDF
            if (!(fileHeader[0] == 0x25 && fileHeader[1] == 0x50 && 
                  fileHeader[2] == 0x44 && fileHeader[3] == 0x46)) {
                return ValidationResult.invalid("File is not a valid PDF");
            }
        } catch (Exception e) {
            return ValidationResult.invalid("Error validating file format");
        }

        return ValidationResult.valid();
    }

    /**
     * Validate test name
     */
    public ValidationResult validateTestName(String testName) {
        if (testName == null || testName.trim().isEmpty()) {
            return ValidationResult.invalid("Test name is required");
        }
        
        if (testName.length() > 100) {
            return ValidationResult.invalid("Test name must not exceed 100 characters");
        }

        return ValidationResult.valid();
    }

    /**
     * Validate test type
     */
    public ValidationResult validateTestType(String testType) {
        if (testType == null || testType.trim().isEmpty()) {
            return ValidationResult.invalid("Test type is required");
        }
        
        if (testType.length() > 50) {
            return ValidationResult.invalid("Test type must not exceed 50 characters");
        }

        return ValidationResult.valid();
    }

    /**
     * Comprehensive validation for test result upload
     */
    public ValidationResult validateTestResultUpload(String testName, String testType, 
                                                   String patientId, String doctorId, 
                                                   String technicianId, MultipartFile pdfFile) {
        
        // Validate test name
        ValidationResult testNameResult = validateTestName(testName);
        if (!testNameResult.isValid()) {
            return testNameResult;
        }

        // Validate test type
        ValidationResult testTypeResult = validateTestType(testType);
        if (!testTypeResult.isValid()) {
            return testTypeResult;
        }

        // Validate patient
        if (!isValidPatient(patientId)) {
            return ValidationResult.invalid("Patient not found with ID: " + patientId);
        }

        // Validate doctor only if doctorId is provided, not empty, and looks like a doctor ID (starts with D followed by numbers)
        if (doctorId != null && !doctorId.trim().isEmpty()) {
            String cleanDoctorId = doctorId.trim();
            System.out.println("=== DOCTOR VALIDATION DEBUG ===");
            System.out.println("Doctor ID received: '" + doctorId + "'");
            System.out.println("Doctor ID after trim: '" + cleanDoctorId + "'");
            
            // Only validate if it looks like a real doctor ID (D followed by numbers)
            if (cleanDoctorId.matches("D\\d+")) {
                System.out.println("Doctor ID matches pattern D+numbers, validating against database...");
                if (!isValidDoctor(cleanDoctorId)) {
                    System.out.println("Doctor validation FAILED for ID: " + cleanDoctorId);
                    return ValidationResult.invalid("Doctor not found with ID: " + cleanDoctorId);
                }
                System.out.println("Doctor validation PASSED for ID: " + cleanDoctorId);
            } else {
                System.out.println("Doctor ID does not match pattern D+numbers, treating as custom doctor name: " + cleanDoctorId);
                System.out.println("Skipping database validation for custom doctor name");
            }
        } else {
            System.out.println("=== DOCTOR VALIDATION SKIPPED ===");
            System.out.println("Doctor ID is null or empty: " + doctorId);
        }

        // Validate technician
        if (!isValidTechnician(technicianId)) {
            return ValidationResult.invalid("Technician not found with ID: " + technicianId);
        }

        // Validate PDF file
        ValidationResult fileResult = validatePdfFile(pdfFile);
        if (!fileResult.isValid()) {
            return fileResult;
        }

        return ValidationResult.valid();
    }

    private boolean isAllowedMimeType(String mimeType) {
        for (String allowedType : ALLOWED_MIME_TYPES) {
            if (allowedType.equals(mimeType)) {
                return true;
            }
        }
        return false;
    }

    // Validation result class
    public static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;

        private ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }

        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String errorMessage) {
            return new ValidationResult(false, errorMessage);
        }

        public boolean isValid() {
            return valid;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }
}
