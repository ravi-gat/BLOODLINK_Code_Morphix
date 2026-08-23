import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
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
        <div className="flex flex-1 min-w-0 overflow-hidden">
          <Sidebar
            role={user.role as UserRole}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopNavbar onMobileMenuToggle={() => setMobileOpen(true)} />
            <main className="flex-1 overflow-y-auto bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
