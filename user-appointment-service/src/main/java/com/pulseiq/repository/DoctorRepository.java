package com.pulseiq.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.pulseiq.entity.Doctor;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, String> {
    Optional<Doctor> findByDoctorId(String doctorId);
    boolean existsByLicenseNumber(String licenseNumber);
    boolean existsByDoctorId(String doctorId);
    boolean existsByAssistantNumber(String assistantNumber);
    @Query(value = "SELECT d.doctor_id, d.first_name, d.last_name, d.specialization " +
                   "FROM \"pulseiq\".doctors d " +
                   "ORDER BY d.doctor_id", nativeQuery = true)
    List<Object[]> findAllDoctorsNative();
    
    // Appointment-related methods
    List<Doctor> findByIsAvailableTrue();
    
    List<Doctor> findBySpecializationContainingIgnoreCaseAndIsAvailableTrue(String specialization);
    
    @Query("SELECT DISTINCT d.specialization FROM Doctor d WHERE d.isAvailable = true ORDER BY d.specialization")
    List<String> findAllSpecializations();
    
    @Query("SELECT d FROM Doctor d WHERE d.isAvailable = true ORDER BY d.firstName, d.lastName")
    List<Doctor> findAllAvailableDoctorsOrderedByName();
}