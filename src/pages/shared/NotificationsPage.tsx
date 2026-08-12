import { Bell, Check, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { EmptyState } from "../../components/shared/EmptyState";
import { useAuthStore } from "../../stores/useAuthStore";
import { useNotificationStore } from "../../stores/useNotificationStore";
import { formatDistanceToNow } from "../../utils/date";
import type { UserRole } from "../../types";

const TYPE_COLOR: Record<string, string> = {
  emergency: "#D32F2F",
  match: "#1565C0",
  reward: "#F9A825",
  reminder: "#43A047",
  system: "#6B7280",
  approval: "#7C3AED",
  info: "#0891B2",
};

const BASE_PATH: Record<UserRole, string> = {
  patient: "/patient",
  donor: "/donor",
  hospital: "/hospital",
  bloodbank: "/bloodbank",
  admin: "/admin",
};

export function NotificationsPage() {
  const { user } = useAuthStore();
  const { getUserNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const notifications = user ? getUserNotifications(user.id) : [];
  const unread = notifications.filter((n) => !n.read).length;
  const basePath = user ? BASE_PATH[user.role as UserRole] : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread notification${unread !== 1 ? "s" : ""}`}
        breadcrumbs={[
          { label: user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) ?? ""), path: `${basePath}/dashboard` },
          { label: "Notifications" },
        ]}
        actions={
          unread > 0 && user ? (
            <button
              onClick={() => markAllAsRead(user.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              <Check size={15} /> Mark all read
            </button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll see emergency alerts, match notifications, and system updates here."
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {notifications.map((n, i) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/50 last:border-0 ${!n.read ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}
              onClick={() => markAsRead(n.id)}
            >
              {/* Type indicator */}
              <div
                className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: TYPE_COLOR[n.type] ?? "#6B7280" }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold text-foreground text-sm">{n.title}</span>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-xs text-muted-foreground/70 font-mono mt-1 block">
                      {formatDistanceToNow(n.createdAt)}
                    </span>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
