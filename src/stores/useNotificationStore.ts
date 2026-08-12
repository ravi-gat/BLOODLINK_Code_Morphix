import { create } from "zustand";
import type { Notification } from "../types";
import { NOTIFICATIONS } from "../data";

interface NotificationStore {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getUserNotifications: (userId: string) => Notification[];
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: NOTIFICATIONS,

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: (userId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n
      ),
    }));
  },

  getUnreadCount: (userId) => {
    return get().notifications.filter((n) => n.userId === userId && !n.read).length;
  },

  getUserNotifications: (userId) => {
    return get().notifications.filter((n) => n.userId === userId);
  },
}));
