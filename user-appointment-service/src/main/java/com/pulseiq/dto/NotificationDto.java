package com.pulseiq.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long notificationId;
    private String recipientId;
    private String recipientType;
    private String title;
    private String message;
    private String type;
    private Boolean isRead;
    private String relatedEntityId;
    private String relatedEntityType;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private String createdBy;
}
