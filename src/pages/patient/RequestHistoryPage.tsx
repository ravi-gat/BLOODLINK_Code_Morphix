import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { UrgencyBadge, RequestStatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useApi } from "../../hooks/useApi";
import { patientApi } from "../../services/api";
import { formatDateTime } from "../../utils/date";
import type { BloodGroup, UrgencyLevel, RequestStatus } from "../../types";

const STATUS_FILTERS = ["All", "PENDING", "MATCHING", "DONOR_FOUND", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export function RequestHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data: requests, isLoading, error } = useApi(() => patientApi.getMyRequests());

  const filtered = (requests ?? []).filter((r) => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.hospital_name?.toLowerCase().includes(q) &&
        !r.patient_name?.toLowerCase().includes(q) &&
        !r.city.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Request History"
        subtitle="Track all your blood requests and their status"
        breadcrumbs={[{ label: "Patient", path: "/patient/dashboard" }, { label: "Request History" }]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hospital or patient..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-red-600 text-white"
                  : "bg-card border border-border text-muted-foreground hover:border-red-300 hover:text-red-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingSkeleton.SkeletonPage />}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title="No requests found"
          description="Try adjusting your search or status filter."
          action={{ label: "Clear Filters", onClick: () => { setSearch(""); setStatusFilter("All"); } }}
        />
      )}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Request ID", "Patient", "Blood", "Units", "Hospital", "Urgency", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        {req.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-foreground">{req.patient_name ?? "—"}</div>
                      {req.medical_notes && <div className="text-xs text-muted-foreground truncate max-w-[140px]">{req.medical_notes}</div>}
                    </td>
                    <td className="py-3.5 px-4"><BloodTypePill type={req.blood_group as BloodGroup} /></td>
                    <td className="py-3.5 px-4 font-mono text-foreground">{req.units_required}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-foreground">{req.hospital_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{req.city}</div>
                    </td>
                    <td className="py-3.5 px-4"><UrgencyBadge urgency={req.urgency as UrgencyLevel} /></td>
                    <td className="py-3.5 px-4"><RequestStatusBadge status={req.status as RequestStatus} /></td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {formatDateTime(req.created_at)}
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
