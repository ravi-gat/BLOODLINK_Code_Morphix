import { NavLink, useNavigate } from "react-router";
import {
  Droplets, LayoutDashboard, Search, AlertTriangle, History, MapPin,
  Bell, User, Settings, LogOut, Heart, Calendar, Award, Activity,
  Package, Truck, ClipboardList, BarChart2, Users, Building2,
  ShieldCheck, ChevronLeft, ChevronRight, FileText, Zap,
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

const NAV_CONFIG: Record<UserRole, { label: string; path: string; icon: React.ElementType; end?: boolean }[]> = {
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
  admin: "Admin Control Center",
};

export function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const navItems = NAV_CONFIG[role] ?? [];
  const unread = user ? getUnreadCount(user.id) : 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-card border-r border-border transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-border flex-shrink-0 ${collapsed ? "justify-center px-0" : "px-5 gap-3"}`}>
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
          <Droplets size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-foreground text-sm leading-tight">BloodLink</div>
            <div className="text-xs text-muted-foreground truncate">{ROLE_LABELS[role]}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
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
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={`flex-shrink-0 ${isActive ? "text-red-600" : ""}`} />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && label === "Notifications" && unread > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unread}
                  </span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {label}
                    {label === "Notifications" && unread > 0 && ` (${unread})`}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-border p-3 flex-shrink-0 space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50 mb-1">
            <Avatar initials={user.initials} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? <ChevronRight size={16} /> : (
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
      <aside className="hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="relative z-50 flex flex-col h-full">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
