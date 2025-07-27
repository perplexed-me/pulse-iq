package com.pulseiq.service;

import com.pulseiq.entity.Patient;
import com.pulseiq.entity.User;
import com.pulseiq.repository.PatientRepository;
import com.pulseiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientOtpService {
    
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    // In-memory OTP storage (in production, use Redis or database)
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    
    private static class OtpData {
        private final String otp;
        private final LocalDateTime expiryTime;
        private final String doctorId;
        private final String patientId;
        private final String testType; // Added test type
        
        public OtpData(String otp, LocalDateTime expiryTime, String doctorId, String patientId, String testType) {
            this.otp = otp;
            this.expiryTime = expiryTime;
            this.doctorId = doctorId;
            this.patientId = patientId;
            this.testType = testType;
        }
        
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryTime);
        }
        
        public boolean isValid(String inputOtp, String requestingDoctorId, String requestedTestType) {
            return !isExpired() && otp.equals(inputOtp) && doctorId.equals(requestingDoctorId) && testType.equals(requestedTestType);
        }
        
        public String getTestType() {
            return testType;
        }
    }
    
    /**
     * Generate and send OTP to patient for test result access
     */
    @Transactional
    public String generateOtpForTestResults(String patientId, String doctorId) {
        try {
            log.info("=== OTP Generation Started ===");
            log.info("Patient ID: {}, Doctor ID: {}", patientId, doctorId);
            
            // Find patient to get email
            Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));
            
            log.info("Patient found: {} {}", patient.getFirstName(), patient.getLastName());
            
            // Generate 6-digit OTP
            String otp = String.format("%06d", secureRandom.nextInt(1000000));
            log.info("OTP generated: {}", otp);
            
            // Set expiry time (10 minutes from now)
            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10);
            
            // Store OTP
            String otpKey = generateOtpKey(patientId, doctorId);
            otpStorage.put(otpKey, new OtpData(otp, expiryTime, doctorId, patientId, "ALL"));
            log.info("OTP stored with key: {}", otpKey);
            
            // Send OTP to patient's email
            User user = userRepository.findByUserId(patientId)
                .orElseThrow(() -> new RuntimeException("User not found for patient: " + patientId));
            
            String patientEmail = user.getEmail();
            log.info("Patient email: {}", patientEmail);
            
            if (patientEmail != null) {
                log.info("Calling notificationService.sendOtpNotification...");
                notificationService.sendOtpNotification(
                    patientId,
                    patientEmail,
                    patient.getFirstName() + " " + patient.getLastName(),
                    otp,
                    doctorId
                );
                
                log.info("OTP generated and sent to patient {} for doctor {}", patientId, doctorId);
                return "OTP sent to patient's email";
            } else {
                throw new RuntimeException("Patient email not found");
            }
            
        } catch (Exception e) {
            log.error("Error generating OTP for patient {} and doctor {}", patientId, doctorId, e);
            throw new RuntimeException("Failed to generate OTP: " + e.getMessage());
        }
    }
    
    /**
     * Verify OTP for test result access (for viewing test results list)
     */
    public boolean verifyOtp(String patientId, String doctorId, String inputOtp) {
        try {
            String otpKey = generateOtpKey(patientId, doctorId);
            OtpData otpData = otpStorage.get(otpKey);
            
            if (otpData == null) {
                log.warn("No OTP found for patient {} and doctor {}", patientId, doctorId);
                return false;
            }
            
            boolean isValid = otpData.isValid(inputOtp, doctorId, "ALL");
            
            if (isValid) {
                // Don't remove OTP after verification - keep it for download
                log.info("OTP verified successfully for patient {} and doctor {}", patientId, doctorId);
            } else {
                log.warn("Invalid or expired OTP for patient {} and doctor {}", patientId, doctorId);
            }
            
            return isValid;
            
        } catch (Exception e) {
            log.error("Error verifying OTP for patient {} and doctor {}", patientId, doctorId, e);
            return false;
        }
    }
    
    /**
     * Verify OTP for test result download (removes OTP after successful verification)
     */
    public boolean verifyOtpForDownload(String patientId, String doctorId, String inputOtp) {
        try {
            String otpKey = generateOtpKey(patientId, doctorId);
            OtpData otpData = otpStorage.get(otpKey);
            
            if (otpData == null) {
                log.warn("No OTP found for download - patient {} and doctor {}", patientId, doctorId);
                return false;
            }
            
            boolean isValid = otpData.isValid(inputOtp, doctorId, "ALL");
            
            if (isValid) {
                // Remove OTP after successful download verification
                otpStorage.remove(otpKey);
                log.info("OTP verified successfully for download - patient {} and doctor {}", patientId, doctorId);
            } else {
                log.warn("Invalid or expired OTP for download - patient {} and doctor {}", patientId, doctorId);
            }
            
            return isValid;
            
        } catch (Exception e) {
            log.error("Error verifying OTP for download - patient {} and doctor {}", patientId, doctorId, e);
            return false;
        }
    }
    
    /**
     * Clean up expired OTPs (should be called periodically)
     */
    public void cleanupExpiredOtps() {
        otpStorage.entrySet().removeIf(entry -> entry.getValue().isExpired());
        log.debug("Cleaned up expired OTPs. Remaining: {}", otpStorage.size());
    }
    
    private String generateOtpKey(String patientId, String doctorId) {
        return patientId + "_" + doctorId;
    }

    private String generateOtpKeyWithTestType(String patientId, String doctorId, String testType) {
        return patientId + "_" + doctorId + "_" + testType;
    }

    /**
     * Generate OTP for specific test type access (NEW METHOD)
     */
    @Transactional
    public String generateOtpForTestType(String patientId, String doctorId, String testType) {
        try {
            log.info("=== OTP Generation Started for Test Type ===");
            log.info("Patient ID: {}, Doctor ID: {}, Test Type: {}", patientId, doctorId, testType);
            
            // Find patient to get email
            Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));
            
            log.info("Patient found: {} {}", patient.getFirstName(), patient.getLastName());
            
            // Generate 6-digit OTP
            String otp = String.format("%06d", secureRandom.nextInt(1000000));
            log.info("OTP generated: {}", otp);
            
            // Set expiry time (10 minutes from now)
            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10);
            
            // Store OTP with test type
            String otpKey = generateOtpKeyWithTestType(patientId, doctorId, testType);
            otpStorage.put(otpKey, new OtpData(otp, expiryTime, doctorId, patientId, testType));
            log.info("OTP stored with key: {}", otpKey);
            
            // Send OTP to patient's email
            User user = userRepository.findByUserId(patientId)
                .orElseThrow(() -> new RuntimeException("User not found for patient: " + patientId));
            
            String patientEmail = user.getEmail();
            log.info("Patient email: {}", patientEmail);
            
            if (patientEmail != null) {
                log.info("Calling notificationService.sendOtpNotificationForTestType...");
                notificationService.sendOtpNotificationForTestType(
                    patientId,
                    patientEmail,
                    patient.getFirstName() + " " + patient.getLastName(),
                    otp,
                    doctorId,
                    testType
                );
                
                log.info("OTP generated and sent to patient {} for doctor {} and test type {}", patientId, doctorId, testType);
                return "OTP sent to patient's email for " + testType + " results";
            } else {
                throw new RuntimeException("Patient email not found");
            }
            
        } catch (Exception e) {
            log.error("Error generating OTP for patient {}, doctor {} and test type {}", patientId, doctorId, testType, e);
            throw new RuntimeException("Failed to generate OTP: " + e.getMessage());
        }
    }

    /**
     * Verify OTP for specific test type access
     */
    public boolean verifyOtpForTestType(String patientId, String doctorId, String testType, String inputOtp) {
        try {
            String otpKey = generateOtpKeyWithTestType(patientId, doctorId, testType);
            OtpData otpData = otpStorage.get(otpKey);
            
            if (otpData == null) {
                log.warn("No OTP found for patient {}, doctor {} and test type {}", patientId, doctorId, testType);
                return false;
            }
            
            boolean isValid = otpData.isValid(inputOtp, doctorId, testType);
            
            if (isValid) {
                // Remove OTP after successful verification for test type access
                otpStorage.remove(otpKey);
                log.info("OTP verified successfully for patient {}, doctor {} and test type {}", patientId, doctorId, testType);
            } else {
                log.warn("Invalid or expired OTP for patient {}, doctor {} and test type {}", patientId, doctorId, testType);
            }
            
            return isValid;
            
        } catch (Exception e) {
            log.error("Error verifying OTP for patient {}, doctor {} and test type {}", patientId, doctorId, testType, e);
            return false;
        }
    }

    /**
     * Remove OTP when dialog is closed or cancelled
     */
    public void cancelOtpForTestType(String patientId, String doctorId, String testType) {
        try {
            String otpKey = generateOtpKeyWithTestType(patientId, doctorId, testType);
            otpStorage.remove(otpKey);
            log.info("OTP cancelled for patient {}, doctor {} and test type {}", patientId, doctorId, testType);
        } catch (Exception e) {
            log.error("Error cancelling OTP for patient {}, doctor {} and test type {}", patientId, doctorId, testType, e);
        }
    }
}
