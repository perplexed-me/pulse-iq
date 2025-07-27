package com.pulseiq.repository;

import com.pulseiq.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    
    List<Medicine> findByIsActiveTrue();
    
    @Query("SELECT m FROM Medicine m WHERE m.isActive = true AND LOWER(m.medicineName) LIKE LOWER(CONCAT(:name, '%'))")
    List<Medicine> findByMedicineNameStartingWithIgnoreCase(@Param("name") String name);
    
    @Query("SELECT m FROM Medicine m WHERE m.isActive = true AND LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Medicine> findByMedicineNameContainingIgnoreCase(@Param("name") String name);
    
    @Query("SELECT m FROM Medicine m WHERE m.isActive = true AND m.category = :category")
    List<Medicine> findByCategory(@Param("category") String category);
    
    @Query("SELECT DISTINCT m.category FROM Medicine m WHERE m.isActive = true ORDER BY m.category")
    List<String> findDistinctCategories();
    
    @Query("SELECT DISTINCT UPPER(SUBSTRING(m.medicineName, 1, 1)) FROM Medicine m WHERE m.isActive = true ORDER BY UPPER(SUBSTRING(m.medicineName, 1, 1))")
    List<String> findDistinctFirstLetters();
}
