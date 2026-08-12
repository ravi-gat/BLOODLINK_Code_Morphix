import { useState } from "react";
import { Search, Building2, CheckCircle, Clock, XCircle } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusBadge, VerifiedBadge } from "../../components/shared/StatusBadge";
import { StatCard } from "../../components/shared/StatCard";
import { EmptyState } from "../../components/shared/EmptyState";
import { HOSPITALS } from "../../data/hospitals";
import { Users } from "lucide-react";

const STATUS_TABS = ["All", "Active", "Pending", "Suspended"];

export function AdminHospitalsPage() {
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("All");
  const [approvals, setApprovals] = useState<Record<string, "approved" | "rejected">>({});

  const filtered = HOSPITALS.filter((h) => {
    if (statusTab !== "All" && h.status !== statusTab) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!h.name.toLowerCase().includes(q) && !h.city.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospitals"
        subtitle="Manage registered hospitals and approvals"
        breadcrumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Hospitals" }]}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Building2} label="Total Hospitals" value={String(HOSPITALS.length)} color="#1565C0" />
        <StatCard icon={CheckCircle} label="Active" value={String(HOSPITALS.filter(h => h.status === "Active").length)} color="#43A047" />
        <StatCard icon={Clock} label="Pending Approval" value={String(HOSPITALS.filter(h => h.status === "Pending").length)} color="#F9A825" deltaPositive={false} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospital name or city…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm" />
        </div>
        <div className="flex gap-1.5">
          {STATUS_TABS.map((t) => (
            <button key={t} onClick={() => setStatusTab(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${statusTab === t ? "bg-red-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-red-300"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No hospitals found" description="No hospitals match your filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => {
            const decision = approvals[h.id];
            return (
              <div key={h.id} className={`bg-card rounded-2xl border p-5 transition-all ${decision === "approved" ? "border-green-200 dark:border-green-900/50" : decision === "rejected" ? "border-muted" : "border-border"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Building2 size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{h.name}</span>
                        <VerifiedBadge verified={h.verified} />
                        <StatusBadge text={h.tier} color="#7C3AED" />
                        {decision && <StatusBadge text={decision === "approved" ? "Approved" : "Rejected"} color={decision === "approved" ? "#43A047" : "#6B7280"} />}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{h.address}</div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                        <span>{h.city}</span>
                        <span>·</span>
                        <span>{h.beds} beds</span>
                        <span>·</span>
                        <span>{h.phone}</span>
                        <span>·</span>
                        <span>Contact: {h.contactPerson}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <StatusBadge text={h.status} color={h.status === "Active" ? "#43A047" : h.status === "Pending" ? "#F9A825" : "#D32F2F"} />
                  </div>
                </div>

                {h.status === "Pending" && !decision && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <button onClick={() => setApprovals(p => ({ ...p, [h.id]: "approved" }))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button onClick={() => setApprovals(p => ({ ...p, [h.id]: "rejected" }))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}
                {decision && (
                  <p className={`mt-3 text-sm font-medium ${decision === "approved" ? "text-green-600" : "text-muted-foreground"}`}>
                    {decision === "approved" ? "✓ Hospital approved and onboarded." : "✗ Hospital registration rejected."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
