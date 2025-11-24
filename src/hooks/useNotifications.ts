// src/hooks/useNotifications.ts
import { useState, useRef, useCallback, useEffect } from 'react';

export function useNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (notificationsEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [notificationsEnabled]);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
      });
    }
  }, [notificationsEnabled]);

  const notify = useCallback((conversationName: string) => {
    playNotificationSound();
    showBrowserNotification('New Message', `New message from ${conversationName}`);
  }, [playNotificationSound, showBrowserNotification]);

  return {
    notificationsEnabled,
    setNotificationsEnabled,
    audioRef,
    notify,
    notifications: [], // Mocked for now
    hasUnread: false, // Mocked for now
    markAllAsRead: () => { }, // Mocked for now
  };
}
