package com.pulseiq.service;

import com.pulseiq.entity.Notification;
import com.pulseiq.repository.NotificationRepository;
import com.pulseiq.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");

    @Override
    @Transactional
    public Notification createNotification(String recipientId, String recipientType, String title, 
                                         String message, Notification.NotificationType type, 
                                         String relatedEntityId, String relatedEntityType, String createdBy) {
        
        log.info("Creating notification for recipient: {}, type: {}", recipientId, type);
        
        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setRecipientType(recipientType);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setCreatedBy(createdBy);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        return notificationRepository.save(notification);
    }

    @Override
    public List<NotificationDto> getNotificationsByRecipient(String recipientId) {
        log.info("Fetching all notifications for recipient: {}", recipientId);
        
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
        return notifications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDto> getUnreadNotificationsByRecipient(String recipientId) {
        log.info("Fetching unread notifications for recipient: {}", recipientId);
        
        List<Notification> notifications = notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientId);
        return notifications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadNotificationCount(String recipientId) {
        log.info("Getting unread notification count for recipient: {}", recipientId);
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        log.info("Marking notification as read: {}", notificationId);
        notificationRepository.markAsReadById(notificationId);
    }

    @Override
    @Transactional
    public void markAllAsRead(String recipientId) {
        log.info("Marking all notifications as read for recipient: {}", recipientId);
        notificationRepository.markAllAsReadByRecipientId(recipientId);
    }

    @Override
    @Transactional
    public void createTestResultNotification(String patientId, String doctorId, String testResultId, String testName, String technicianId) {
        log.info("Creating test result notification for patient: {} and doctor: {}", patientId, doctorId);
        
        // Notification for patient
        createNotification(
            patientId,
            "PATIENT",
            "Test Result Available",
            "Your test result for " + testName + " is now available for review.",
            Notification.NotificationType.TEST_RESULT_UPLOADED,
            testResultId,
            "TEST_RESULT",
            technicianId
        );
        
        // Notification for doctor
        createNotification(
            doctorId,
            "DOCTOR",
            "New Test Result",
            "A new test result for " + testName + " has been uploaded by the technician.",
            Notification.NotificationType.TEST_RESULT_UPLOADED,
            testResultId,
            "TEST_RESULT",
            technicianId
        );
    }

    @Override
    @Transactional
    public void createAppointmentNotification(String patientId, String doctorId, String appointmentId, String appointmentDate) {
        log.info("Creating appointment notification for patient: {} and doctor: {}", patientId, doctorId);
        
        // Parse and format the appointment date
        String formattedDate = appointmentDate;
        try {
            LocalDateTime dateTime = LocalDateTime.parse(appointmentDate);
            formattedDate = dateTime.format(dateFormatter);
        } catch (Exception e) {
            log.warn("Could not parse appointment date: {}", appointmentDate);
        }
        
        // Notification for doctor
        createNotification(
            doctorId,
            "DOCTOR",
            "New Appointment Booked",
            "A new appointment has been booked for " + formattedDate + ".",
            Notification.NotificationType.APPOINTMENT_BOOKED,
            appointmentId,
            "APPOINTMENT",
            patientId
        );
        
        // Notification for patient (confirmation)
        createNotification(
            patientId,
            "PATIENT",
            "Appointment Confirmed",
            "Your appointment has been successfully booked for " + formattedDate + ".",
            Notification.NotificationType.APPOINTMENT_BOOKED,
            appointmentId,
            "APPOINTMENT",
            patientId
        );
    }

    @Override
    @Transactional
    public void sendOtpNotification(String patientId, String patientEmail, String patientName, String otp, String doctorId) {
        log.info("=== OTP Email Notification Started ===");
        log.info("Patient ID: {}, Email: {}, Name: {}, Doctor ID: {}", patientId, patientEmail, patientName, doctorId);
        log.info("OTP to send: {}", otp);
        
        // Create notification for patient using SYSTEM_NOTIFICATION instead of OTP_VERIFICATION
        createNotification(
            patientId,
            "PATIENT",
            "Test Result Access Request",
            "A doctor is requesting access to your test results. Your verification code is: " + otp + ". This code will expire in 10 minutes.",
            Notification.NotificationType.SYSTEM_NOTIFICATION,
            otp,
            "OTP",
            "SYSTEM"
        );
        log.info("Notification saved to database for patient: {}", patientId);
        
        // Send actual email to patient
        try {
            if (patientEmail != null && !patientEmail.trim().isEmpty()) {
                log.info("Calling emailService.sendOtpEmail...");
                emailService.sendOtpEmail(patientEmail, patientName, otp);
                log.info("OTP email sent successfully to patient {} at {}", patientId, patientEmail);
            } else {
                log.warn("Patient email is null or empty for patient: {}, OTP sent via notification only", patientId);
            }
        } catch (Exception e) {
            log.error("Failed to send OTP email to patient: {}, but notification created successfully", patientId, e);
            // Don't throw exception here - notification is still created even if email fails
        }
        
        log.info("=== OTP Email Notification Completed ===");
        log.info("OTP {} sent to patient {} via notification system", otp, patientId);
    }

    @Override
    @Transactional
    public void sendOtpNotificationForTestType(String patientId, String patientEmail, String patientName, String otp, String doctorId, String testType) {
        log.info("=== OTP Email Notification Started for Test Type ===");
        log.info("Patient ID: {}, Doctor ID: {}, Test Type: {}, OTP: {}", patientId, doctorId, testType, otp);
        
        // Create in-app notification
        String title = "OTP for " + testType + " Test Results Access";
        String message = String.format("Dr. %s has requested access to your %s test results. Your OTP is: %s. This OTP will expire in 10 minutes.", 
                                      doctorId, testType, otp);
        
        createNotification(
            patientId,
            "PATIENT",
            title,
            message,
            Notification.NotificationType.TEST_RESULT_ACCESS,
            null,
            "OTP_REQUEST",
            doctorId
        );
        
        log.info("In-app notification created for test type OTP");
        
        // Send email notification
        try {
            if (patientEmail != null && !patientEmail.trim().isEmpty()) {
                log.info("Calling emailService.sendOtpEmailForTestType...");
                emailService.sendOtpEmailForTestType(patientEmail, patientName, otp, testType);
                log.info("Test type OTP email sent successfully to patient {} at {} for test type {}", patientId, patientEmail, testType);
            } else {
                log.warn("Patient email is null or empty for patient: {}, Test type OTP sent via notification only", patientId);
            }
        } catch (Exception e) {
            log.error("Failed to send test type OTP email to patient: {}, but notification created successfully", patientId, e);
            // Don't throw exception here - notification is still created even if email fails
        }
        
        log.info("=== Test Type OTP Email Notification Completed ===");
        log.info("OTP {} sent to patient {} for test type {} via notification system", otp, patientId, testType);
    }

    private NotificationDto convertToDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setNotificationId(notification.getNotificationId());
        dto.setRecipientId(notification.getRecipientId());
        dto.setRecipientType(notification.getRecipientType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType().name());
        dto.setIsRead(notification.getIsRead());
        dto.setRelatedEntityId(notification.getRelatedEntityId());
        dto.setRelatedEntityType(notification.getRelatedEntityType());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setReadAt(notification.getReadAt());
        dto.setCreatedBy(notification.getCreatedBy());
        return dto;
    }
}
