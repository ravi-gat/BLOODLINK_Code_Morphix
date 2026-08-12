import { useState } from "react";
import { AlertTriangle, MapPin, Phone } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { UrgencyBadge, RequestStatusBadge } from "../../components/shared/StatusBadge";
import { StatCard } from "../../components/shared/StatCard";
import { EmptyState } from "../../components/shared/EmptyState";
import { BLOOD_REQUESTS } from "../../data/requests";
import { CheckCircle, Clock, Activity } from "lucide-react";
import { formatDateTime } from "../../utils/date";

const URGENCY_TABS = ["All", "Critical", "High", "Moderate", "Low"];

export function AdminEmergencyPage() {
  const [tab, setTab] = useState("All");
  const active = BLOOD_REQUESTS.filter((r) => r.status !== "Fulfilled" && r.status !== "Cancelled");
  const filtered = tab === "All" ? active : active.filter((r) => r.urgency === tab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Requests"
        subtitle="All active blood emergency requests platform-wide"
        breadcrumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Emergency Requests" }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Total Active" value={String(active.length)} color="#E53935" deltaPositive={false} />
        <StatCard icon={Activity} label="Critical" value={String(active.filter(r => r.urgency === "Critical").length)} color="#D32F2F" deltaPositive={false} />
        <StatCard icon={Clock} label="Pending Match" value={String(active.filter(r => r.status === "Pending").length)} color="#F9A825" deltaPositive={false} />
        <StatCard icon={CheckCircle} label="In Progress" value={String(active.filter(r => r.status === "In Progress").length)} color="#1565C0" />
      </div>

      <div className="flex gap-1.5 bg-muted p-1 rounded-xl w-fit">
        {URGENCY_TABS.map((t) => {
          const count = (t === "All" ? active : active.filter(r => r.urgency === t)).length;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
              {count > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === t ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No emergency requests" description="No active requests match this filter." />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["ID", "Patient", "Blood", "Units", "Hospital", "City", "Urgency", "Status", "Created", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{r.id.toUpperCase()}</td>
                    <td className="py-3 px-3 font-medium text-foreground">{r.patientName}</td>
                    <td className="py-3 px-3"><BloodTypePill type={r.bloodGroup} /></td>
                    <td className="py-3 px-3 font-mono text-foreground">{r.units}</td>
                    <td className="py-3 px-3 text-muted-foreground text-xs">{r.hospital}</td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={10} />{r.city}</span>
                    </td>
                    <td className="py-3 px-3"><UrgencyBadge urgency={r.urgency} /></td>
                    <td className="py-3 px-3"><RequestStatusBadge status={r.status} /></td>
                    <td className="py-3 px-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1.5">
                        <button className="text-xs text-blue-600 hover:underline">View</button>
                        <button className="text-xs text-red-600 hover:underline">Escalate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
