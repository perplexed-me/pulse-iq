package com.pulseiq.service;

import com.pulseiq.dto.MedicineDto;
import com.pulseiq.entity.Medicine;
import com.pulseiq.repository.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicineService {
    
    private final MedicineRepository medicineRepository;
    
    public List<MedicineDto> getAllActiveMedicines() {
        return medicineRepository.findByIsActiveTrue()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<MedicineDto> searchMedicinesByName(String name) {
        return medicineRepository.findByMedicineNameContainingIgnoreCase(name)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<MedicineDto> getMedicinesByFirstLetter(String letter) {
        return medicineRepository.findByMedicineNameStartingWithIgnoreCase(letter)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<MedicineDto> getMedicinesByCategory(String category) {
        return medicineRepository.findByCategory(category)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<String> getAllCategories() {
        return medicineRepository.findDistinctCategories();
    }
    
    public List<String> getAllFirstLetters() {
        return medicineRepository.findDistinctFirstLetters();
    }
    
    public Optional<MedicineDto> getMedicineById(Long medicineId) {
        return medicineRepository.findById(medicineId)
                .map(this::convertToDto);
    }
    
    @Transactional
    public MedicineDto createMedicine(MedicineDto medicineDto) {
        Medicine medicine = convertToEntity(medicineDto);
        medicine.setIsActive(true);
        Medicine savedMedicine = medicineRepository.save(medicine);
        return convertToDto(savedMedicine);
    }
    
    @Transactional
    public MedicineDto updateMedicine(Long medicineId, MedicineDto medicineDto) {
        Medicine existingMedicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        
        existingMedicine.setMedicineName(medicineDto.getMedicineName());
        existingMedicine.setMedicinePower(medicineDto.getMedicinePower());
        existingMedicine.setMedicineImage(medicineDto.getMedicineImage());
        existingMedicine.setDescription(medicineDto.getDescription());
        existingMedicine.setCategory(medicineDto.getCategory());
        existingMedicine.setManufacturer(medicineDto.getManufacturer());
        existingMedicine.setPrice(medicineDto.getPrice());
        
        Medicine updatedMedicine = medicineRepository.save(existingMedicine);
        return convertToDto(updatedMedicine);
    }
    
    @Transactional
    public void deleteMedicine(Long medicineId) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        medicine.setIsActive(false);
        medicineRepository.save(medicine);
    }
    
    private MedicineDto convertToDto(Medicine medicine) {
        MedicineDto dto = new MedicineDto();
        dto.setMedicineId(medicine.getMedicineId());
        dto.setMedicineName(medicine.getMedicineName());
        dto.setMedicinePower(medicine.getMedicinePower());
        dto.setMedicineImage(medicine.getMedicineImage());
        dto.setDescription(medicine.getDescription());
        dto.setIsActive(medicine.getIsActive());
        dto.setCategory(medicine.getCategory());
        dto.setManufacturer(medicine.getManufacturer());
        dto.setPrice(medicine.getPrice());
        return dto;
    }
    
    private Medicine convertToEntity(MedicineDto dto) {
        Medicine medicine = new Medicine();
        medicine.setMedicineId(dto.getMedicineId());
        medicine.setMedicineName(dto.getMedicineName());
        medicine.setMedicinePower(dto.getMedicinePower());
        medicine.setMedicineImage(dto.getMedicineImage());
        medicine.setDescription(dto.getDescription());
        medicine.setIsActive(dto.getIsActive());
        medicine.setCategory(dto.getCategory());
        medicine.setManufacturer(dto.getManufacturer());
        medicine.setPrice(dto.getPrice());
        return medicine;
    }
}
