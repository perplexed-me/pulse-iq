import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TestNotification {
  id: number;
  recipientId: string;
  recipientType: 'DOCTOR' | 'PATIENT';
  message: string;
  type: 'TEST_UPLOAD';
  timestamp: string;
  read: boolean;
}

export const useTestNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TestNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    // Load existing notifications
    loadNotifications();

    // Listen for new test upload notifications
    const handleTestUploadNotification = (event: CustomEvent) => {
      const newNotifications = event.detail.notifications as TestNotification[];
      const userNotifications = newNotifications.filter(
        notif => notif.recipientId === user.id
      );
      
      if (userNotifications.length > 0) {
        setNotifications(prev => [...userNotifications, ...prev]);
        setUnreadCount(prev => prev + userNotifications.length);
      }
    };

    window.addEventListener('testUploadNotification', handleTestUploadNotification as EventListener);

    return () => {
      window.removeEventListener('testUploadNotification', handleTestUploadNotification as EventListener);
    };
  }, [user?.id]);

  const loadNotifications = () => {
    if (!user?.id) return;

    const allNotifications = JSON.parse(localStorage.getItem('testUploadNotifications') || '[]');
    const userNotifications = allNotifications
      .filter((notif: TestNotification) => notif.recipientId === user.id)
      .sort((a: TestNotification, b: TestNotification) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    
    setNotifications(userNotifications);
    setUnreadCount(userNotifications.filter((notif: TestNotification) => !notif.read).length);
  };

  const markAsRead = (notificationId: number) => {
    const allNotifications = JSON.parse(localStorage.getItem('testUploadNotifications') || '[]');
    const updatedNotifications = allNotifications.map((notif: TestNotification) => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    
    localStorage.setItem('testUploadNotifications', JSON.stringify(updatedNotifications));
    
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    if (!user?.id) return;

    const allNotifications = JSON.parse(localStorage.getItem('testUploadNotifications') || '[]');
    const updatedNotifications = allNotifications.map((notif: TestNotification) => 
      notif.recipientId === user.id ? { ...notif, read: true } : notif
    );
    
    localStorage.setItem('testUploadNotifications', JSON.stringify(updatedNotifications));
    
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    if (!user?.id) return;

    const allNotifications = JSON.parse(localStorage.getItem('testUploadNotifications') || '[]');
    const otherUserNotifications = allNotifications.filter((notif: TestNotification) => 
      notif.recipientId !== user.id
    );
    
    localStorage.setItem('testUploadNotifications', JSON.stringify(otherUserNotifications));
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refreshNotifications: loadNotifications
  };
};
