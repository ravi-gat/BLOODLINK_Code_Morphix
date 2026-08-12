import { useState } from "react";
import { Search, UserPlus, Phone, Clock } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { Avatar } from "../../components/shared/Avatar";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { UrgencyBadge, RequestStatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { BLOOD_REQUESTS } from "../../data/requests";

const PATIENTS = BLOOD_REQUESTS.map((r, i) => ({
  id: `p${String(i + 1).padStart(3, "0")}`,
  name: r.patientName,
  initials: r.patientName.split(" ").map((n) => n[0]).join("").slice(0, 2),
  bloodGroup: r.bloodGroup,
  ward: ["ICU", "Emergency", "Surgery", "General", "Cardiac", "Oncology"][i % 6],
  doctor: r.doctor ?? "Dr. Staff",
  status: r.status,
  urgency: r.urgency,
  diagnosis: r.diagnosis ?? "Under evaluation",
  phone: r.contactPhone,
  admittedAt: r.createdAt,
}));

const STATUS_TABS = ["All", "In Progress", "Pending", "Matched", "Fulfilled"];

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");

  const filtered = PATIENTS.filter((p) => {
    if (tab !== "All" && p.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.ward.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        subtitle="All patients with active blood requirements"
        breadcrumbs={[{ label: "Hospital", path: "/hospital/dashboard" }, { label: "Patients" }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
            <UserPlus size={16} /> Add Patient
          </button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or ward…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                tab === t ? "bg-red-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-red-300"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No patients found" description="Try adjusting the search or status filter." />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Patient", "Blood Group", "Ward", "Doctor", "Diagnosis", "Urgency", "Request Status", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={p.initials} size="sm" />
                        <div>
                          <div className="font-medium text-foreground">{p.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{p.id.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><BloodTypePill type={p.bloodGroup} /></td>
                    <td className="py-3.5 px-4 text-muted-foreground">{p.ward}</td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs">{p.doctor}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-muted-foreground truncate block max-w-[160px]">{p.diagnosis}</span>
                    </td>
                    <td className="py-3.5 px-4"><UrgencyBadge urgency={p.urgency} /></td>
                    <td className="py-3.5 px-4"><RequestStatusBadge status={p.status} /></td>
                    <td className="py-3.5 px-4">
                      <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium">
                        <Phone size={12} /> Contact
                      </button>
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
