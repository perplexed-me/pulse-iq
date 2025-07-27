package com.pulseiq.controller;

import com.pulseiq.entity.Doctor;
import com.pulseiq.entity.User;
import com.pulseiq.repository.DoctorRepository;
import com.pulseiq.repository.UserRepository;
import com.pulseiq.repository.AppointmentRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {
    private static final Logger logger = LoggerFactory.getLogger(DoctorController.class);
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    private static final long MAX_SIZE = 2_621_440; // 2.5MB

    @PostMapping("/{doctorId}/profile-picture")
    @Transactional
    public ResponseEntity<?> uploadProfilePicture(@PathVariable String doctorId, @RequestParam("file") MultipartFile file) {
        try {
            logger.info("Attempting to upload profile picture for doctor: {}, file size: {}", doctorId, file.getSize());
            
            Optional<Doctor> doctorOpt = doctorRepository.findByDoctorId(doctorId);
            if (doctorOpt.isEmpty()) {
                logger.error("Doctor not found with ID: {}", doctorId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Doctor not found with ID: " + doctorId);
            }
            
            if (file.isEmpty()) {
                logger.error("File is empty for doctor: {}", doctorId);
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            if (file.getSize() > MAX_SIZE) {
                logger.error("File size {} exceeds limit for doctor: {}", file.getSize(), doctorId);
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body("File size exceeds 2.5MB limit");
            }
            
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                logger.error("Invalid content type {} for doctor: {}", contentType, doctorId);
                return ResponseEntity.badRequest()
                    .body("Only image files are allowed. Received content type: " + contentType);
            }
            
            Doctor doctor = doctorOpt.get();
            try {
                byte[] imageData = file.getBytes();
                logger.info("Successfully read {} bytes from uploaded file for doctor: {}", imageData.length, doctorId);
                
                doctor.setProfilePicture(imageData);
                doctor.setProfilePictureType(contentType);
                Doctor savedDoctor = doctorRepository.save(doctor);
                
                if (savedDoctor.getProfilePicture() == null) {
                    logger.error("Profile picture was not saved properly for doctor: {}", doctorId);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to save profile picture");
                }
                
                logger.info("Successfully saved profile picture for doctor: {}", doctorId);
                return ResponseEntity.ok()
                    .body("Profile picture uploaded successfully");
            } catch (IOException e) {
                logger.error("Error reading file data for doctor: " + doctorId, e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error reading file data: " + e.getMessage());
            }
            
        } catch (Exception e) {
            logger.error("Unexpected error during file upload for doctor: " + doctorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Unexpected error during file upload: " + e.getMessage());
        }
    }

    @GetMapping("/{doctorId}/profile-picture")
    public ResponseEntity<?> getProfilePicture(@PathVariable String doctorId) {
        try {
            logger.info("Fetching profile picture for doctor: {}", doctorId);
            
            Optional<Doctor> doctorOpt = doctorRepository.findByDoctorId(doctorId);
            if (doctorOpt.isEmpty()) {
                logger.info("Doctor not found with ID: {}", doctorId);
                return ResponseEntity.notFound().build();
            }
            
            Doctor doctor = doctorOpt.get();
            if (doctor.getProfilePicture() == null || doctor.getProfilePictureType() == null) {
                logger.info("No profile picture found for doctor: {}", doctorId);
                return ResponseEntity.notFound().build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(doctor.getProfilePictureType()));
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(doctor.getProfilePicture());
                
        } catch (Exception e) {
            logger.error("Error fetching profile picture for doctor: " + doctorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching profile picture: " + e.getMessage());
        }
    }

    @DeleteMapping("/{doctorId}/profile-picture")
    @Transactional
    public ResponseEntity<?> deleteProfilePicture(@PathVariable String doctorId) {
        try {
            logger.info("Attempting to delete profile picture for doctor: {}", doctorId);
            
            Optional<Doctor> doctorOpt = doctorRepository.findByDoctorId(doctorId);
            if (doctorOpt.isEmpty()) {
                logger.error("Doctor not found with ID: {}", doctorId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Doctor not found with ID: " + doctorId);
            }
            
            Doctor doctor = doctorOpt.get();
            doctor.setProfilePicture(null);
            doctor.setProfilePictureType(null);
            doctorRepository.save(doctor);
            
            logger.info("Successfully deleted profile picture for doctor: {}", doctorId);
            return ResponseEntity.ok("Profile picture deleted successfully");
            
        } catch (Exception e) {
            logger.error("Error deleting profile picture for doctor: " + doctorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting profile picture: " + e.getMessage());
        }
    }

    @PutMapping("/{doctorId}/profile-picture")
    @Transactional
    public ResponseEntity<?> replaceProfilePicture(@PathVariable String doctorId, @RequestParam("file") MultipartFile file) {
        return uploadProfilePicture(doctorId, file);
    }

    @GetMapping("/{doctorId}/profile")
    public ResponseEntity<?> getDoctorProfile(@PathVariable String doctorId) {
        try {
            logger.info("Fetching profile for doctor: {}", doctorId);
            
            Optional<Doctor> doctorOpt = doctorRepository.findByDoctorId(doctorId);
            if (doctorOpt.isEmpty()) {
                logger.error("Doctor not found with ID: {}", doctorId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Doctor not found with ID: " + doctorId);
            }
            
            Doctor doctor = doctorOpt.get();
            
            // Create a response DTO with combined doctor and user information
            java.util.Map<String, Object> profileData = new java.util.HashMap<>();
            profileData.put("doctorId", doctor.getDoctorId());
            profileData.put("firstName", doctor.getFirstName());
            profileData.put("lastName", doctor.getLastName());
            profileData.put("degree", doctor.getDegree());
            profileData.put("specialization", doctor.getSpecialization());
            profileData.put("licenseNumber", doctor.getLicenseNumber());
            profileData.put("consultationFee", doctor.getConsultationFee());
            
            // Add availability information
            profileData.put("availableDays", doctor.getAvailableDays());
            profileData.put("availableTimeStart", doctor.getAvailableTimeStart());
            profileData.put("availableTimeEnd", doctor.getAvailableTimeEnd());
            
            // Fetch real email and phone from User table
            Optional<User> userOpt = userRepository.findByUserId(doctorId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                profileData.put("email", user.getEmail());
                profileData.put("phone", user.getPhone());
            } else {
                // Fallback if user not found
                logger.warn("User not found for doctorId: " + doctorId);
                profileData.put("email", "doctor" + doctorId + "@pulseiq.com");
                profileData.put("phone", "01700000000");
            }
            
            return ResponseEntity.ok(profileData);
            
        } catch (Exception e) {
            logger.error("Error fetching profile for doctor: " + doctorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching profile: " + e.getMessage());
        }
    }

    @PutMapping("/{doctorId}/profile")
    @Transactional
    public ResponseEntity<?> updateDoctorProfile(@PathVariable String doctorId, @RequestBody java.util.Map<String, Object> profileData) {
        try {
            logger.info("Updating profile for doctor: {}", doctorId);
            
            Optional<Doctor> doctorOpt = doctorRepository.findByDoctorId(doctorId);
            if (doctorOpt.isEmpty()) {
                logger.error("Doctor not found with ID: {}", doctorId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Doctor not found with ID: " + doctorId);
            }
            
            Doctor doctor = doctorOpt.get();
            
            // Update doctor fields
            if (profileData.containsKey("firstName")) {
                doctor.setFirstName((String) profileData.get("firstName"));
            }
            if (profileData.containsKey("lastName")) {
                doctor.setLastName((String) profileData.get("lastName"));
            }
            if (profileData.containsKey("degree")) {
                doctor.setDegree((String) profileData.get("degree"));
            }
            if (profileData.containsKey("specialization")) {
                doctor.setSpecialization((String) profileData.get("specialization"));
            }
            if (profileData.containsKey("licenseNumber")) {
                doctor.setLicenseNumber((String) profileData.get("licenseNumber"));
            }
            if (profileData.containsKey("consultationFee")) {
                Object feeObj = profileData.get("consultationFee");
                if (feeObj instanceof Number) {
                    doctor.setConsultationFee(new java.math.BigDecimal(feeObj.toString()));
                }
            }
            
            // Update availability fields
            if (profileData.containsKey("availableDays")) {
                doctor.setAvailableDays((String) profileData.get("availableDays"));
            }
            if (profileData.containsKey("availableTimeStart")) {
                doctor.setAvailableTimeStart((String) profileData.get("availableTimeStart"));
            }
            if (profileData.containsKey("availableTimeEnd")) {
                doctor.setAvailableTimeEnd((String) profileData.get("availableTimeEnd"));
            }
            if (profileData.containsKey("isAvailable")) {
                doctor.setAvailable((Boolean) profileData.get("isAvailable"));
            }
            
            doctorRepository.save(doctor);
            
            // Return updated profile data
            java.util.Map<String, Object> updatedProfile = new java.util.HashMap<>();
            updatedProfile.put("doctorId", doctor.getDoctorId());
            updatedProfile.put("firstName", doctor.getFirstName());
            updatedProfile.put("lastName", doctor.getLastName());
            updatedProfile.put("degree", doctor.getDegree());
            updatedProfile.put("specialization", doctor.getSpecialization());
            updatedProfile.put("licenseNumber", doctor.getLicenseNumber());
            updatedProfile.put("consultationFee", doctor.getConsultationFee());
            updatedProfile.put("availableDays", doctor.getAvailableDays());
            updatedProfile.put("availableTimeStart", doctor.getAvailableTimeStart());
            updatedProfile.put("availableTimeEnd", doctor.getAvailableTimeEnd());
            updatedProfile.put("isAvailable", doctor.getAvailable());
            updatedProfile.put("email", profileData.get("email"));
            updatedProfile.put("phone", profileData.get("phone"));
            
            logger.info("Successfully updated profile for doctor: {}", doctorId);
            return ResponseEntity.ok(updatedProfile);
            
        } catch (Exception e) {
            logger.error("Error updating profile for doctor: " + doctorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating profile: " + e.getMessage());
        }
    }

    /**
     * Get patients with completed appointments for a doctor
     */
    @GetMapping("/{doctorId}/completed-patients")
    public ResponseEntity<?> getCompletedPatients(@PathVariable String doctorId) {
        try {
            // This should delegate to a service layer
            // For now, implementing directly until service is created
            List<Object[]> results = appointmentRepository.findCompletedPatientsByDoctorId(doctorId);
            
            List<Map<String, Object>> patients = results.stream()
                .map(row -> {
                    Map<String, Object> patient = new HashMap<>();
                    patient.put("patientId", row[0]);
                    patient.put("patientName", row[1]);
                    patient.put("lastAppointmentDate", row[2]);
                    patient.put("completedAppointments", row[3]);
                    return patient;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(patients);
        } catch (Exception e) {
            logger.error("Error fetching completed patients for doctor: " + doctorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching completed patients: " + e.getMessage());
        }
    }

    /**
     * Get appointment statistics for a doctor
     */
    @GetMapping("/{doctorId}/appointment-stats")
    public ResponseEntity<?> getAppointmentStats(@PathVariable String doctorId) {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // Today's appointments count
            long todayCount = appointmentRepository.countTodayAppointmentsByDoctorId(doctorId);
            stats.put("todayAppointments", todayCount);
            
            // Future appointments count (including today)
            long futureCount = appointmentRepository.countFutureAppointmentsByDoctorId(doctorId);
            stats.put("totalFuturePatients", futureCount);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error fetching appointment stats for doctor: " + doctorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching appointment stats: " + e.getMessage());
        }
    }

    /**
     * Get doctor availability for appointment booking
     */
    @GetMapping("/{doctorId}/availability")
    public ResponseEntity<?> getDoctorAvailability(@PathVariable String doctorId) {
        try {
            logger.info("Fetching availability for doctor: {}", doctorId);
            
            Optional<Doctor> doctorOpt = doctorRepository.findByDoctorId(doctorId);
            if (doctorOpt.isEmpty()) {
                logger.error("Doctor not found with ID: {}", doctorId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Doctor not found with ID: " + doctorId);
            }
            
            Doctor doctor = doctorOpt.get();
            
            Map<String, Object> availability = new HashMap<>();
            availability.put("doctorId", doctor.getDoctorId());
            availability.put("isAvailable", doctor.getAvailable());
            availability.put("availableDays", doctor.getAvailableDays());
            availability.put("availableTimeStart", doctor.getAvailableTimeStart());
            availability.put("availableTimeEnd", doctor.getAvailableTimeEnd());
            
            logger.info("Successfully fetched availability for doctor: {}", doctorId);
            return ResponseEntity.ok(availability);
            
        } catch (Exception e) {
            logger.error("Error fetching availability for doctor: " + doctorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching availability: " + e.getMessage());
        }
    }
}
