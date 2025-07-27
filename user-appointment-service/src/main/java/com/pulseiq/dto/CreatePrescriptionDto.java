package com.pulseiq.dto;

import com.pulseiq.entity.PrescriptionMedicine;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePrescriptionDto {
    private String patientId;
    private Long appointmentId;
    private String doctorNotes;
    private List<CreatePrescriptionMedicineDto> medicines;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePrescriptionMedicineDto {
        private Long medicineId;
        private Integer quantity;
        private Integer durationDays;
        private Boolean morningDose;
        private Boolean noonDose;
        private Boolean eveningDose;
        private PrescriptionMedicine.MealTiming mealTiming;
        private String specialInstructions;
    }
}
