import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Check, CheckCheck, Info, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG, apiCall } from '@/config/api';

interface Notification {
  notificationId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const [justMarkedAllRead, setJustMarkedAllRead] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications and unread count
  useEffect(() => {
    if (token) {
      // Don't fetch count if we just marked all as read
      if (!justMarkedAllRead) {
        fetchUnreadCount();
      }
      if (isOpen) {
        fetchNotifications();
      }
    }
  }, [token, isOpen, justMarkedAllRead]);

  // Poll for new notifications every 5 seconds
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [token, justMarkedAllRead]);

  // Listen for real-time notification events
  useEffect(() => {
    const handleNotificationCreated = () => {
      console.log('Notification created event received, refreshing notifications');
      // Don't fetch count if we just marked all as read
      if (!justMarkedAllRead) {
        fetchUnreadCount();
      }
      if (isOpen) {
        fetchNotifications();
      }
    };

    const handleFallbackNotification = (event: CustomEvent) => {
      console.log('Fallback notification created:', event.detail);
      // Don't fetch count if we just marked all as read
      if (!justMarkedAllRead) {
        fetchUnreadCount();
      }
      if (isOpen) {
        fetchNotifications();
      }
    };

    // Listen for notification creation events
    window.addEventListener('notificationCreated', handleNotificationCreated as EventListener);
    window.addEventListener('fallbackNotificationCreated', handleFallbackNotification as EventListener);

    return () => {
      window.removeEventListener('notificationCreated', handleNotificationCreated as EventListener);
      window.removeEventListener('fallbackNotificationCreated', handleFallbackNotification as EventListener);
    };
  }, [token, isOpen, justMarkedAllRead]);

  const fetchNotifications = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await apiCall(API_CONFIG.NOTIFICATIONS.ALL);

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    
    // Don't fetch if we just marked all as read (let it stay at 0)
    if (justMarkedAllRead) {
      console.log('Skipping fetchUnreadCount because we just marked all as read');
      return;
    }
    
    try {
      const response = await apiCall(API_CONFIG.NOTIFICATIONS.UNREAD_COUNT);

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      } else {
        console.error('Failed to fetch unread count');
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    if (!token) return;
    
    try {
      const response = await apiCall(API_CONFIG.NOTIFICATIONS.MARK_READ(notificationId), {
        method: 'PUT'
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.notificationId === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Update unread count
        const notificationToUpdate = notifications.find(n => n.notificationId === notificationId);
        if (notificationToUpdate && !notificationToUpdate.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        // toast({
        //   title: "Notification read",
        //   description: "Notification marked as read",
        // });
      } else {
        console.error('Failed to mark notification as read');
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    
    try {
      console.log('Mark all as read: Starting, current count:', unreadCount);
      
      const response = await apiCall(API_CONFIG.NOTIFICATIONS.MARK_ALL_READ, {
        method: 'PUT'
      });

      if (response.ok) {
        console.log('Mark all as read: API call successful');
        // Update local state immediately
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
        setJustMarkedAllRead(true);
        console.log('Mark all as read: Count set to 0, flag set to prevent polling override');
        
        // Reset the flag after 10 seconds to allow normal polling to resume
        setTimeout(() => {
          console.log('Mark all as read: Resetting flag, allowing polling to resume');
          setJustMarkedAllRead(false);
        }, 10000);
        
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      } else {
        console.error('Failed to mark all notifications as read');
        toast({
          title: "Error",
          description: "Failed to mark all notifications as read",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  };

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
      
      // Reset notification count when opening the dropdown
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
    setIsOpen(!isOpen);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if it's unread
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }
    
    // Show notification details
    setSelectedNotification(notification);
    setIsDetailDialogOpen(true);
  };

  const getNotificationDetails = (notification: Notification) => {
    switch (notification.type) {
      case 'TEST_RESULT_UPLOADED':
        return {
          icon: <FileText className="w-6 h-6 text-blue-500" />,
          details: `A test result has been uploaded and is now available for review. Test ID: ${notification.relatedEntityId || 'N/A'}`
        };
      case 'APPOINTMENT_BOOKED':
        return {
          icon: <Calendar className="w-6 h-6 text-green-500" />,
          details: `An appointment has been booked successfully. Appointment ID: ${notification.relatedEntityId || 'N/A'}`
        };
      case 'APPOINTMENT_CANCELLED':
        return {
          icon: <X className="w-6 h-6 text-red-500" />,
          details: `An appointment has been cancelled. Appointment ID: ${notification.relatedEntityId || 'N/A'}`
        };
      case 'APPOINTMENT_REMINDER':
        return {
          icon: <Bell className="w-6 h-6 text-orange-500" />,
          details: `This is a reminder for your upcoming appointment. Appointment ID: ${notification.relatedEntityId || 'N/A'}`
        };
      case 'PRESCRIPTION_UPLOADED':
        return {
          icon: <FileText className="w-6 h-6 text-green-600" />,
          details: `A new prescription has been uploaded for you. Prescription ID: ${notification.relatedEntityId || 'N/A'}`
        };
      default:
        return {
          icon: <Info className="w-6 h-6 text-gray-500" />,
          details: 'General notification - please check your dashboard for more information.'
        };
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TEST_RESULT_UPLOADED':
        return '🧪';
      case 'APPOINTMENT_BOOKED':
        return '📅';
      case 'APPOINTMENT_CANCELLED':
        return '❌';
      case 'APPOINTMENT_REMINDER':
        return '⏰';
      case 'PRESCRIPTION_UPLOADED':
        return '💊';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'TEST_RESULT_UPLOADED':
        return {
          bg: 'from-blue-500 to-cyan-600',
          border: 'border-blue-200',
          text: 'text-blue-700',
          iconBg: 'from-blue-100 to-cyan-100'
        };
      case 'APPOINTMENT_BOOKED':
        return {
          bg: 'from-green-500 to-emerald-600',
          border: 'border-green-200',
          text: 'text-green-700',
          iconBg: 'from-green-100 to-emerald-100'
        };
      case 'APPOINTMENT_CANCELLED':
        return {
          bg: 'from-red-500 to-rose-600',
          border: 'border-red-200',
          text: 'text-red-700',
          iconBg: 'from-red-100 to-rose-100'
        };
      case 'APPOINTMENT_REMINDER':
        return {
          bg: 'from-orange-500 to-amber-600',
          border: 'border-orange-200',
          text: 'text-orange-700',
          iconBg: 'from-orange-100 to-amber-100'
        };
      case 'PRESCRIPTION_UPLOADED':
        return {
          bg: 'from-purple-500 to-pink-600',
          border: 'border-purple-200',
          text: 'text-purple-700',
          iconBg: 'from-purple-100 to-pink-100'
        };
      default:
        return {
          bg: 'from-gray-500 to-slate-600',
          border: 'border-gray-200',
          text: 'text-gray-700',
          iconBg: 'from-gray-100 to-slate-100'
        };
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={{ zIndex: 9999 }}>
      {/* Notification Bell Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="relative hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-2 border-transparent hover:border-blue-200 transition-all duration-300 group"
        onClick={toggleDropdown}
      >
        <Bell className="h-5 w-5 group-hover:text-blue-600 transition-colors" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-pink-600 border-0 shadow-lg animate-pulse" 
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && createPortal(
        <Card 
          className="w-80 shadow-2xl border-2 border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm" 
          style={{ 
            position: 'fixed',
            top: buttonPosition.top,
            right: buttonPosition.right,
            zIndex: 999999 
          }}
        >
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Bell className="h-5 w-5" />
                </div>
                Notifications
              </CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 bg-white/20 hover:bg-white/30 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="mt-2 text-white/90 text-sm">
                You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 font-medium">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="p-4 bg-gradient-to-br from-gray-100 to-slate-200 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No notifications yet</p>
                  <p className="text-gray-500 text-sm mt-1">We'll notify you when something important happens</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => {
                    const colors = getNotificationColor(notification.type);
                    return (
                      <div
                        key={notification.notificationId}
                        className={`p-3 hover:shadow-md cursor-pointer border ${colors.border} transition-all duration-300 rounded-lg ${
                          !notification.isRead 
                            ? `bg-gradient-to-r from-white via-blue-50/50 to-purple-50/50 border-l-4 border-l-blue-500 shadow-sm` 
                            : 'bg-gradient-to-r from-white to-gray-50/30 hover:from-gray-50 hover:to-gray-100'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-2">
                          <div className={`flex-shrink-0 p-1.5 bg-gradient-to-br ${colors.iconBg} rounded-lg shadow-sm`}>
                            <span className="text-base">
                              {getNotificationIcon(notification.type)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-xs font-bold ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex-shrink-0 ml-2 shadow-sm animate-pulse" />
                              )}
                            </div>
                            <p className={`text-xs mt-0.5 ${colors.text} font-medium leading-snug`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500 font-medium">
                                {formatDate(notification.createdAt)}
                              </p>
                              <Badge className={`bg-gradient-to-r ${colors.bg} text-white border-0 shadow-sm text-xs px-1.5 py-0.5`}>
                                {notification.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>,
        document.body
      )}

      {/* Notification Details Dialog */}
      {selectedNotification && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-blue-200 z-[9999]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className={`p-3 bg-gradient-to-br ${getNotificationColor(selectedNotification.type).iconBg} rounded-xl shadow-lg`}>
                  {getNotificationDetails(selectedNotification).icon}
                </div>
                <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent font-bold">
                  {selectedNotification.title}
                </span>
              </DialogTitle>
              <DialogDescription>
                <div className="space-y-4 pt-3">
                  <div className={`p-4 bg-gradient-to-r ${getNotificationColor(selectedNotification.type).iconBg} rounded-xl border-2 ${getNotificationColor(selectedNotification.type).border}`}>
                    <p className={`text-sm font-semibold ${getNotificationColor(selectedNotification.type).text}`}>
                      {selectedNotification.message}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-sm font-bold text-gray-800 mb-2">Additional Details:</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {getNotificationDetails(selectedNotification).details}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500 font-medium">
                      <span>Received: {formatDate(selectedNotification.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`bg-gradient-to-r ${getNotificationColor(selectedNotification.type).bg} text-white border-0 shadow-md`}>
                        {selectedNotification.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Badge className={`${
                        selectedNotification.isRead 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                      } border-0 shadow-md`}>
                        {selectedNotification.isRead ? '✓ Read' : '● Unread'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex justify-end space-x-3 pt-4">
              {!selectedNotification.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    markAsRead(selectedNotification.notificationId);
                    setIsDetailDialogOpen(false);
                  }}
                  className="border-2 border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Read
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsDetailDialogOpen(false)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-md hover:shadow-lg transition-all duration-300"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default NotificationDropdown;
