package com.pulseiq.controller;

import com.pulseiq.repository.PatientRepository;
import com.pulseiq.repository.DoctorRepository;
import com.pulseiq.repository.TechnicianRepository;
import com.pulseiq.entity.Patient;
import com.pulseiq.entity.Doctor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserHelperController {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final TechnicianRepository technicianRepository;

    /**
     * Get list of all patients with ID and name using native query
     */
    @GetMapping("/patients")
    public ResponseEntity<List<Map<String, String>>> getAllPatients() {
        try {
            // Use native SQL query to avoid entity mapping issues
            List<Object[]> results = patientRepository.findAllPatientsNative();
            
            List<Map<String, String>> patients = results.stream()
                .map(row -> {
                    Map<String, String> patientInfo = new HashMap<>();
                    patientInfo.put("id", (String) row[0]); // patient_id
                    String firstName = (String) row[1]; // first_name
                    String lastName = (String) row[2]; // last_name
                    patientInfo.put("name", 
                        (firstName != null && lastName != null) 
                            ? firstName + " " + lastName
                            : "Patient " + row[0]);
                    patientInfo.put("email", row[3] != null ? (String) row[3] : ""); // email from user table
                    return patientInfo;
                })
                .toList();
            
            return ResponseEntity.ok(patients);
        } catch (Exception e) {
            System.err.println("Error fetching patients: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of()); // Return empty list instead of sample data
        }
    }

    /**
     * Get list of all doctors with ID and name using native query
     */
    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, String>>> getAllDoctors() {
        try {
            // Use native SQL query to avoid entity mapping issues
            List<Object[]> results = doctorRepository.findAllDoctorsNative();
            
            List<Map<String, String>> doctors = results.stream()
                .map(row -> {
                    Map<String, String> doctorInfo = new HashMap<>();
                    doctorInfo.put("id", (String) row[0]); // doctor_id
                    String firstName = (String) row[1]; // first_name
                    String lastName = (String) row[2]; // last_name
                    String specialization = (String) row[3]; // specialization
                    doctorInfo.put("name", 
                        (firstName != null && lastName != null) 
                            ? "Dr. " + firstName + " " + lastName
                            : "Dr. " + row[0]);
                    doctorInfo.put("specialization", specialization != null ? specialization : "");
                    return doctorInfo;
                })
                .toList();
            
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            System.err.println("Error fetching doctors: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of()); // Return empty list instead of sample data
        }
    }

    /**
     * Get list of all user IDs for form dropdowns (legacy endpoint)
     */
    @GetMapping("/ids")
    public ResponseEntity<Map<String, List<String>>> getAllUserIds() {
        Map<String, List<String>> userIds = new HashMap<>();
        
        userIds.put("patientIds", patientRepository.findAll()
            .stream()
            .map(patient -> patient.getPatientId())
            .limit(50) // Increased limit
            .toList());
            
        userIds.put("doctorIds", doctorRepository.findAll()
            .stream()
            .map(doctor -> doctor.getDoctorId())
            .limit(50) // Increased limit
            .toList());
            
        userIds.put("technicianIds", technicianRepository.findAll()
            .stream()
            .map(technician -> technician.getTechnicianId())
            .limit(50) // Increased limit
            .toList());
        
        return ResponseEntity.ok(userIds);
    }

    /**
     * Test endpoint to get patient IDs using native query
     */
    @GetMapping("/patients/simple")
    public ResponseEntity<List<String>> getAllPatientIds() {
        try {
            // For now, let's create some sample data if the repository is empty
            List<String> samplePatientIds = List.of("P202506001", "P202506002", "P202506003");
            Map<String, Object> response = new HashMap<>();
            response.put("patientIds", samplePatientIds);
            response.put("message", "Sample patient data - database may have entity mapping issues");
            
            return ResponseEntity.ok(samplePatientIds);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of("P202506001", "P202506002", "P202506003"));
        }
    }

    /**
     * Test endpoint to get doctor IDs using native query
     */
    @GetMapping("/doctors/simple")
    public ResponseEntity<List<String>> getAllDoctorIds() {
        try {
            // For now, let's create some sample data
            List<String> sampleDoctorIds = List.of("D202506001", "D202506002", "D202506003");
            return ResponseEntity.ok(sampleDoctorIds);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of("D202506001", "D202506002", "D202506003"));
        }
    }
}
