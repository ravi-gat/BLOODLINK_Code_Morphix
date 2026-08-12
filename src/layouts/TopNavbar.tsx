import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Bell, Sun, Moon, Menu, Search, ChevronDown, LogOut, User, Settings,
  Droplets, X, Check,
} from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import { useThemeStore } from "../stores/useThemeStore";
import { useNotificationStore } from "../stores/useNotificationStore";
import { Avatar } from "../components/shared/Avatar";
import { RoleBadge } from "../components/shared/StatusBadge";
import type { UserRole } from "../types";
import { formatDistanceToNow } from "../utils/date";

const NOTIFICATION_ICON_COLOR: Record<string, string> = {
  emergency: "#D32F2F",
  match: "#1565C0",
  reward: "#F9A825",
  reminder: "#43A047",
  system: "#6B7280",
  approval: "#7C3AED",
  info: "#0891B2",
};

const ROLE_SETTINGS_PATH: Record<UserRole, string> = {
  patient: "/patient/settings",
  donor: "/donor/settings",
  hospital: "/hospital/settings",
  bloodbank: "/bloodbank/settings",
  admin: "/admin/settings",
};

const ROLE_PROFILE_PATH: Record<UserRole, string> = {
  patient: "/patient/profile",
  donor: "/donor/profile",
  hospital: "/hospital/profile",
  bloodbank: "/bloodbank/profile",
  admin: "/admin/settings",
};

interface TopNavbarProps {
  onMobileMenuToggle: () => void;
  pageTitle?: string;
}

export function TopNavbar({ onMobileMenuToggle, pageTitle }: TopNavbarProps) {
  const { user, logout } = useAuthStore();
  const { dark, toggleTheme } = useThemeStore();
  const { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const notifications = user ? getUserNotifications(user.id).slice(0, 8) : [];
  const unreadCount = user ? getUnreadCount(user.id) : 0;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 gap-4 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <Menu size={18} />
        </button>
        {pageTitle && (
          <h2 className="text-sm font-semibold text-foreground hidden sm:block">{pageTitle}</h2>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && user && (
                  <button
                    onClick={() => markAllAsRead(user.id)}
                    className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        setNotifOpen(false);
                        if (n.link) navigate(n.link);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                        !n.read ? "bg-red-50/50 dark:bg-red-900/10" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: NOTIFICATION_ICON_COLOR[n.type] ?? "#6B7280" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground leading-tight">{n.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>
                          <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
                            {formatDistanceToNow(n.createdAt)}
                          </div>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {notifications.length > 0 && user && (
                <div className="px-4 py-2.5 border-t border-border">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate(`/${user.role}/notifications`);
                    }}
                    className="text-xs text-red-600 hover:underline font-medium w-full text-center"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors"
          >
            <Avatar initials={user?.initials ?? "U"} size="sm" />
            <div className="hidden sm:block text-left min-w-0">
              <div className="text-sm font-medium text-foreground leading-tight truncate max-w-[120px]">
                {user?.name}
              </div>
              <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
            </div>
            <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
          </button>

          {profileOpen && user && (
            <div className="absolute right-0 top-11 w-56 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-sm font-semibold text-foreground">{user.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                <div className="mt-2">
                  <RoleBadge role={user.role} />
                </div>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { navigate(ROLE_PROFILE_PATH[user.role as UserRole]); setProfileOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User size={15} />
                  View Profile
                </button>
                <button
                  onClick={() => { navigate(ROLE_SETTINGS_PATH[user.role as UserRole]); setProfileOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings size={15} />
                  Settings
                </button>
              </div>
              <div className="border-t border-border p-1.5">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
