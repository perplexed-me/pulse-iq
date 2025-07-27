package com.pulseiq.service;

import com.pulseiq.dto.*;
import com.pulseiq.entity.*;
import com.pulseiq.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionService {
    
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionMedicineRepository prescriptionMedicineRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final NotificationService notificationService;
    
    @Transactional
    public PrescriptionDto createPrescription(String doctorId, CreatePrescriptionDto createDto) {
        // Create prescription
        Prescription prescription = new Prescription();
        prescription.setDoctorId(doctorId);
        prescription.setPatientId(createDto.getPatientId());
        prescription.setAppointmentId(createDto.getAppointmentId());
        prescription.setDoctorNotes(createDto.getDoctorNotes());
        prescription.setCreatedAt(LocalDateTime.now());
        prescription.setUpdatedAt(LocalDateTime.now());
        prescription.setIsActive(true);
        
        Prescription savedPrescription = prescriptionRepository.save(prescription);
        
        // Create prescription medicines - handle gracefully if medicines list is empty or has issues
        List<PrescriptionMedicine> prescriptionMedicines = new ArrayList<>();
        
        if (createDto.getMedicines() != null && !createDto.getMedicines().isEmpty()) {
            System.out.println("Processing " + createDto.getMedicines().size() + " medicines for prescription");
            prescriptionMedicines = createDto.getMedicines().stream()
                    .filter(medicineDto -> {
                        // Skip medicines with null or invalid IDs
                        if (medicineDto.getMedicineId() == null) {
                            System.out.println("Skipping medicine with null ID");
                            return false;
                        }
                        return true;
                    })
                    .map(medicineDto -> {
                        System.out.println("Processing medicine DTO: " + medicineDto);
                        System.out.println("Medicine ID: " + medicineDto.getMedicineId());
                        
                        // Try to find the medicine, skip if not found for now
                        Medicine medicine = medicineRepository.findById(medicineDto.getMedicineId())
                                .orElse(null);
                        
                        if (medicine == null) {
                            System.out.println("Medicine not found with ID: " + medicineDto.getMedicineId() + ", skipping for now");
                            return null; // Skip this medicine
                        }
                        
                        PrescriptionMedicine prescriptionMedicine = new PrescriptionMedicine();
                        prescriptionMedicine.setPrescription(savedPrescription);
                        prescriptionMedicine.setMedicine(medicine);
                        prescriptionMedicine.setQuantity(medicineDto.getQuantity());
                        prescriptionMedicine.setDurationDays(medicineDto.getDurationDays());
                        prescriptionMedicine.setMorningDose(medicineDto.getMorningDose());
                        prescriptionMedicine.setNoonDose(medicineDto.getNoonDose());
                        prescriptionMedicine.setEveningDose(medicineDto.getEveningDose());
                        prescriptionMedicine.setMealTiming(medicineDto.getMealTiming());
                        prescriptionMedicine.setSpecialInstructions(medicineDto.getSpecialInstructions());
                        
                        return prescriptionMedicine;
                    })
                    .filter(pm -> pm != null) // Remove null entries
                    .collect(Collectors.toList());
        } else {
            System.out.println("No medicines provided for prescription - creating prescription with notes only");
        }
        
        List<PrescriptionMedicine> savedPrescriptionMedicines = new ArrayList<>();
        if (!prescriptionMedicines.isEmpty()) {
            savedPrescriptionMedicines = prescriptionMedicineRepository.saveAll(prescriptionMedicines);
        }
        savedPrescription.setPrescriptionMedicines(savedPrescriptionMedicines);
        
        // Create notification for patient
        createPrescriptionNotification(savedPrescription);
        
        return convertToDto(savedPrescription);
    }
    
    private void createPrescriptionNotification(Prescription prescription) {
        try {
            // Get doctor name
            String doctorName = "Doctor";
            if (prescription.getDoctorId().startsWith("D")) {
                Doctor doctor = doctorRepository.findByDoctorId(prescription.getDoctorId()).orElse(null);
                if (doctor != null) {
                    doctorName = "Dr. " + doctor.getFirstName() + " " + doctor.getLastName();
                }
            }
            
            // Create notification
            notificationService.createNotification(
                prescription.getPatientId(),
                "PATIENT",
                "New Prescription Available",
                doctorName + " has uploaded a new prescription for you.",
                Notification.NotificationType.GENERAL,
                prescription.getPrescriptionId().toString(),
                "PRESCRIPTION",
                prescription.getDoctorId()
            );
        } catch (Exception e) {
            System.err.println("Error creating prescription notification: " + e.getMessage());
        }
    }
    
    public List<PrescriptionDto> getPrescriptionsByPatient(String patientId) {
        return prescriptionRepository.findByPatientIdAndIsActiveTrue(patientId)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Sort by creation date descending (latest first)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<PrescriptionDto> getPrescriptionsByDoctor(String doctorId) {
        return prescriptionRepository.findByDoctorIdAndIsActiveTrue(doctorId)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Sort by creation date descending (latest first)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public Optional<PrescriptionDto> getPrescriptionById(Long prescriptionId) {
        return prescriptionRepository.findById(prescriptionId)
                .map(this::convertToDto);
    }
    
    public Optional<PrescriptionDto> getPrescriptionByAppointmentId(Long appointmentId) {
        return prescriptionRepository.findByAppointmentIdAndIsActiveTrue(appointmentId)
                .map(this::convertToDto);
    }
    
    @Transactional
    public void deletePrescription(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        prescription.setIsActive(false);
        prescriptionRepository.save(prescription);
    }
    
    public int getPrescriptionSequenceNumber(String patientId, Long prescriptionId) {
        List<Prescription> patientPrescriptions = prescriptionRepository.findByPatientIdAndIsActiveTrue(patientId)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Sort by creation date descending (latest first)
                .collect(Collectors.toList());
        
        for (int i = 0; i < patientPrescriptions.size(); i++) {
            if (patientPrescriptions.get(i).getPrescriptionId().equals(prescriptionId)) {
                return i + 1; // Return 1-based sequence number
            }
        }
        
        return 1; // Default to 1 if not found
    }
    
    private PrescriptionDto convertToDto(Prescription prescription) {
        PrescriptionDto dto = new PrescriptionDto();
        dto.setPrescriptionId(prescription.getPrescriptionId());
        dto.setDoctorId(prescription.getDoctorId());
        dto.setPatientId(prescription.getPatientId());
        dto.setAppointmentId(prescription.getAppointmentId());
        dto.setDoctorNotes(prescription.getDoctorNotes());
        dto.setCreatedAt(prescription.getCreatedAt());
        dto.setUpdatedAt(prescription.getUpdatedAt());
        dto.setIsActive(prescription.getIsActive());
        
        // Get doctor and patient names
        try {
            // Doctor and patient IDs are strings like "D202507001", "P202507001"
            // We need to look them up in the appropriate repository
            if (prescription.getDoctorId().startsWith("D")) {
                Doctor doctor = doctorRepository.findByDoctorId(prescription.getDoctorId()).orElse(null);
                if (doctor != null) {
                    dto.setDoctorName(doctor.getFirstName() + " " + doctor.getLastName());
                    dto.setDoctorLicenseNumber(doctor.getLicenseNumber());
                }
            }
            
            if (prescription.getPatientId().startsWith("P")) {
                Patient patient = patientRepository.findByPatientId(prescription.getPatientId()).orElse(null);
                if (patient != null) {
                    dto.setPatientName(patient.getFirstName() + " " + patient.getLastName());
                }
            }
        } catch (Exception e) {
            System.err.println("Error getting user names: " + e.getMessage());
        }
        
        // Convert prescription medicines
        if (prescription.getPrescriptionMedicines() != null) {
            dto.setPrescriptionMedicines(prescription.getPrescriptionMedicines().stream()
                    .map(this::convertPrescriptionMedicineToDto)
                    .collect(Collectors.toList()));
        }
        
        return dto;
    }
    
    private PrescriptionMedicineDto convertPrescriptionMedicineToDto(PrescriptionMedicine prescriptionMedicine) {
        PrescriptionMedicineDto dto = new PrescriptionMedicineDto();
        dto.setPrescriptionMedicineId(prescriptionMedicine.getPrescriptionMedicineId());
        dto.setMedicineId(prescriptionMedicine.getMedicine().getMedicineId());
        dto.setMedicineName(prescriptionMedicine.getMedicine().getMedicineName());
        dto.setMedicinePower(prescriptionMedicine.getMedicine().getMedicinePower());
        dto.setMedicineImage(prescriptionMedicine.getMedicine().getMedicineImage());
        dto.setQuantity(prescriptionMedicine.getQuantity());
        dto.setDurationDays(prescriptionMedicine.getDurationDays());
        dto.setMorningDose(prescriptionMedicine.getMorningDose());
        dto.setNoonDose(prescriptionMedicine.getNoonDose());
        dto.setEveningDose(prescriptionMedicine.getEveningDose());
        dto.setMealTiming(prescriptionMedicine.getMealTiming());
        dto.setSpecialInstructions(prescriptionMedicine.getSpecialInstructions());
        return dto;
    }
}
