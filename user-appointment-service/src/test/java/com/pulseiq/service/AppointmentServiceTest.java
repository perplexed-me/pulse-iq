package com.pulseiq.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pulseiq.dto.AppointmentRequestDto;
import com.pulseiq.dto.AppointmentResponseDto;
import com.pulseiq.entity.Appointment;
import com.pulseiq.entity.Appointment.AppointmentStatus;
import com.pulseiq.entity.Doctor;
import com.pulseiq.entity.Patient;
import com.pulseiq.repository.AppointmentRepository;
import com.pulseiq.repository.DoctorRepository;
import com.pulseiq.repository.PatientRepository;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private Doctor mockDoctor;
    private Patient mockPatient;
    private Appointment mockAppointment;
    private AppointmentRequestDto appointmentRequest;

    @BeforeEach
    void setUp() {
        // Setup mock doctor
        mockDoctor = new Doctor();
        mockDoctor.setDoctorId("D001");
        mockDoctor.setFirstName("Dr. John");
        mockDoctor.setLastName("Smith");
        mockDoctor.setSpecialization("Cardiology");
        mockDoctor.setIsAvailable(true);

        // Setup mock patient
        mockPatient = new Patient();
        mockPatient.setPatientId("P001");
        mockPatient.setFirstName("Jane");
        mockPatient.setLastName("Doe");

        // Setup mock appointment
        mockAppointment = new Appointment();
        mockAppointment.setAppointmentId(1L);
        mockAppointment.setPatientId("P001");
        mockAppointment.setDoctorId("D001");
        mockAppointment.setAppointmentDate(LocalDateTime.now().plusDays(1));
        mockAppointment.setReason("Regular checkup");
        mockAppointment.setStatus(AppointmentStatus.SCHEDULED);

        // Setup appointment request
        appointmentRequest = new AppointmentRequestDto();
        appointmentRequest.setDoctorId("D001");
        appointmentRequest.setAppointmentDate(LocalDateTime.now().plusDays(1));
        appointmentRequest.setReason("Regular checkup");
        appointmentRequest.setNotes("Patient reports no symptoms");
    }

    @Test
    void bookAppointment_Success() {
        // Arrange
        when(doctorRepository.findByDoctorId("D001")).thenReturn(Optional.of(mockDoctor));
        when(patientRepository.findByPatientId("P001")).thenReturn(Optional.of(mockPatient));
        when(appointmentRepository.findByDoctorIdAndDateRangeAndStatus(
                anyString(), any(LocalDateTime.class), any(LocalDateTime.class), any(AppointmentStatus.class)))
                .thenReturn(Arrays.asList()); // No conflicts
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(mockAppointment);

        // Act
        AppointmentResponseDto result = appointmentService.bookAppointment("P001", appointmentRequest);

        // Assert
        assertNotNull(result);
        assertEquals("P001", result.getPatientId());
        assertEquals("D001", result.getDoctorId());
        assertEquals("Regular checkup", result.getReason());
        assertEquals(AppointmentStatus.SCHEDULED, result.getStatus());

        // Verify interactions
        verify(doctorRepository).findByDoctorId("D001");
        verify(patientRepository).findByPatientId("P001");
        verify(appointmentRepository).findByDoctorIdAndDateRangeAndStatus(anyString(), any(), any(), any());
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    void bookAppointment_DoctorNotFound_ThrowsException() {
        // Arrange
        when(doctorRepository.findByDoctorId("D001")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> appointmentService.bookAppointment("P001", appointmentRequest));
        assertEquals("Doctor not found", exception.getMessage());

        verify(doctorRepository).findByDoctorId("D001");
        verify(patientRepository, never()).findByPatientId(anyString());
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void bookAppointment_DoctorNotAvailable_ThrowsException() {
        // Arrange
        mockDoctor.setIsAvailable(false);
        when(doctorRepository.findByDoctorId("D001")).thenReturn(Optional.of(mockDoctor));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> appointmentService.bookAppointment("P001", appointmentRequest));
        assertEquals("Doctor is not available for appointments", exception.getMessage());

        verify(doctorRepository).findByDoctorId("D001");
        verify(patientRepository, never()).findByPatientId(anyString());
    }

    @Test
    void bookAppointment_PatientNotFound_ThrowsException() {
        // Arrange
        when(doctorRepository.findByDoctorId("D001")).thenReturn(Optional.of(mockDoctor));
        when(patientRepository.findByPatientId("P001")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> appointmentService.bookAppointment("P001", appointmentRequest));
        assertEquals("Patient not found", exception.getMessage());

        verify(doctorRepository).findByDoctorId("D001");
        verify(patientRepository).findByPatientId("P001");
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void bookAppointment_TimeConflict_ThrowsException() {
        // Arrange
        Appointment conflictingAppointment = new Appointment();
        conflictingAppointment.setAppointmentId(2L);
        conflictingAppointment.setDoctorId("D001");
        conflictingAppointment.setStatus(AppointmentStatus.SCHEDULED);

        when(doctorRepository.findByDoctorId("D001")).thenReturn(Optional.of(mockDoctor));
        when(patientRepository.findByPatientId("P001")).thenReturn(Optional.of(mockPatient));
        when(appointmentRepository.findByDoctorIdAndDateRangeAndStatus(
                anyString(), any(LocalDateTime.class), any(LocalDateTime.class), any(AppointmentStatus.class)))
                .thenReturn(Arrays.asList(conflictingAppointment));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> appointmentService.bookAppointment("P001", appointmentRequest));
        assertTrue(exception.getMessage().contains("Doctor is not available at the selected time"));

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void getPatientAppointments_Success() {
        // Arrange
        List<Appointment> appointments = Arrays.asList(mockAppointment);
        when(appointmentRepository.findByPatientIdOrderByAppointmentDateDesc("P001"))
                .thenReturn(appointments);

        // Act
        List<AppointmentResponseDto> result = appointmentService.getPatientAppointments("P001");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("P001", result.get(0).getPatientId());

        verify(appointmentRepository).findByPatientIdOrderByAppointmentDateDesc("P001");
    }

    @Test
    void getDoctorAppointments_Success() {
        // Arrange
        List<Appointment> appointments = Arrays.asList(mockAppointment);
        when(appointmentRepository.findByDoctorIdOrderByAppointmentDateAsc("D001"))
                .thenReturn(appointments);

        // Act
        List<AppointmentResponseDto> result = appointmentService.getDoctorAppointments("D001");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("D001", result.get(0).getDoctorId());

        verify(appointmentRepository).findByDoctorIdOrderByAppointmentDateAsc("D001");
    }

    @Test
    void getUpcomingPatientAppointments_Success() {
        // Arrange
        List<Appointment> upcomingAppointments = Arrays.asList(mockAppointment);
        when(appointmentRepository.findUpcomingAppointmentsByPatient(
                eq("P001"), any(LocalDateTime.class), eq(AppointmentStatus.SCHEDULED)))
                .thenReturn(upcomingAppointments);

        // Act
        List<AppointmentResponseDto> result = appointmentService.getUpcomingPatientAppointments("P001");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(AppointmentStatus.SCHEDULED, result.get(0).getStatus());

        verify(appointmentRepository).findUpcomingAppointmentsByPatient(
                eq("P001"), any(LocalDateTime.class), eq(AppointmentStatus.SCHEDULED));
    }

    @Test
    void cancelAppointment_Success() {
        // Arrange
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(mockAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(mockAppointment);

        // Act
        appointmentService.cancelAppointment(1L, "P001", "PATIENT", "User requested cancellation");

        // Assert
        verify(appointmentRepository).findById(1L);
        verify(appointmentRepository)
                .save(argThat(appointment -> appointment.getStatus() == AppointmentStatus.CANCELLED &&
                        "P001".equals(appointment.getCancelledBy())));
    }

    @Test
    void cancelAppointment_AppointmentNotFound_ThrowsException() {
        // Arrange
        when(appointmentRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> appointmentService.cancelAppointment(1L, "P001", "PATIENT", "User requested cancellation"));
        assertEquals("Appointment not found", exception.getMessage());

        verify(appointmentRepository).findById(1L);
        verify(appointmentRepository, never()).save(any());
    }
}
