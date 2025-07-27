package com.pulseiq.repository;

import com.pulseiq.entity.PrescriptionMedicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionMedicineRepository extends JpaRepository<PrescriptionMedicine, Long> {
    
    List<PrescriptionMedicine> findByPrescriptionPrescriptionId(Long prescriptionId);
    
    @Query("SELECT pm FROM PrescriptionMedicine pm WHERE pm.prescription.prescriptionId = :prescriptionId")
    List<PrescriptionMedicine> findByPrescriptionId(@Param("prescriptionId") Long prescriptionId);
}
