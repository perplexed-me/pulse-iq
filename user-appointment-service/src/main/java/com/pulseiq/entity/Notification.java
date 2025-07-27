package com.pulseiq.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", schema = "pulseiq")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "recipient_id", nullable = false, length = 255)
    @NotBlank(message = "Recipient ID is required")
    private String recipientId;

    @Column(name = "recipient_type", nullable = false, length = 50)
    @NotBlank(message = "Recipient type is required")
    private String recipientType; // PATIENT, DOCTOR, TECHNICIAN, ADMIN

    @Column(name = "title", nullable = false, length = 255)
    @NotBlank(message = "Title is required")
    private String title;

    @Column(name = "message", nullable = false, length = 1000)
    @NotBlank(message = "Message is required")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    @NotNull(message = "Notification type is required")
    private NotificationType type;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "related_entity_id", length = 255)
    private String relatedEntityId; // appointment_id, test_result_id, etc.

    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType; // APPOINTMENT, TEST_RESULT, etc.

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_by", length = 255)
    private String createdBy; // Who triggered the notification

    public enum NotificationType {
        TEST_RESULT_UPLOADED,
        TEST_RESULT_ACCESS,
        APPOINTMENT_BOOKED,
        APPOINTMENT_CANCELLED,
        APPOINTMENT_REMINDER,
        PRESCRIPTION_UPLOADED,
        SYSTEM_NOTIFICATION,
        OTP_VERIFICATION,
        GENERAL
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isRead == null) {
            isRead = false;
        }
    }
}
