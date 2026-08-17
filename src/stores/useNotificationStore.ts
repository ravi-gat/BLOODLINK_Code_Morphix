import { create } from "zustand";
import type { Notification } from "../types";
import { notificationApi, type ApiNotification } from "../services/api";
import { useAuthStore } from "./useAuthStore";

interface NotificationStore {
  notifications: Notification[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
  getUserNotifications: () => Notification[];
}

function toAppNotification(n: ApiNotification): Notification {
  return {
    id: n.id,
    userId: n.user_id,
    type: n.type as Notification["type"],
    title: n.title,
    message: n.message,
    read: n.is_read,
    createdAt: n.created_at,
    link: n.link,
    meta: n.meta,
  };
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;
    set({ isLoading: true });
    try {
      const data = await notificationApi.getAll();
      set({ notifications: data.map(toAppNotification), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
    void notificationApi.markRead(id).catch(() => undefined);
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    void notificationApi.markAllRead().catch(() => undefined);
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },

  getUserNotifications: () => {
    return get().notifications;
  },
}));
