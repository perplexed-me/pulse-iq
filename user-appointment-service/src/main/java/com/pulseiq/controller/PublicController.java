package com.pulseiq.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulseiq.entity.Doctor;
import com.pulseiq.repository.DoctorRepository;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PublicController {

    @Autowired
    private DoctorRepository doctorRepository;

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorPublicInfo>> getPublicDoctors() {
        try {
            // Get all available doctors
            List<Doctor> doctors = doctorRepository.findAllAvailableDoctorsOrderedByName();

            // Convert to public info (without sensitive data)
            List<DoctorPublicInfo> publicDoctors = doctors.stream()
                    .map(this::convertToPublicInfo)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(publicDoctors);
        } catch (Exception e) {
            System.err.println("Error fetching public doctors: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private DoctorPublicInfo convertToPublicInfo(Doctor doctor) {
        DoctorPublicInfo info = new DoctorPublicInfo();
        info.setDoctorId(doctor.getDoctorId());
        info.setFirstName(doctor.getFirstName());
        info.setLastName(doctor.getLastName());
        info.setDegree(doctor.getDegree());
        info.setSpecialization(doctor.getSpecialization());
        info.setLicenseNumber(doctor.getLicenseNumber());
        info.setConsultationFee(doctor.getConsultationFee() != null ? doctor.getConsultationFee().doubleValue() : 0.0);
        info.setStatus("Available"); // Default status for available doctors
        info.setIsAvailable(doctor.getIsAvailable());
        info.setApproved(true); // If they're in the doctors table, they're approved
        return info;
    }

    // DTO class for public doctor information
    public static class DoctorPublicInfo {
        private String doctorId;
        private String firstName;
        private String lastName;
        private String degree;
        private String specialization;
        private String licenseNumber;
        private Double consultationFee;
        private String status;
        private Boolean isAvailable;
        private Boolean approved;

        // Getters and setters
        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getDegree() { return degree; }
        public void setDegree(String degree) { this.degree = degree; }

        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }

        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

        public Double getConsultationFee() { return consultationFee; }
        public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Boolean getIsAvailable() { return isAvailable; }
        public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

        public Boolean getApproved() { return approved; }
        public void setApproved(Boolean approved) { this.approved = approved; }
    }
}
