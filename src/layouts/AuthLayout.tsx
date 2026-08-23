import { Outlet, Link } from "react-router";
import { useThemeStore } from "../stores/useThemeStore";
import { BloodLinkLogo } from "../components/shared/BloodLinkLogo";
import { CodeMorphixLogo } from "../components/shared/CodeMorphixLogo";
import { Activity, ShieldCheck, Database, Zap } from "lucide-react";

export function AuthLayout() {
  const { dark } = useThemeStore();

  const features = [
    {
      icon: Zap,
      title: "Real-Time Emergency Matching",
      desc: "Instant matching and priority notifications for critical transfusion requests.",
    },
    {
      icon: Database,
      title: "Live Blood Bank Inventory",
      desc: "Standardized stock management and expiry tracking across regional blood banks.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Healthcare Network",
      desc: "Authenticated hospitals, blood centers, and certified donor verification.",
    },
    {
      icon: Activity,
      title: "Intelligent Compatibility",
      desc: "Automated blood type compatibility matrix and proximity-based donor dispatch.",
    },
  ];

  return (
    <div className={dark ? "dark" : ""} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="min-h-screen bg-background flex">
        {/* Left branding panel — hidden on mobile */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-900 relative overflow-hidden flex-col justify-between p-12 text-white">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1565C0 0%, transparent 50%)",
            }}
          />

          {/* Top Logo */}
          <div className="relative z-10">
            <BloodLinkLogo size="lg" lightText={true} tagline="AI-Enabled Blood & Emergency Network" />
          </div>

          {/* Middle Content */}
          <div className="relative z-10 max-w-lg my-auto py-8">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight mb-4 text-white">
              Every Second Counts When Saving Lives.
            </h1>
            <p className="text-red-100 text-sm xl:text-base leading-relaxed mb-8">
              A unified healthcare infrastructure connecting voluntary blood donors, licensed blood banks, and critical care hospitals.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 hover:bg-white/15 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2.5">
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="font-semibold text-xs xl:text-sm text-white">{feat.title}</div>
                    <div className="text-[11px] text-red-100/90 mt-1 leading-normal">{feat.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Powered By Badge */}
          <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/20">
            <CodeMorphixLogo size="sm" lightText={true} />
            <span className="text-[11px] text-red-200">Production Infrastructure v1.0</span>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center justify-between px-6 pt-6">
            <BloodLinkLogo size="md" />
            <CodeMorphixLogo size="xs" showText={false} />
          </div>

          {/* Center auth form container */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
            <div className="w-full max-w-md">
              <Outlet />
            </div>
          </div>

          {/* Clean Footer */}
          <div className="py-4 px-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div>
              © 2026 BloodLink Health Systems. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>·</span>
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <span>·</span>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
