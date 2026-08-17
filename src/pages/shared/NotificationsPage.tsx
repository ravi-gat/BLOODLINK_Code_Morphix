import { useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { EmptyState } from "../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
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
  const { notifications, isLoading, fetchNotifications, getUserNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const userNotifications = getUserNotifications();
  const unread = userNotifications.filter((n) => !n.read).length;
  const basePath = user ? BASE_PATH[user.role as UserRole] : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread notification${unread !== 1 ? "s" : ""}`}
        breadcrumbs={[
          {
            label:
              (user?.role?.charAt(0).toUpperCase() ?? "") + (user?.role?.slice(1) ?? ""),
            path: `${basePath}/dashboard`,
          },
          { label: "Notifications" },
        ]}
        actions={
          unread > 0 ? (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              <Check size={15} /> Mark all read
            </button>
          ) : undefined
        }
      />

      {isLoading && <LoadingSkeleton.SkeletonPage />}

      {!isLoading && userNotifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll see emergency alerts, match notifications, and system updates here."
        />
      )}

      {!isLoading && userNotifications.length > 0 && (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          {userNotifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.read) markAsRead(n.id);
              }}
              className={`w-full flex items-start gap-4 p-5 text-left hover:bg-muted/30 transition-colors ${
                !n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: TYPE_COLOR[n.type] || "#6B7280" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-sm font-medium ${n.read ? "text-foreground" : "text-foreground font-semibold"}`}>
                    {n.title}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatDistanceToNow(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
