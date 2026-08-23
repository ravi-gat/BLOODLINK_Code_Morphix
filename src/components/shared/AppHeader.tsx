import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  Bell,
  Sun,
  Moon,
  Menu,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  X,
  Check,
  Droplets,
  Heart,
} from "lucide-react";
import { useAuthStore, getRoleDashboardPath } from "../../stores/useAuthStore";
import { useThemeStore } from "../../stores/useThemeStore";
import { useNotificationStore } from "../../stores/useNotificationStore";
import { Avatar } from "./Avatar";
import { RoleBadge } from "./StatusBadge";
import { BloodLinkLogo } from "./BloodLinkLogo";
import { CodeMorphixBranding } from "./CodeMorphixBranding";
import { GlobalSearchModal } from "./GlobalSearchModal";
import type { UserRole } from "../../types";
import { formatDistanceToNow } from "../../utils/date";

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

export interface AppHeaderProps {
  variant?: "dashboard" | "landing" | "auth" | "minimal";
  pageTitle?: string;
  onMobileMenuToggle?: () => void;
  showSearch?: boolean;
  className?: string;
}

export function AppHeader({
  variant = "dashboard",
  pageTitle,
  onMobileMenuToggle,
  showSearch = true,
  className = "",
}: AppHeaderProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { dark, toggleTheme } = useThemeStore();
  const {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotificationStore();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch notifications periodically when user is authenticated
  useEffect(() => {
    if (user) {
      void fetchNotifications();
      const interval = setInterval(() => void fetchNotifications(), 30_000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const notifications = user ? getUserNotifications().slice(0, 8) : [];
  const unreadCount = user ? getUnreadCount() : 0;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAuthOrMinimal = variant === "auth" || variant === "minimal";
  const isLanding = variant === "landing";

  return (
    <>
      <header
        className={`h-16 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 gap-4 sticky top-0 z-40 ${className}`}
      >
        {/* LEFT: BloodLink Logo (Always Top-Left) + Optional Controls */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Hamburger Toggle (when in dashboard layout) */}
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Toggle navigation drawer"
            >
              <Menu size={18} />
            </button>
          )}

          {/* Standardized BloodLink Logo */}
<BloodLinkLogo size="md" className="flex-shrink-0" />

{/* Code Morphix — Technology Partner */}
<CodeMorphixBranding
  variant="header"
  className="flex-shrink-0"
/>

{/* Page / Context Title */}
          {pageTitle && (
            <h2 className="text-sm font-semibold text-foreground hidden md:block border-l border-border pl-3 ml-1 truncate">
              {pageTitle}
            </h2>
          )}
        </div>

        {/* CENTER: Navigation / Search */}
        {isLanding ? (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Home
            </Link>
            <button
              onClick={() => {
                const el = document.getElementById("search-blood");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                else navigate("/patient/search");
              }}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Find Blood
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("compatibility-matrix");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Compatibility
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("facilities-map");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Live Map
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("faqs-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              FAQs
            </button>
          </nav>
        ) : !isAuthOrMinimal && showSearch ? (
          <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground text-xs transition-all hover:border-red-500/30 cursor-pointer shadow-2xs"
              aria-label="Global Search (⌘K)"
            >
              <div className="flex items-center gap-2">
                <Search size={14} className="text-muted-foreground" />
                <span className="truncate">Search blood groups, facilities, donors...</span>
              </div>
              <kbd className="ml-2 font-mono text-[10px] bg-card px-1.5 py-0.5 rounded border border-border text-muted-foreground flex-shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* RIGHT: Theme + User Controls / Auth Buttons */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {/* Mobile Search Button (when search is enabled) */}
          {!isAuthOrMinimal && showSearch && (
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          )}

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Toggle color theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Authenticated User Controls */}
          {isAuthenticated && user ? (
            <>
              {/* Notifications Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setProfileOpen(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-11 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
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
                            className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                              !n.read ? "bg-red-50/50 dark:bg-red-950/20" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                style={{
                                  background: NOTIFICATION_ICON_COLOR[n.type] ?? "#6B7280",
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground leading-tight">
                                  {n.title}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {n.message}
                                </div>
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

                    {notifications.length > 0 && (
                      <div className="px-4 py-2.5 border-t border-border bg-card">
                        <button
                          onClick={() => {
                            setNotifOpen(false);
                            navigate(`/${user.role}/notifications`);
                          }}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium w-full text-center cursor-pointer"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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

                {profileOpen && (
                  <div className="absolute right-0 top-11 w-56 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-border bg-card">
                      <div className="text-sm font-semibold text-foreground truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      <div className="mt-2">
                        <RoleBadge role={user.role} />
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          navigate(ROLE_PROFILE_PATH[user.role as UserRole]);
                          setProfileOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <User size={15} />
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate(ROLE_SETTINGS_PATH[user.role as UserRole]);
                          setProfileOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Settings size={15} />
                        Settings
                      </button>
                    </div>
                    <div className="border-t border-border p-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer font-medium"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : isAuthOrMinimal ? (
            /* Auth Pages Quick Navigation */
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
              >
                Home
              </Link>
            </div>
          ) : (
            /* Unauthenticated / Public Landing Auth CTAs */
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/login")}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
              >
                <Droplets size={14} />
                Register
              </button>
              {isLanding && (
                <button
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Toggle mobile menu"
                >
                  {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer for Landing */}
      {isLanding && mobileNavOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 py-3 flex flex-col gap-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <Link
            to="/"
            onClick={() => setMobileNavOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Home
          </Link>
          <button
            onClick={() => {
              setMobileNavOpen(false);
              const el = document.getElementById("search-blood");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              else navigate("/patient/search");
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-left text-muted-foreground hover:bg-muted"
          >
            Find Blood
          </button>
          <button
            onClick={() => {
              setMobileNavOpen(false);
              const el = document.getElementById("compatibility-matrix");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-left text-muted-foreground hover:bg-muted"
          >
            Compatibility
          </button>
          <button
            onClick={() => {
              setMobileNavOpen(false);
              const el = document.getElementById("facilities-map");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-left text-muted-foreground hover:bg-muted"
          >
            Live Map
          </button>
          <button
            onClick={() => {
              setMobileNavOpen(false);
              const el = document.getElementById("faqs-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-left text-muted-foreground hover:bg-muted"
          >
            FAQs
          </button>
          {!isAuthenticated && (
            <div className="pt-2 border-t border-border flex flex-col gap-2 mt-1">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  navigate("/login");
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium text-left text-foreground hover:bg-muted"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  navigate("/register");
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium text-center bg-red-600 text-white hover:bg-red-700"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global Search Modal */}
      {!isAuthOrMinimal && showSearch && (
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
