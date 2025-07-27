package com.pulseiq.dto;

import com.pulseiq.entity.PrescriptionMedicine;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionMedicineDto {
    private Long prescriptionMedicineId;
    private Long medicineId;
    private String medicineName;
    private String medicinePower;
    private String medicineImage;
    private Integer quantity;
    private Integer durationDays;
    private Boolean morningDose;
    private Boolean noonDose;
    private Boolean eveningDose;
    private PrescriptionMedicine.MealTiming mealTiming;
    private String specialInstructions;
}
