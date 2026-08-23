import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "../components/shared/AppHeader";
import { Footer } from "../components/shared/Footer";
import { useAuthStore } from "../stores/useAuthStore";
import { useThemeStore } from "../stores/useThemeStore";
import type { UserRole } from "../types";

export function DashboardLayout() {
  const { user } = useAuthStore();
  const { dark } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  return (
    <div className={dark ? "dark" : ""} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        {/* Full-width Standardized App Header at the very top */}
        <AppHeader
          variant="dashboard"
          onMobileMenuToggle={() => setMobileOpen((prev) => !prev)}
        />

        {/* Workspace Body: Sidebar on the left + Main Content on the right */}
        <div className="flex flex-1 min-w-0 overflow-hidden">
          <Sidebar
            role={user.role as UserRole}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <main className="flex-1 overflow-y-auto bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <Outlet />
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
