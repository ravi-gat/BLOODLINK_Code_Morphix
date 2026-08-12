import { useState } from "react";
import { CheckCircle, XCircle, Phone } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { UrgencyBadge, RequestStatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { BLOOD_REQUESTS } from "../../data/requests";
import { AlertTriangle } from "lucide-react";
import { formatDateTime } from "../../utils/date";

const TABS = ["All", "Critical", "High", "Moderate", "Low"];

export function HospitalEmergencyPage() {
  const [tab, setTab] = useState("All");
  const [approvals, setApprovals] = useState<Record<string, "approved" | "rejected">>({});

  const filtered = BLOOD_REQUESTS.filter((r) => {
    if (r.status === "Fulfilled" || r.status === "Cancelled") return false;
    if (tab !== "All" && r.urgency !== tab) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Requests"
        subtitle="Incoming blood requests requiring urgent attention"
        breadcrumbs={[{ label: "Hospital", path: "/hospital/dashboard" }, { label: "Emergency Requests" }]}
      />

      {/* Tabs */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-xl w-fit flex-wrap">
        {TABS.map((t) => {
          const count = BLOOD_REQUESTS.filter(
            (r) => (t === "All" || r.urgency === t) && r.status !== "Fulfilled" && r.status !== "Cancelled"
          ).length;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t}
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No requests" description="No active requests match this filter." />
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const decision = approvals[r.id];
            return (
              <div key={r.id} className={`bg-card rounded-2xl border p-5 transition-all ${
                decision === "approved" ? "border-green-200 dark:border-green-900/50" :
                decision === "rejected" ? "border-muted" : "border-border hover:shadow-sm"
              }`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <BloodTypePill type={r.bloodGroup} size="md" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{r.patientName}</span>
                        <UrgencyBadge urgency={r.urgency} />
                        <RequestStatusBadge status={r.status} />
                        {decision && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            decision === "approved" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                          }`}>
                            {decision === "approved" ? "✓ Approved" : "✗ Rejected"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.units} units · {r.city} · {formatDateTime(r.createdAt)}
                        {r.doctor && ` · ${r.doctor}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block flex-shrink-0">
                    <div className="text-xl font-bold font-mono text-red-600">{r.bloodGroup}</div>
                    <div className="text-xs text-muted-foreground">{r.units} unit{r.units > 1 ? "s" : ""}</div>
                  </div>
                </div>

                {r.diagnosis && (
                  <p className="text-sm text-muted-foreground mb-3 px-1">{r.diagnosis}</p>
                )}
                {r.notes && (
                  <div className="bg-muted/50 rounded-xl px-3 py-2 text-xs text-muted-foreground mb-3">
                    📝 {r.notes}
                  </div>
                )}

                {!decision ? (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setApprovals((p) => ({ ...p, [r.id]: "approved" }))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle size={15} /> Approve Request
                    </button>
                    <button
                      onClick={() => setApprovals((p) => ({ ...p, [r.id]: "rejected" }))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <XCircle size={15} /> Reject
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                      <Phone size={15} /> Call Contact
                    </button>
                  </div>
                ) : (
                  <p className={`text-sm font-medium ${decision === "approved" ? "text-green-600" : "text-muted-foreground"}`}>
                    {decision === "approved" ? "✓ Request approved. Blood units allocated." : "✗ Request rejected."}
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
