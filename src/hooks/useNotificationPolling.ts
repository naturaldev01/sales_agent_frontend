"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getNotifications, NotificationItem } from "@/lib/api";
import { addNotification, getNotifications as getStoredNotifications } from "@/lib/notifications";

const POLL_INTERVAL = 30000; // 30 seconds

export function useNotificationPolling() {
  const queryClient = useQueryClient();
  const lastCheckRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Initialize seen IDs from stored notifications
  useEffect(() => {
    const stored = getStoredNotifications();
    stored.forEach((n) => {
      // Extract original ID from stored notification
      seenIdsRef.current.add(n.id);
    });
  }, []);

  const checkForNewNotifications = useCallback(async () => {
    try {
      const since = lastCheckRef.current || new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last hour on first check
      const notifications = await getNotifications(since);

      let hasNewData = false;

      for (const notification of notifications) {
        // Check if we've already seen this notification
        if (!seenIdsRef.current.has(notification.id)) {
          seenIdsRef.current.add(notification.id);
          
          // Add to local notification store
          addNotification({
            type: notification.type,
            title: notification.title,
            message: notification.message,
            leadId: notification.leadId,
            photoId: notification.photoId,
          });

          hasNewData = true;
        }
      }

      // Update last check time
      lastCheckRef.current = new Date().toISOString();

      // If we got new notifications, invalidate queries to refresh data
      if (hasNewData) {
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["photos"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      }
    } catch (error) {
      console.error("Error polling for notifications:", error);
    }
  }, [queryClient]);

  useEffect(() => {
    // Initial check
    checkForNewNotifications();

    // Set up polling
    const interval = setInterval(checkForNewNotifications, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [checkForNewNotifications]);

  return { checkNow: checkForNewNotifications };
}

