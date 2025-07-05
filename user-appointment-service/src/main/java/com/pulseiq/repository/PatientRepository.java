package com.pulseiq.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.pulseiq.entity.Patient;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {
    boolean existsByPatientId(String patientId);
    Optional<Patient> findByPatientId(String patientId);
    
    @Query(value = "SELECT p.patient_id, p.first_name, p.last_name, u.email " +
                   "FROM \"pulseiq\".patients p " +
                   "LEFT JOIN \"pulseiq\".users u ON p.patient_id = u.userid " +
                   "ORDER BY p.patient_id", nativeQuery = true)
    List<Object[]> findAllPatientsNative();
}