package com.pulseiq.service;

import com.pulseiq.dto.*;
import com.pulseiq.entity.Appointment;
import com.pulseiq.entity.Appointment.AppointmentStatus;
import com.pulseiq.entity.Doctor;
import com.pulseiq.entity.Patient;
import com.pulseiq.repository.AppointmentRepository;
import com.pulseiq.repository.DoctorRepository;
import com.pulseiq.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    @Autowired
    private PatientRepository patientRepository;

    public AppointmentResponseDto bookAppointment(String patientId, AppointmentRequestDto request) {
        // Validate doctor exists and is available
        Doctor doctor = doctorRepository.findByDoctorId(request.getDoctorId())
            .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        if (!doctor.getAvailable()) {
            throw new RuntimeException("Doctor is not available for appointments");
        }
        
        // Validate appointment date/time against doctor's availability
        validateDoctorAvailability(doctor, request.getAppointmentDate());
        
        // Validate patient exists
        Patient patient = patientRepository.findByPatientId(patientId)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        // Check for appointment conflicts (same doctor, same time slot within 14 minutes)
        LocalDateTime startTime = request.getAppointmentDate().minusMinutes(7);
        LocalDateTime endTime = request.getAppointmentDate().plusMinutes(7);
        
        List<Appointment> conflictingAppointments = appointmentRepository
            .findByDoctorIdAndDateRangeAndStatus(
                request.getDoctorId(), 
                startTime, 
                endTime, 
                AppointmentStatus.SCHEDULED
            );
        
        if (!conflictingAppointments.isEmpty()) {
            Appointment conflictingAppointment = conflictingAppointments.get(0);
            throw new RuntimeException("Doctor already has an appointment scheduled at " + 
                conflictingAppointment.getAppointmentDate().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) +
                ". Please choose a time slot at least 15 minutes away from existing appointments.");
        }
        
        // Create appointment
        Appointment appointment = new Appointment();
        appointment.setPatientId(patientId);
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setReason(request.getReason());
        appointment.setNotes(request.getNotes());
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        
        appointment = appointmentRepository.save(appointment);
        
        return mapToResponseDto(appointment, patient, doctor);
    }

    public List<AppointmentResponseDto> getPatientAppointments(String patientId) {
        List<Appointment> appointments = appointmentRepository
            .findByPatientIdOrderByAppointmentDateDesc(patientId);
        
        return appointments.stream()
            .map(this::mapToResponseDto)
            .collect(Collectors.toList());
    }

    public List<AppointmentResponseDto> getDoctorAppointments(String doctorId) {
        List<Appointment> appointments = appointmentRepository
            .findByDoctorIdOrderByAppointmentDateAsc(doctorId);
        
        return appointments.stream()
            .map(this::mapToResponseDto)
            .collect(Collectors.toList());
    }

    public List<AppointmentResponseDto> getUpcomingPatientAppointments(String patientId) {
        List<Appointment> appointments = appointmentRepository
            .findUpcomingAppointmentsByPatient(patientId, LocalDateTime.now(), AppointmentStatus.SCHEDULED);
        
        return appointments.stream()
            .map(this::mapToResponseDto)
            .collect(Collectors.toList());
    }

    public List<AppointmentResponseDto> getUpcomingDoctorAppointments(String doctorId) {
        List<Appointment> appointments = appointmentRepository
            .findUpcomingAppointmentsByDoctor(doctorId, LocalDateTime.now(), AppointmentStatus.SCHEDULED);
        
        return appointments.stream()
            .map(this::mapToResponseDto)
            .collect(Collectors.toList());
    }

    // Generic method for getting upcoming appointments (used by both patients and doctors)
    public List<AppointmentResponseDto> getUpcomingAppointments(String userId) {
        // First try as patient
        List<Appointment> appointments = appointmentRepository
            .findUpcomingAppointmentsByPatient(userId, LocalDateTime.now(), AppointmentStatus.SCHEDULED);
        
        // If no appointments found, try as doctor
        if (appointments.isEmpty()) {
            appointments = appointmentRepository
                .findUpcomingAppointmentsByDoctor(userId, LocalDateTime.now(), AppointmentStatus.SCHEDULED);
        }
        
        return appointments.stream()
            .map(this::mapToResponseDto)
            .collect(Collectors.toList());
    }

    public AppointmentResponseDto updateAppointmentStatus(Long appointmentId, AppointmentStatus status, String userId, String userRole) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        // Authorization check
        if ("patient".equals(userRole) && !appointment.getPatientId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You can only modify your own appointments");
        }
        if ("doctor".equals(userRole) && !appointment.getDoctorId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You can only modify your own appointments");
        }
        
        // Track cancellation
        if (status == AppointmentStatus.CANCELLED) {
            appointment.setCancelledBy(userId);
        }
        
        appointment.setStatus(status);
        appointment = appointmentRepository.save(appointment);
        
        return mapToResponseDto(appointment);
    }

    public AppointmentResponseDto cancelAppointment(Long appointmentId, String userId, String userRole, String cancellationReason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        // Authorization check
        if ("patient".equals(userRole) && !appointment.getPatientId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You can only cancel your own appointments");
        }
        if ("doctor".equals(userRole) && !appointment.getDoctorId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You can only cancel your own appointments");
        }
        
        // Set cancellation details
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledBy(userId);
        appointment.setCancellationReason(cancellationReason);
        
        appointment = appointmentRepository.save(appointment);
        
        return mapToResponseDto(appointment);
    }

    // Overloaded method for backward compatibility with tests (takes only appointmentId and userId)
    public void cancelAppointment(Long appointmentId, String userId) {
        cancelAppointment(appointmentId, userId, "patient", "");
    }

    public List<DoctorListDto> getAllAvailableDoctors() {
        List<Doctor> doctors = doctorRepository.findAllAvailableDoctorsOrderedByName();
        
        return doctors.stream()
            .map(doctor -> DoctorListDto.builder()
                .doctorId(doctor.getDoctorId())
                .firstName(doctor.getFirstName())
                .lastName(doctor.getLastName())
                .specialization(doctor.getSpecialization())
                .degree(doctor.getDegree())
                .isAvailable(doctor.getAvailable())
                .profilePicture(encodeProfilePicture(doctor.getProfilePicture()))
                .consultationFee(doctor.getConsultationFee())
                .build())
            .collect(Collectors.toList());
    }

    public List<DoctorListDto> getDoctorsBySpecialization(String specialization) {
        List<Doctor> doctors = doctorRepository
            .findBySpecializationContainingIgnoreCaseAndIsAvailableTrue(specialization);
        
        return doctors.stream()
            .map(doctor -> DoctorListDto.builder()
                .doctorId(doctor.getDoctorId())
                .firstName(doctor.getFirstName())
                .lastName(doctor.getLastName())
                .specialization(doctor.getSpecialization())
                .degree(doctor.getDegree())
                .isAvailable(doctor.getAvailable())
                .profilePicture(encodeProfilePicture(doctor.getProfilePicture()))
                .consultationFee(doctor.getConsultationFee())
                .build())
            .collect(Collectors.toList());
    }

    public List<String> getAllSpecializations() {
        return doctorRepository.findAllSpecializations();
    }

    private AppointmentResponseDto mapToResponseDto(Appointment appointment) {
        // Fetch patient and doctor details
        Patient patient = patientRepository.findByPatientId(appointment.getPatientId()).orElse(null);
        Doctor doctor = doctorRepository.findByDoctorId(appointment.getDoctorId()).orElse(null);
        
        return mapToResponseDto(appointment, patient, doctor);
    }

    private AppointmentResponseDto mapToResponseDto(Appointment appointment, Patient patient, Doctor doctor) {
        String cancelledByName = null;
        String cancelledByRole = null;
        
        if (appointment.getCancelledBy() != null) {
            if (appointment.getCancelledBy().equals(appointment.getPatientId())) {
                cancelledByName = patient != null ? patient.getFirstName() + " " + patient.getLastName() : "Patient";
                cancelledByRole = "PATIENT";
            } else if (appointment.getCancelledBy().equals(appointment.getDoctorId())) {
                cancelledByName = doctor != null ? "Dr. " + doctor.getFirstName() + " " + doctor.getLastName() : "Doctor";
                cancelledByRole = "DOCTOR";
            }
        }
        
        return AppointmentResponseDto.builder()
            .appointmentId(appointment.getAppointmentId())
            .patientId(appointment.getPatientId())
            .patientName(patient != null ? patient.getFirstName() + " " + patient.getLastName() : "Unknown")
            .doctorId(appointment.getDoctorId())
            .doctorName(doctor != null ? doctor.getFirstName() + " " + doctor.getLastName() : "Unknown")
            .doctorSpecialization(doctor != null ? doctor.getSpecialization() : "Unknown")
            .appointmentDate(appointment.getAppointmentDate())
            .status(appointment.getStatus())
            .reason(appointment.getReason())
            .notes(appointment.getNotes())
            .createdAt(appointment.getCreatedAt())
            .updatedAt(appointment.getUpdatedAt())
            .cancelledBy(appointment.getCancelledBy())
            .cancelledByName(cancelledByName)
            .cancelledByRole(cancelledByRole)
            .cancellationReason(appointment.getCancellationReason())
            .build();
    }

    private String encodeProfilePicture(byte[] profilePicture) {
        if (profilePicture == null || profilePicture.length == 0) return null;
        return java.util.Base64.getEncoder().encodeToString(profilePicture);
    }

    /**
     * Validates if the appointment date/time falls within doctor's availability
     */
    private void validateDoctorAvailability(Doctor doctor, LocalDateTime appointmentDate) {
        // Check if doctor has availability settings
        if (doctor.getAvailableDays() == null || doctor.getAvailableDays().isEmpty()) {
            throw new RuntimeException("Doctor availability is not configured. Please contact support.");
        }

        // Get day of week from appointment date
        String dayOfWeek = appointmentDate.getDayOfWeek().name(); // MONDAY, TUESDAY, etc.
        
        // Check if appointment day is in doctor's available days
        String[] availableDays = doctor.getAvailableDays().split(",");
        boolean isDayAvailable = false;
        for (String availableDay : availableDays) {
            if (availableDay.trim().equalsIgnoreCase(dayOfWeek)) {
                isDayAvailable = true;
                break;
            }
        }
        
        if (!isDayAvailable) {
            throw new RuntimeException("Doctor is not available on " + dayOfWeek.toLowerCase() + 
                ". Available days: " + doctor.getAvailableDays().replace(",", ", "));
        }

        // Check time range
        if (doctor.getAvailableTimeStart() != null && doctor.getAvailableTimeEnd() != null) {
            try {
                // Parse doctor's available time range
                String[] startParts = doctor.getAvailableTimeStart().split(":");
                String[] endParts = doctor.getAvailableTimeEnd().split(":");
                
                int startHour = Integer.parseInt(startParts[0]);
                int startMinute = Integer.parseInt(startParts[1]);
                int endHour = Integer.parseInt(endParts[0]);
                int endMinute = Integer.parseInt(endParts[1]);
                
                // Get appointment time
                int appointmentHour = appointmentDate.getHour();
                int appointmentMinute = appointmentDate.getMinute();
                
                // Convert to minutes for easier comparison
                int startTimeMinutes = startHour * 60 + startMinute;
                int endTimeMinutes = endHour * 60 + endMinute;
                int appointmentTimeMinutes = appointmentHour * 60 + appointmentMinute;
                
                if (appointmentTimeMinutes < startTimeMinutes || appointmentTimeMinutes > endTimeMinutes) {
                    throw new RuntimeException("Doctor is not available at " + 
                        String.format("%02d:%02d", appointmentHour, appointmentMinute) +
                        ". Available time: " + doctor.getAvailableTimeStart() + " - " + doctor.getAvailableTimeEnd());
                }
                
            } catch (NumberFormatException e) {
                throw new RuntimeException("Invalid doctor availability time format. Please contact support.");
            }
        }
    }
}
