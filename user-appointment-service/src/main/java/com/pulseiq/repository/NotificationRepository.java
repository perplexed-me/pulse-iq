package com.pulseiq.repository;

import com.pulseiq.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find all notifications for a specific recipient, ordered by creation date (newest first)
     */
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    /**
     * Find unread notifications for a specific recipient
     */
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(String recipientId);

    /**
     * Count unread notifications for a specific recipient
     */
    long countByRecipientIdAndIsReadFalse(String recipientId);

    /**
     * Find notifications by recipient and type
     */
    List<Notification> findByRecipientIdAndTypeOrderByCreatedAtDesc(String recipientId, Notification.NotificationType type);

    /**
     * Find notifications by recipient and read status
     */
    List<Notification> findByRecipientIdAndIsReadOrderByCreatedAtDesc(String recipientId, Boolean isRead);

    /**
     * Find notifications related to a specific entity
     */
    List<Notification> findByRelatedEntityIdAndRelatedEntityType(String relatedEntityId, String relatedEntityType);

    /**
     * Mark all notifications as read for a specific recipient
     */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.recipientId = :recipientId AND n.isRead = false")
    int markAllAsReadByRecipientId(@Param("recipientId") String recipientId);

    /**
     * Mark specific notification as read
     */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.notificationId = :notificationId")
    int markAsReadById(@Param("notificationId") Long notificationId);
}
