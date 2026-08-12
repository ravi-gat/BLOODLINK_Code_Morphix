import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  color: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaPositive = true,
  color,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl" style={{ background: color + "18" }}>
          <Icon size={20} style={{ color }} />
        </div>
        {delta && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              deltaPositive
                ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                : "text-red-600 bg-red-50 dark:bg-red-900/20"
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground font-mono">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
