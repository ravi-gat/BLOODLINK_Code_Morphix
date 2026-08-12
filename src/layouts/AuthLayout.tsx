import { Outlet, Link } from "react-router";
import { Droplets } from "lucide-react";
import { useThemeStore } from "../stores/useThemeStore";

export function AuthLayout() {
  const { dark } = useThemeStore();

  return (
    <div className={dark ? "dark" : ""} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="min-h-screen bg-background flex">
        {/* Left decorative panel — hidden on mobile */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-900 relative overflow-hidden flex-col justify-between p-12">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1565C0 0%, transparent 50%)",
            }}
          />
          {/* Logo */}
          <Link to="/" className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Droplets size={22} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">BloodLink</span>
          </Link>

          {/* Center copy */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium text-white mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              847 donors active right now
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Every Second<br />
              <span className="text-red-200">Matters.</span>
            </h1>
            <p className="text-red-100 text-lg leading-relaxed mb-8 max-w-sm">
              AI-powered emergency donor matching connects patients with compatible blood donors in minutes — not hours.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "1,24,850", label: "Registered Donors" },
                { value: "48,310", label: "Lives Saved" },
                { value: "98.3%", label: "Match Accuracy" },
                { value: "8 min", label: "Avg. Response" },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-extrabold text-white font-mono">{s.value}</div>
                  <div className="text-red-200 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5">
            <p className="text-red-100 text-sm leading-relaxed mb-3">
              "BloodLink found three compatible donors within 2 km in under 5 minutes when my father needed O- blood urgently."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                KN
              </div>
              <div>
                <div className="text-white text-sm font-medium">Kavitha Nambiar</div>
                <div className="text-red-300 text-xs">Patient's Family Member</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 px-6 pt-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <Droplets size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">BloodLink</span>
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">
              <Outlet />
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-6 px-6">
            © 2024 BloodLink Health Technologies Pvt. Ltd. &nbsp;·&nbsp;
            <span>Privacy</span>
            &nbsp;·&nbsp;
            <span>Terms</span>
          </p>
        </div>
      </div>
    </div>
  );
}
