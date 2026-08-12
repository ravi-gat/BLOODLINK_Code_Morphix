import { useState } from "react";
import { Calendar, Clock, Plus, X, CheckCircle, Search } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { Avatar } from "../../components/shared/Avatar";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { APPOINTMENTS } from "../../data/hospitals";

const STATUS_TABS = ["All", "Scheduled", "Completed", "Cancelled", "No Show"];
const TYPE_TABS = ["All Types", "Donation", "Screening", "Follow-up"];

export function AppointmentsPage() {
  const [statusTab, setStatusTab] = useState("All");
  const [typeTab, setTypeTab] = useState("All Types");
  const [search, setSearch] = useState("");

  const filtered = APPOINTMENTS.filter((a) => {
    if (statusTab !== "All" && a.status !== statusTab) return false;
    if (typeTab !== "All Types" && a.type !== typeTab) return false;
    if (search && !a.donorName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const STATUS_COLORS: Record<string, string> = {
    Scheduled: "#1565C0",
    Completed: "#43A047",
    Cancelled: "#6B7280",
    "No Show": "#D32F2F",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        subtitle="Manage donation and screening appointments"
        breadcrumbs={[{ label: "Hospital", path: "/hospital/dashboard" }, { label: "Appointments" }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
            <Plus size={16} /> Schedule Appointment
          </button>
        }
      />

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Scheduled", count: APPOINTMENTS.filter(a => a.status === "Scheduled").length, color: "#1565C0" },
          { label: "Completed", count: APPOINTMENTS.filter(a => a.status === "Completed").length, color: "#43A047" },
          { label: "Cancelled", count: APPOINTMENTS.filter(a => a.status === "Cancelled").length, color: "#6B7280" },
          { label: "No Show", count: APPOINTMENTS.filter(a => a.status === "No Show").length, color: "#D32F2F" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donor name…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map((t) => (
            <button key={t} onClick={() => setStatusTab(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${statusTab === t ? "bg-red-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-red-300"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_TABS.map((t) => (
            <button key={t} onClick={() => setTypeTab(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${typeTab === t ? "bg-blue-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-blue-300"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments found" description="Try adjusting your filters." />
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div key={apt.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <Avatar initials={apt.donorName.split(" ").map(n => n[0]).join("").slice(0,2)} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{apt.donorName}</span>
                    <BloodTypePill type={apt.donorBloodGroup} />
                    <StatusBadge text={apt.type} color="#7C3AED" />
                    <StatusBadge text={apt.status} color={STATUS_COLORS[apt.status]} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar size={11} />{apt.date}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{apt.time}</span>
                    <span>{apt.hospitalName}</span>
                  </div>
                  {apt.notes && <div className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded-lg px-2.5 py-1.5 w-fit">{apt.notes}</div>}
                </div>
                {apt.status === "Scheduled" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors">
                      <CheckCircle size={15} />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors">
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
