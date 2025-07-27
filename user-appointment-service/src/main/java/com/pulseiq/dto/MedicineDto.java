package com.pulseiq.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicineDto {
    private Long medicineId;
    private String medicineName;
    private String medicinePower;
    private String medicineImage;
    private String description;
    private Boolean isActive;
    private String category;
    private String manufacturer;
    private Double price;
}
