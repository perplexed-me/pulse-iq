package com.pulseiq.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "prescription_medicine", schema = "pulseiq")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionMedicine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prescription_medicine_id")
    private Long prescriptionMedicineId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false, referencedColumnName = "prescription_id")
    private Prescription prescription;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false, referencedColumnName = "medicine_id")
    private Medicine medicine;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity; // Number of tablets/doses
    
    @Column(name = "duration_days", nullable = false)
    private Integer durationDays; // For how many days
    
    @Column(name = "morning_dose", nullable = false)
    private Boolean morningDose = false;
    
    @Column(name = "noon_dose", nullable = false)
    private Boolean noonDose = false;
    
    @Column(name = "evening_dose", nullable = false)
    private Boolean eveningDose = false;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "meal_timing", nullable = false)
    private MealTiming mealTiming;
    
    @Column(name = "special_instructions", length = 500)
    private String specialInstructions;
    
    public enum MealTiming {
        BEFORE_MEAL,
        AFTER_MEAL,
        WITH_MEAL,
        EMPTY_STOMACH
    }
}
