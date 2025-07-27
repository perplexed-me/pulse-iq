package com.pulseiq.dto;

import com.pulseiq.entity.PrescriptionMedicine;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDto {
    private Long prescriptionId;
    private String doctorId;
    private String patientId;
    private Long appointmentId;
    private String doctorNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isActive;
    private List<PrescriptionMedicineDto> prescriptionMedicines;
    
    // Additional fields for display
    private String doctorName;
    private String doctorLicenseNumber;
    private String patientName;
}
