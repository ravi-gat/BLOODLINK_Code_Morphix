import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Droplets, AlertTriangle, ArrowRight, Plus, TrendingUp,
  CheckCircle, Clock,
} from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { UrgencyBadge, InventoryStatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useAuthStore } from "../../stores/useAuthStore";
import { useApi } from "../../hooks/useApi";
import { hospitalApi, ApiError } from "../../services/api";
import type { BloodGroup, UrgencyLevel } from "../../types";

export function HospitalDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: profile } = useApi(() => hospitalApi.getProfile());
  const { data: inventory, isLoading: invLoading } = useApi(() => hospitalApi.getInventory());
  const { data: requests, isLoading: reqLoading, refetch: refetchRequests } = useApi(
    () => hospitalApi.getRequests()
  );
  const { data: analytics } = useApi(() => hospitalApi.getAnalytics());

  const activeReqs = requests?.filter(
    (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED"
  ) ?? [];
  const analyticsData = (analytics as { data?: { total_requests: number; completed_requests: number; pending_requests: number; fulfillment_rate: number } } | null)?.data;

  const lowStockItems = inventory?.filter((i) => i.units_available < 5) ?? [];

  const handleApprove = async (id: string) => {
    try {
      await hospitalApi.approveRequest(id);
      toast.success("Request approved and set to In Progress.");
      refetchRequests();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to approve request.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await hospitalApi.rejectRequest(id);
      toast.info("Request rejected.");
      refetchRequests();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to reject request.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.hospital_name ?? user?.name ?? "Hospital"}`}
        subtitle="Hospital management overview"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <button
            onClick={() => navigate("/hospital/inventory")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus size={16} /> Manage Inventory
          </button>
        }
      />

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-orange-600 flex-shrink-0" />
          <p className="text-sm text-orange-700 dark:text-orange-300">
            <strong>Low stock alert:</strong>{" "}
            {lowStockItems.map((i) => `${i.blood_group} (${i.units_available} units)`).join(", ")} — consider restocking.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Active Requests" value={String(analyticsData?.pending_requests ?? activeReqs.length)} color="#E53935" />
        <StatCard icon={CheckCircle} label="Completed" value={String(analyticsData?.completed_requests ?? 0)} color="#43A047" />
        <StatCard icon={Clock} label="Total Requests" value={String(analyticsData?.total_requests ?? 0)} color="#1565C0" />
        <StatCard icon={TrendingUp} label="Fulfillment Rate" value={`${analyticsData?.fulfillment_rate ?? 0}%`} color="#F9A825" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Blood inventory */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Blood Inventory</h3>
            <button onClick={() => navigate("/hospital/inventory")} className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1">
              Manage <ArrowRight size={13} />
            </button>
          </div>
          {invLoading ? (
            <LoadingSkeleton.SkeletonCard />
          ) : inventory?.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No inventory recorded yet.</p>
              <button onClick={() => navigate("/hospital/inventory")} className="text-sm text-red-600 underline">
                Add inventory
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(inventory ?? []).slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                  <BloodTypePill type={item.blood_group as BloodGroup} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{item.component_type}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.expiry_date ? `Expires: ${item.expiry_date}` : "No expiry set"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-foreground">{item.units_available}</div>
                    <InventoryStatusBadge
                      status={item.units_available >= 10 ? "good" : item.units_available >= 5 ? "low" : "critical"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent requests */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Requests</h3>
            <button onClick={() => navigate("/hospital/emergency")} className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight size={13} />
            </button>
          </div>
          {reqLoading ? (
            <LoadingSkeleton.SkeletonCard />
          ) : activeReqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active requests.</p>
          ) : (
            <div className="space-y-3">
              {activeReqs.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <BloodTypePill type={r.blood_group as BloodGroup} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">
                      {r.patient_name || "Patient"}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.units_required} units</div>
                  </div>
                  <UrgencyBadge urgency={r.urgency as UrgencyLevel} />
                  {r.status === "PENDING" || r.status === "MATCHING" || r.status === "DONOR_FOUND" ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground capitalize">{r.status.toLowerCase()}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
