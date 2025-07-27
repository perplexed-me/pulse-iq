package com.pulseiq.controller;

import com.pulseiq.dto.MedicineDto;
import com.pulseiq.service.MedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
// @CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class MedicineController {
    
    private final MedicineService medicineService;
    
    @GetMapping
    public ResponseEntity<List<MedicineDto>> getAllMedicines() {
        List<MedicineDto> medicines = medicineService.getAllActiveMedicines();
        return ResponseEntity.ok(medicines);
    }
    
    @GetMapping("/{medicineId}")
    public ResponseEntity<MedicineDto> getMedicineById(@PathVariable Long medicineId) {
        Optional<MedicineDto> medicine = medicineService.getMedicineById(medicineId);
        return medicine.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<MedicineDto>> searchMedicines(@RequestParam String name) {
        List<MedicineDto> medicines = medicineService.searchMedicinesByName(name);
        return ResponseEntity.ok(medicines);
    }
    
    @GetMapping("/filter/letter/{letter}")
    public ResponseEntity<List<MedicineDto>> getMedicinesByFirstLetter(@PathVariable String letter) {
        List<MedicineDto> medicines = medicineService.getMedicinesByFirstLetter(letter);
        return ResponseEntity.ok(medicines);
    }
    
    @GetMapping("/filter/category/{category}")
    public ResponseEntity<List<MedicineDto>> getMedicinesByCategory(@PathVariable String category) {
        List<MedicineDto> medicines = medicineService.getMedicinesByCategory(category);
        return ResponseEntity.ok(medicines);
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        List<String> categories = medicineService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/letters")
    public ResponseEntity<List<String>> getAllFirstLetters() {
        List<String> letters = medicineService.getAllFirstLetters();
        return ResponseEntity.ok(letters);
    }
    
    @PostMapping
    public ResponseEntity<MedicineDto> createMedicine(@RequestBody MedicineDto medicineDto) {
        MedicineDto createdMedicine = medicineService.createMedicine(medicineDto);
        return ResponseEntity.ok(createdMedicine);
    }
    
    @PutMapping("/{medicineId}")
    public ResponseEntity<MedicineDto> updateMedicine(@PathVariable Long medicineId, @RequestBody MedicineDto medicineDto) {
        try {
            MedicineDto updatedMedicine = medicineService.updateMedicine(medicineId, medicineDto);
            return ResponseEntity.ok(updatedMedicine);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{medicineId}")
    public ResponseEntity<Void> deleteMedicine(@PathVariable Long medicineId) {
        try {
            medicineService.deleteMedicine(medicineId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
