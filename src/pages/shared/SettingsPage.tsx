import { useState } from "react";
import { Sun, Moon, Bell, Shield, Trash2, LogOut, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/shared/PageHeader";
import { Toggle } from "../../components/shared/Toggle";
import { useAuthStore } from "../../stores/useAuthStore";
import { useThemeStore } from "../../stores/useThemeStore";
import type { UserRole } from "../../types";

const BASE_PATH: Record<UserRole, string> = {
  patient: "/patient", donor: "/donor", hospital: "/hospital",
  bloodbank: "/bloodbank", admin: "/admin",
};

export function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { dark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [notifs, setNotifs] = useState({
    emergency: true, matches: true, reminders: true,
    news: false, sms: true, email: true,
  });
  const [privacy, setPrivacy] = useState({
    showProfile: true, showLocation: true, showHistory: false,
  });

  const basePath = user ? BASE_PATH[user.role as UserRole] : "";

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences and account settings"
        breadcrumbs={[
          { label: user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) ?? ""), path: `${basePath}/dashboard` },
          { label: "Settings" },
        ]}
      />

      {/* Appearance */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          {dark ? <Moon size={18} className="text-muted-foreground" /> : <Sun size={18} className="text-muted-foreground" />}
          <h3 className="font-semibold text-foreground">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-foreground text-sm">Dark Mode</div>
            <div className="text-xs text-muted-foreground">Switch between light and dark theme</div>
          </div>
          <Toggle checked={dark} onChange={toggleTheme} />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <Bell size={18} className="text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: "emergency", label: "Emergency Alerts", desc: "Critical blood requests near you" },
            { key: "matches", label: "Donor Matches", desc: "When a donor is matched for your request" },
            { key: "reminders", label: "Reminders", desc: "Donation eligibility and appointment reminders" },
            { key: "news", label: "News & Updates", desc: "Platform news and feature announcements" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <Toggle checked={notifs[key as keyof typeof notifs]} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} size="sm" />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Delivery Channels</div>
          <div className="space-y-3">
            {[
              { key: "sms", label: "SMS Notifications", desc: "Receive alerts via text message" },
              { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
                <Toggle checked={notifs[key as keyof typeof notifs]} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <Shield size={18} className="text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Privacy</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: "showProfile", label: "Public Profile", desc: "Allow others to see your profile" },
            { key: "showLocation", label: "Show Location", desc: "Share your approximate location with patients" },
            { key: "showHistory", label: "Donation History", desc: "Make your donation history visible publicly" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <Toggle checked={privacy[key as keyof typeof privacy]} onChange={(v) => setPrivacy((p) => ({ ...p, [key]: v }))} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Security</h3>
        <div className="space-y-1">
          {[
            { label: "Change Password", desc: "Update your account password" },
            { label: "Two-Factor Authentication", desc: "Add an extra layer of security" },
            { label: "Active Sessions", desc: "Manage devices signed into your account" },
          ].map(({ label, desc }) => (
            <button key={label} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left">
              <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card rounded-2xl border border-red-200 dark:border-red-900/50 p-6">
        <h3 className="font-semibold text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
          >
            <LogOut size={16} className="text-muted-foreground" />
            Sign out of all devices
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium">
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
