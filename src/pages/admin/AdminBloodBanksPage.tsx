import { useState } from "react";
import { Search, Droplets, CheckCircle, Clock, XCircle } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusBadge, VerifiedBadge } from "../../components/shared/StatusBadge";
import { StatCard } from "../../components/shared/StatCard";
import { EmptyState } from "../../components/shared/EmptyState";
import { BLOOD_BANKS } from "../../data/bloodbanks";

const STATUS_TABS = ["All", "Active", "Pending", "Suspended"];

export function AdminBloodBanksPage() {
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("All");
  const [approvals, setApprovals] = useState<Record<string, "approved" | "rejected">>({});

  const filtered = BLOOD_BANKS.filter((b) => {
    if (statusTab !== "All" && b.status !== statusTab) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Banks"
        subtitle="Manage registered blood banks and approvals"
        breadcrumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Blood Banks" }]}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Droplets} label="Total Blood Banks" value={String(BLOOD_BANKS.length)} color="#E53935" />
        <StatCard icon={CheckCircle} label="Active" value={String(BLOOD_BANKS.filter(b => b.status === "Active").length)} color="#43A047" />
        <StatCard icon={Clock} label="Pending" value={String(BLOOD_BANKS.filter(b => b.status === "Pending").length)} color="#F9A825" deltaPositive={false} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blood bank name or city…"
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
        <EmptyState icon={Droplets} title="No blood banks found" description="No blood banks match your filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const decision = approvals[b.id];
            const stockPct = Math.round((b.currentStock / b.capacity) * 100);
            return (
              <div key={b.id} className={`bg-card rounded-2xl border p-5 transition-all ${decision === "approved" ? "border-green-200 dark:border-green-900/50" : decision === "rejected" ? "border-muted" : "border-border"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{b.name}</span>
                      <VerifiedBadge verified={b.verified} />
                      {decision && <StatusBadge text={decision === "approved" ? "Approved" : "Rejected"} color={decision === "approved" ? "#43A047" : "#6B7280"} />}
                    </div>
                    <div className="text-sm text-muted-foreground">{b.address}</div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                      <span>{b.city}</span>
                      <span>·</span>
                      <span>Licence: {b.licenseNumber}</span>
                      <span>·</span>
                      <span>{b.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-muted-foreground">Stock: {b.currentStock}/{b.capacity}</span>
                      <div className="w-24 bg-muted rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${stockPct}%` }} />
                      </div>
                      <span className="text-xs font-mono">{stockPct}%</span>
                    </div>
                  </div>
                  <StatusBadge text={b.status} color={b.status === "Active" ? "#43A047" : b.status === "Pending" ? "#F9A825" : "#D32F2F"} />
                </div>

                {b.status === "Pending" && !decision && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <button onClick={() => setApprovals(p => ({ ...p, [b.id]: "approved" }))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button onClick={() => setApprovals(p => ({ ...p, [b.id]: "rejected" }))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}
                {decision && (
                  <p className={`mt-3 text-sm font-medium ${decision === "approved" ? "text-green-600" : "text-muted-foreground"}`}>
                    {decision === "approved" ? "✓ Blood bank approved." : "✗ Registration rejected."}
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
