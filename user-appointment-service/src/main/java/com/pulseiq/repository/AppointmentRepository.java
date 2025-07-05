package com.pulseiq.repository;

import com.pulseiq.entity.Appointment;
import com.pulseiq.entity.Appointment.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(String patientId);
    
    List<Appointment> findByDoctorIdOrderByAppointmentDateAsc(String doctorId);
    
    List<Appointment> findByPatientIdAndStatusOrderByAppointmentDateDesc(String patientId, AppointmentStatus status);
    
    List<Appointment> findByDoctorIdAndStatusOrderByAppointmentDateAsc(String doctorId, AppointmentStatus status);
    
    @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentDate BETWEEN :startDate AND :endDate AND a.status = :status")
    List<Appointment> findByDoctorIdAndDateRangeAndStatus(
        @Param("doctorId") String doctorId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("status") AppointmentStatus status
    );
    
    @Query("SELECT a FROM Appointment a WHERE a.patientId = :patientId AND a.appointmentDate > :currentDate AND a.status = :status ORDER BY a.appointmentDate ASC")
    List<Appointment> findUpcomingAppointmentsByPatient(
        @Param("patientId") String patientId,
        @Param("currentDate") LocalDateTime currentDate,
        @Param("status") AppointmentStatus status
    );
    
    @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentDate > :currentDate AND a.status = :status ORDER BY a.appointmentDate ASC")
    List<Appointment> findUpcomingAppointmentsByDoctor(
        @Param("doctorId") String doctorId,
        @Param("currentDate") LocalDateTime currentDate,
        @Param("status") AppointmentStatus status
    );
}
