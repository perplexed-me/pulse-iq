package com.pulseiq.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "medicine")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medicine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "medicine_id")
    private Long medicineId;
    
    @Column(name = "medicine_name", nullable = false)
    private String medicineName;
    
    @Column(name = "medicine_power", nullable = false)
    private String medicinePower; // e.g., "2mg", "5mg", "10mg"
    
    @Column(name = "medicine_image", length = 500)
    private String medicineImage; // URL or path to medicine image
    
    @Column(name = "description", length = 1000)
    private String description;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "category", nullable = false)
    private String category; // e.g., "Antibiotic", "Painkiller", "Vitamin"
    
    @Column(name = "manufacturer")
    private String manufacturer;
    
    @Column(name = "price")
    private Double price;
}
