import React from "react";
import { Link } from "react-router";
import { useAuthStore, getRoleDashboardPath } from "../../stores/useAuthStore";

export interface BloodLinkLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  tagline?: string;
  className?: string;
  href?: string;
  lightText?: boolean;
}

const SIZE_MAP = {
  xs: { icon: 20, text: "text-base", sub: "text-[10px]" },
  sm: { icon: 26, text: "text-lg", sub: "text-xs" },
  md: { icon: 34, text: "text-xl", sub: "text-xs" },
  lg: { icon: 42, text: "text-2xl", sub: "text-sm" },
  xl: { icon: 52, text: "text-3xl", sub: "text-sm" },
};

export function BloodLinkLogo({
  size = "md",
  showText = true,
  tagline,
  className = "",
  href,
  lightText = false,
}: BloodLinkLogoProps) {
  const { user } = useAuthStore();
  const config = SIZE_MAP[size] || SIZE_MAP.md;

  // Determine target link if none provided
  const targetHref =
    href !== undefined
      ? href
      : user
      ? getRoleDashboardPath(user.role)
      : "/";

  const logoGraphic = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Emblem */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: config.icon, height: config.icon }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="blGrad" x1="16" y1="4" x2="48" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <linearGradient id="blRing" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Blood Drop Core */}
          <path
            d="M32 4 C32 4 12 28 12 40 C12 51.0457 20.9543 60 32 60 C43.0457 60 52 51.0457 52 40 C52 28 32 4 32 4 Z"
            fill="url(#blGrad)"
          />

          {/* Connected Healthcare Ring */}
          <circle
            cx="32"
            cy="40"
            r="11"
            stroke="url(#blRing)"
            strokeWidth="3.2"
            fill="none"
            opacity="0.9"
          />

          {/* Heartbeat Cross Pulse */}
          <path
            d="M24 40 L28 40 L30 35 L33 45 L36 37 L38 40 L40 40"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gloss Sheen */}
          <path
            d="M21 28 C19 33 19 38 21 42"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className={`font-extrabold tracking-tight ${config.text}`}>
            <span className={lightText ? "text-white" : "text-foreground dark:text-white"}>
              Blood
            </span>
            <span className="text-red-600 dark:text-red-500">Link</span>
          </div>
          {tagline && (
            <span
              className={`font-medium tracking-normal ${config.sub} ${
                lightText
                  ? "text-red-200"
                  : "text-muted-foreground"
              }`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (targetHref) {
    return (
      <Link
        to={targetHref}
        className="inline-flex items-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500/30 rounded-lg"
        aria-label="BloodLink Home"
      >
        {logoGraphic}
      </Link>
    );
  }

  return logoGraphic;
}
