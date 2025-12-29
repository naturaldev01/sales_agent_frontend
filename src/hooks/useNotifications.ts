"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Notification,
  getNotifications,
  addNotification as addNotif,
  markAsRead as markRead,
  markAllAsRead as markAllRead,
  clearAllNotifications,
  getUnreadCount,
  subscribe,
} from "@/lib/notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initial load
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());

    // Subscribe to changes
    const unsubscribe = subscribe(() => {
      setNotifications(getNotifications());
      setUnreadCount(getUnreadCount());
    });

    return unsubscribe;
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
      addNotif(notification);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    markRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    markAllRead();
  }, []);

  const clearAll = useCallback(() => {
    clearAllNotifications();
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

