package com.pulseiq.controller;

import com.pulseiq.dto.NotificationDto;
import com.pulseiq.entity.Notification;
import com.pulseiq.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get all notifications for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            log.info("Fetching notifications for user: {}", userId);
            
            List<NotificationDto> notifications = notificationService.getNotificationsByRecipient(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error fetching notifications", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get unread notifications for the authenticated user
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            log.info("Fetching unread notifications for user: {}", userId);
            
            List<NotificationDto> notifications = notificationService.getUnreadNotificationsByRecipient(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error fetching unread notifications", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get unread notification count for the authenticated user
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Object>> getUnreadNotificationCount(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            log.info("Fetching unread notification count for user: {}", userId);
            
            long count = notificationService.getUnreadNotificationCount(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching unread notification count", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Mark a specific notification as read
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long notificationId, 
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            log.info("Marking notification {} as read for user: {}", notificationId, userId);
            
            notificationService.markAsRead(notificationId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification marked as read");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error marking notification as read", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create a new notification
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, String>> createNotification(@RequestBody NotificationDto notificationDto) {
        try {
            log.info("Creating notification: {}", notificationDto);
            
            // Convert NotificationDto to service method parameters
            notificationService.createNotification(
                notificationDto.getRecipientId(),
                notificationDto.getRecipientType(),
                notificationDto.getTitle(),
                notificationDto.getMessage(),
                Notification.NotificationType.valueOf(notificationDto.getType()),
                notificationDto.getRelatedEntityId(),
                notificationDto.getRelatedEntityType(),
                notificationDto.getCreatedBy() != null ? notificationDto.getCreatedBy() : "SYSTEM"
            );
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification created successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating notification", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create a new notification (alternative endpoint for compatibility)
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> createNotificationAlt(@RequestBody NotificationDto notificationDto) {
        try {
            log.info("Creating notification (alt): {}", notificationDto);
            
            // Convert NotificationDto to service method parameters
            notificationService.createNotification(
                notificationDto.getRecipientId(),
                notificationDto.getRecipientType(),
                notificationDto.getTitle(),
                notificationDto.getMessage(),
                Notification.NotificationType.valueOf(notificationDto.getType()),
                notificationDto.getRelatedEntityId(),
                notificationDto.getRelatedEntityType(),
                notificationDto.getCreatedBy() != null ? notificationDto.getCreatedBy() : "SYSTEM"
            );
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification created successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating notification", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Mark all notifications as read for the authenticated user
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            log.info("Marking all notifications as read for user: {}", userId);
            
            notificationService.markAllAsRead(userId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "All notifications marked as read");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error marking all notifications as read", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
