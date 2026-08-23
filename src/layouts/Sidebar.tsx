import { NavLink, useNavigate } from "react-router";
import {
  Droplets,
  LayoutDashboard,
  Search,
  AlertTriangle,
  History,
  MapPin,
  Bell,
  User,
  Settings,
  LogOut,
  Heart,
  Calendar,
  Award,
  Activity,
  Package,
  Truck,
  ClipboardList,
  BarChart2,
  Users,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
} from "lucide-react";
import type { UserRole } from "../types";
import { useAuthStore } from "../stores/useAuthStore";
import { useNotificationStore } from "../stores/useNotificationStore";
import { Avatar } from "../components/shared/Avatar";
import { useState } from "react";

interface SidebarProps {
  role: UserRole;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_CONFIG: Record<
  UserRole,
  { label: string; path: string; icon: React.ElementType; end?: boolean }[]
> = {
  patient: [
    { label: "Dashboard", path: "/patient/dashboard", icon: LayoutDashboard, end: true },
    { label: "Search Blood", path: "/patient/search", icon: Search },
    { label: "Emergency Request", path: "/patient/emergency", icon: AlertTriangle },
    { label: "Request History", path: "/patient/history", icon: History },
    { label: "Nearby Donors", path: "/patient/nearby", icon: MapPin },
    { label: "Notifications", path: "/patient/notifications", icon: Bell },
    { label: "Profile", path: "/patient/profile", icon: User },
    { label: "Settings", path: "/patient/settings", icon: Settings },
  ],
  donor: [
    { label: "Dashboard", path: "/donor/dashboard", icon: LayoutDashboard, end: true },
    { label: "Donation Requests", path: "/donor/requests", icon: Droplets },
    { label: "Donation History", path: "/donor/history", icon: History },
    { label: "Rewards", path: "/donor/rewards", icon: Award },
    { label: "Availability", path: "/donor/availability", icon: Calendar },
    { label: "Health Status", path: "/donor/health", icon: Activity },
    { label: "Notifications", path: "/donor/notifications", icon: Bell },
    { label: "Profile", path: "/donor/profile", icon: User },
    { label: "Settings", path: "/donor/settings", icon: Settings },
  ],
  hospital: [
    { label: "Dashboard", path: "/hospital/dashboard", icon: LayoutDashboard, end: true },
    { label: "Blood Inventory", path: "/hospital/inventory", icon: Package },
    { label: "Emergency Requests", path: "/hospital/emergency", icon: AlertTriangle },
    { label: "Patients", path: "/hospital/patients", icon: Users },
    { label: "Appointments", path: "/hospital/appointments", icon: Calendar },
    { label: "Analytics", path: "/hospital/analytics", icon: BarChart2 },
    { label: "Notifications", path: "/hospital/notifications", icon: Bell },
    { label: "Profile", path: "/hospital/profile", icon: Building2 },
    { label: "Settings", path: "/hospital/settings", icon: Settings },
  ],
  bloodbank: [
    { label: "Dashboard", path: "/bloodbank/dashboard", icon: LayoutDashboard, end: true },
    { label: "Inventory", path: "/bloodbank/inventory", icon: Package },
    { label: "Collection", path: "/bloodbank/collection", icon: Droplets },
    { label: "Distribution", path: "/bloodbank/distribution", icon: Truck },
    { label: "Expiry Tracking", path: "/bloodbank/expiry", icon: ClipboardList },
    { label: "Requests", path: "/bloodbank/requests", icon: AlertTriangle },
    { label: "Reports", path: "/bloodbank/reports", icon: FileText },
    { label: "Notifications", path: "/bloodbank/notifications", icon: Bell },
    { label: "Profile", path: "/bloodbank/profile", icon: User },
    { label: "Settings", path: "/bloodbank/settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard, end: true },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Donors", path: "/admin/donors", icon: Heart },
    { label: "Hospitals", path: "/admin/hospitals", icon: Building2 },
    { label: "Blood Banks", path: "/admin/bloodbanks", icon: Droplets },
    { label: "Emergency Requests", path: "/admin/emergency", icon: AlertTriangle },
    { label: "Reports", path: "/admin/reports", icon: FileText },
    { label: "Analytics", path: "/admin/analytics", icon: BarChart2 },
    { label: "Settings", path: "/admin/settings", icon: ShieldCheck },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Patient Portal",
  donor: "Donor Portal",
  hospital: "Hospital Portal",
  bloodbank: "Blood Bank Portal",
  admin: "Admin Control",
};

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  patient: Activity,
  donor: Heart,
  hospital: Building2,
  bloodbank: Droplets,
  admin: ShieldCheck,
};

export function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const navItems = NAV_CONFIG[role] ?? [];
  const unread = getUnreadCount();
  const RoleIcon = ROLE_ICONS[role] ?? Activity;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-card border-r border-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Portal Role Badge Header (replaces duplicate logo) */}
      <div
        className={`h-12 flex items-center border-b border-border/70 flex-shrink-0 ${
          collapsed ? "justify-center px-0" : "justify-between px-4"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
            <RoleIcon size={15} />
          </div>
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              {ROLE_LABELS[role]}
            </span>
          )}
        </div>

        {/* Mobile close button inside drawer */}
        {mobileOpen && !collapsed && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-colors ${
                    isActive ? "text-red-600 dark:text-red-400" : ""
                  }`}
                />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && label === "Notifications" && unread > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unread}
                  </span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-md">
                    {label}
                    {label === "Notifications" && unread > 0 && ` (${unread})`}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Collapse Controls */}
      <div className="border-t border-border p-2.5 flex-shrink-0 space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-muted/40 mb-1">
            <Avatar initials={user.initials} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <aside className="relative z-50 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
