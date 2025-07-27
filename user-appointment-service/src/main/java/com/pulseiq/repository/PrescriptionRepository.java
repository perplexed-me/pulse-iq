package com.pulseiq.repository;

import com.pulseiq.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    
    List<Prescription> findByPatientIdAndIsActiveTrue(String patientId);
    
    List<Prescription> findByDoctorIdAndIsActiveTrue(String doctorId);
    
    Optional<Prescription> findByAppointmentIdAndIsActiveTrue(Long appointmentId);
    
    @Query("SELECT p FROM Prescription p WHERE p.doctorId = :doctorId AND p.patientId = :patientId AND p.isActive = true ORDER BY p.createdAt DESC")
    List<Prescription> findByDoctorIdAndPatientIdAndIsActiveTrue(@Param("doctorId") String doctorId, @Param("patientId") String patientId);
    
    @Query("SELECT p FROM Prescription p WHERE p.isActive = true ORDER BY p.createdAt DESC")
    List<Prescription> findAllActiveOrderByCreatedAtDesc();
}
