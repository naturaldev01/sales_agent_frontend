// Notification types
export type NotificationType = "new_lead" | "new_photo" | "new_message" | "status_change";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  leadId?: string;
  photoId?: string;
  read: boolean;
  createdAt: string;
}

// Simple in-memory store with localStorage persistence
const STORAGE_KEY = "notifications-storage";

function loadFromStorage(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: Notification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // Ignore storage errors
  }
}

// Notification actions
let notifications: Notification[] = [];
let listeners: Set<() => void> = new Set();

export function getNotifications(): Notification[] {
  if (notifications.length === 0) {
    notifications = loadFromStorage();
  }
  return notifications;
}

export function addNotification(notification: Omit<Notification, "id" | "read" | "createdAt">) {
  const newNotification: Notification = {
    ...notification,
    id: crypto.randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications = [newNotification, ...notifications].slice(0, 50);
  saveToStorage(notifications);
  notifyListeners();
}

export function markAsRead(id: string) {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveToStorage(notifications);
  notifyListeners();
}

export function markAllAsRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  saveToStorage(notifications);
  notifyListeners();
}

export function clearAllNotifications() {
  notifications = [];
  saveToStorage(notifications);
  notifyListeners();
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

// Subscribe to changes
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

// Helper to create notifications
export function createLeadNotification(leadName: string, leadId: string) {
  return {
    type: "new_lead" as NotificationType,
    title: "New Lead",
    message: `${leadName || "Someone"} started a conversation`,
    leadId,
  };
}

export function createPhotoNotification(leadName: string, leadId: string, photoId: string) {
  return {
    type: "new_photo" as NotificationType,
    title: "New Photo",
    message: `${leadName || "A lead"} uploaded a photo`,
    leadId,
    photoId,
  };
}

export function createMessageNotification(leadName: string, leadId: string) {
  return {
    type: "new_message" as NotificationType,
    title: "New Message",
    message: `${leadName || "A lead"} sent a message`,
    leadId,
  };
}

