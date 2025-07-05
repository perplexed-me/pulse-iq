package com.pulseiq.dto;

import com.pulseiq.entity.Appointment;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class AppointmentResponseDto {
    
    private Long appointmentId;
    private String patientId;
    private String patientName;
    private String doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private LocalDateTime appointmentDate;
    private Appointment.AppointmentStatus status;
    private String reason;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String cancelledBy; // User ID who cancelled the appointment
    private String cancelledByName; // Name of the user who cancelled
    private String cancelledByRole; // Role of the user who cancelled (PATIENT/DOCTOR)
    private String cancellationReason; // Reason for cancellation
}
