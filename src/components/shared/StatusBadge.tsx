interface StatusBadgeProps {
  text: string;
  color: string;
  dot?: boolean;
}

export function StatusBadge({ text, color, dot = false }: StatusBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: color + "18", color }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
      )}
      {text}
    </span>
  );
}

// Preset badge helpers
export function UrgencyBadge({ urgency }: { urgency: string }) {
  const colors: Record<string, string> = {
    Critical: "#D32F2F",
    High: "#F9A825",
    Moderate: "#1565C0",
    Low: "#43A047",
  };
  return <StatusBadge text={urgency} color={colors[urgency] ?? "#6B7280"} dot />;
}

export function RequestStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pending: "#F9A825",
    Matched: "#1565C0",
    "In Progress": "#7C3AED",
    Fulfilled: "#43A047",
    Cancelled: "#6B7280",
    Expired: "#D32F2F",
  };
  return <StatusBadge text={status} color={colors[status] ?? "#6B7280"} />;
}

export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    donor: "#43A047",
    patient: "#E53935",
    hospital: "#1565C0",
    bloodbank: "#F9A825",
    admin: "#7C3AED",
  };
  const labels: Record<string, string> = {
    donor: "Donor",
    patient: "Patient",
    hospital: "Hospital",
    bloodbank: "Blood Bank",
    admin: "Admin",
  };
  return <StatusBadge text={labels[role] ?? role} color={colors[role] ?? "#6B7280"} />;
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <StatusBadge text="Verified" color="#43A047" dot />
  ) : (
    <StatusBadge text="Unverified" color="#F9A825" dot />
  );
}

export function InventoryStatusBadge({ status }: { status: "good" | "low" | "critical" }) {
  const colors = { good: "#43A047", low: "#F9A825", critical: "#D32F2F" };
  const labels = { good: "Good", low: "Low Stock", critical: "Critical" };
  return <StatusBadge text={labels[status]} color={colors[status]} dot />;
}
