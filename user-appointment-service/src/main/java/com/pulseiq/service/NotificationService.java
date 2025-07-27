package com.pulseiq.service;

import com.pulseiq.entity.Notification;
import com.pulseiq.dto.NotificationDto;
import java.util.List;

public interface NotificationService {
    
    /**
     * Create a new notification
     */
    Notification createNotification(String recipientId, String recipientType, String title, 
                                  String message, Notification.NotificationType type, 
                                  String relatedEntityId, String relatedEntityType, String createdBy);
    
    /**
     * Get all notifications for a recipient
     */
    List<NotificationDto> getNotificationsByRecipient(String recipientId);
    
    /**
     * Get unread notifications for a recipient
     */
    List<NotificationDto> getUnreadNotificationsByRecipient(String recipientId);
    
    /**
     * Get unread notification count for a recipient
     */
    long getUnreadNotificationCount(String recipientId);
    
    /**
     * Mark a notification as read
     */
    void markAsRead(Long notificationId);
    
    /**
     * Mark all notifications as read for a recipient
     */
    void markAllAsRead(String recipientId);
    
    /**
     * Create notification when test result is uploaded
     */
    void createTestResultNotification(String patientId, String doctorId, String testResultId, String testName, String technicianId);
    
    /**
     * Create notification when appointment is booked
     */
    void createAppointmentNotification(String patientId, String doctorId, String appointmentId, String appointmentDate);
    
    /**
     * Send OTP notification to patient for test result access
     */
    void sendOtpNotification(String patientId, String patientEmail, String patientName, String otp, String doctorId);

    /**
     * Send OTP notification to patient for specific test type access
     */
    void sendOtpNotificationForTestType(String patientId, String patientEmail, String patientName, String otp, String doctorId, String testType);
}
