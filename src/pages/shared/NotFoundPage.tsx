import { useNavigate } from "react-router";
import { Droplets, ArrowLeft, Home } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import type { UserRole } from "../../types";
import { useThemeStore } from "../../stores/useThemeStore";

const DASHBOARD_PATHS: Record<UserRole, string> = {
  patient: "/patient/dashboard",
  donor: "/donor/dashboard",
  hospital: "/hospital/dashboard",
  bloodbank: "/bloodbank/dashboard",
  admin: "/admin/dashboard",
};

export function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { dark } = useThemeStore();

  const handleHome = () => {
    if (user) {
      navigate(DASHBOARD_PATHS[user.role as UserRole]);
    } else {
      navigate("/");
    }
  };

  return (
    <div className={dark ? "dark" : ""} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center">
            <Droplets size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">BloodLink</span>
        </div>

        {/* 404 */}
        <div className="text-center max-w-md">
          <div className="relative mb-6 select-none">
            <div className="text-[120px] sm:text-[160px] font-extrabold text-muted/30 leading-none tracking-tighter">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-200 dark:border-red-900/50 flex items-center justify-center">
                <Droplets size={28} className="text-red-600" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">Page not found</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <button
              onClick={handleHome}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <Home size={16} />
              {user ? "Go to Dashboard" : "Go to Home"}
            </button>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="mt-16 flex flex-wrap justify-center gap-4 opacity-40">
          {["A+", "B+", "O+", "AB+", "O-", "A-", "B-", "AB-"].map((g) => (
            <div
              key={g}
              className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-bold"
            >
              {g}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
