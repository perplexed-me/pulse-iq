package com.pulseiq.controller;

import com.pulseiq.dto.CreatePrescriptionDto;
import com.pulseiq.dto.PrescriptionDto;
import com.pulseiq.service.PrescriptionService;
import com.pulseiq.service.PrescriptionPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
// @CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class PrescriptionController {
    
    private final PrescriptionService prescriptionService;
    private final PrescriptionPdfService pdfService;
    
    @PostMapping
    public ResponseEntity<PrescriptionDto> createPrescription(
            @RequestBody CreatePrescriptionDto createDto,
            Authentication authentication) {
        try {
            String doctorId = authentication.getName();
            
            // Debug: Log the received DTO
            System.out.println("Received CreatePrescriptionDto: " + createDto);
            System.out.println("Patient ID: " + createDto.getPatientId());
            System.out.println("Appointment ID: " + createDto.getAppointmentId());
            System.out.println("Doctor Notes: " + createDto.getDoctorNotes());
            System.out.println("Medicines count: " + (createDto.getMedicines() != null ? createDto.getMedicines().size() : "null"));
            
            if (createDto.getMedicines() != null) {
                for (int i = 0; i < createDto.getMedicines().size(); i++) {
                    var medicine = createDto.getMedicines().get(i);
                    System.out.println("Medicine " + i + ": " + medicine);
                    System.out.println("Medicine " + i + " ID: " + medicine.getMedicineId());
                }
            }
            
            PrescriptionDto prescription = prescriptionService.createPrescription(doctorId, createDto);
            return ResponseEntity.ok(prescription);
        } catch (Exception e) {
            System.err.println("Error creating prescription: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{prescriptionId}")
    public ResponseEntity<PrescriptionDto> getPrescriptionById(@PathVariable Long prescriptionId) {
        Optional<PrescriptionDto> prescription = prescriptionService.getPrescriptionById(prescriptionId);
        return prescription.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PrescriptionDto>> getPrescriptionsByPatient(@PathVariable String patientId) {
        List<PrescriptionDto> prescriptions = prescriptionService.getPrescriptionsByPatient(patientId);
        return ResponseEntity.ok(prescriptions);
    }
    
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<PrescriptionDto>> getPrescriptionsByDoctor(@PathVariable String doctorId) {
        List<PrescriptionDto> prescriptions = prescriptionService.getPrescriptionsByDoctor(doctorId);
        return ResponseEntity.ok(prescriptions);
    }
    
    @GetMapping("/my-prescriptions")
    public ResponseEntity<List<PrescriptionDto>> getMyPrescriptions(Authentication authentication) {
        String userId = authentication.getName();
        List<PrescriptionDto> prescriptions = prescriptionService.getPrescriptionsByPatient(userId);
        return ResponseEntity.ok(prescriptions);
    }
    
    @GetMapping("/my-created-prescriptions")
    public ResponseEntity<List<PrescriptionDto>> getMyCreatedPrescriptions(Authentication authentication) {
        String doctorId = authentication.getName();
        List<PrescriptionDto> prescriptions = prescriptionService.getPrescriptionsByDoctor(doctorId);
        return ResponseEntity.ok(prescriptions);
    }
    
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<PrescriptionDto> getPrescriptionByAppointmentId(@PathVariable Long appointmentId) {
        Optional<PrescriptionDto> prescription = prescriptionService.getPrescriptionByAppointmentId(appointmentId);
        return prescription.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{prescriptionId}/pdf")
    public ResponseEntity<byte[]> downloadPrescriptionPdf(@PathVariable Long prescriptionId) {
        try {
            Optional<PrescriptionDto> prescriptionOpt = prescriptionService.getPrescriptionById(prescriptionId);
            if (prescriptionOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            PrescriptionDto prescription = prescriptionOpt.get();
            int sequenceNumber = prescriptionService.getPrescriptionSequenceNumber(prescription.getPatientId(), prescriptionId);
            
            byte[] pdfBytes = pdfService.generatePrescriptionPdf(prescription, sequenceNumber);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "prescription_" + sequenceNumber + ".pdf");
            headers.setContentLength(pdfBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{prescriptionId}")
    public ResponseEntity<Void> deletePrescription(@PathVariable Long prescriptionId) {
        try {
            prescriptionService.deletePrescription(prescriptionId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
