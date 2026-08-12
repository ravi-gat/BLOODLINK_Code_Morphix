import { useState } from "react";
import { CheckCircle, XCircle, Phone } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { UrgencyBadge, StatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { BLOOD_REQUESTS } from "../../data/requests";
import { AlertTriangle } from "lucide-react";

const TABS = ["All", "Critical", "High", "Moderate"];

export function BBRequestsPage() {
  const [tab, setTab] = useState("All");
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>({});

  const pending = BLOOD_REQUESTS.filter((r) => r.status !== "Fulfilled" && r.status !== "Cancelled");
  const filtered = tab === "All" ? pending : pending.filter((r) => r.urgency === tab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Requests"
        subtitle="Blood requests from hospitals pending approval"
        breadcrumbs={[{ label: "Blood Bank", path: "/bloodbank/dashboard" }, { label: "Requests" }]}
      />

      <div className="flex gap-1.5 bg-muted p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No pending requests" description="All hospital blood requests have been processed." />
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const decision = decisions[r.id];
            return (
              <div key={r.id} className={`bg-card rounded-2xl border p-5 ${decision === "approved" ? "border-green-200 dark:border-green-900/50" : decision === "rejected" ? "border-muted" : "border-border"}`}>
                <div className="flex items-start gap-4">
                  <BloodTypePill type={r.bloodGroup} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{r.hospital}</span>
                      <UrgencyBadge urgency={r.urgency} />
                      {decision && (
                        <StatusBadge text={decision === "approved" ? "Approved" : "Rejected"} color={decision === "approved" ? "#43A047" : "#6B7280"} />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {r.units} units needed · {r.city} · Patient: {r.patientName}
                      {r.doctor && ` · ${r.doctor}`}
                    </div>
                    {r.diagnosis && <p className="text-sm text-muted-foreground mb-3">{r.diagnosis}</p>}
                    {!decision ? (
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setDecisions((p) => ({ ...p, [r.id]: "approved" }))}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">
                          <CheckCircle size={15} /> Approve & Allocate
                        </button>
                        <button onClick={() => setDecisions((p) => ({ ...p, [r.id]: "rejected" }))}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">
                          <XCircle size={15} /> Reject
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 text-sm">
                          <Phone size={15} /> Call Hospital
                        </button>
                      </div>
                    ) : (
                      <p className={`text-sm font-medium ${decision === "approved" ? "text-green-600" : "text-muted-foreground"}`}>
                        {decision === "approved" ? "✓ Approved — blood allocated and dispatch initiated." : "✗ Request rejected."}
                      </p>
                    )}
                  </div>
                  <div className="text-right hidden sm:block flex-shrink-0">
                    <div className="text-2xl font-extrabold font-mono text-red-600">{r.bloodGroup}</div>
                    <div className="text-xs text-muted-foreground">{r.units} unit{r.units > 1 ? "s" : ""}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
