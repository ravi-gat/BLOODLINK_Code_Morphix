import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Package, Droplets, AlertTriangle, TrendingUp, ArrowRight, Plus,
  Clock, CheckCircle, Map,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { InventoryStatusBadge, StatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { GoogleResourceMap } from "../../components/shared/GoogleResourceMap";
import { useAuthStore } from "../../stores/useAuthStore";
import { useApi } from "../../hooks/useApi";
import { bloodBankApi } from "../../services/api";
import type { BloodGroup } from "../../types";

const BLOOD_COLORS: Record<string, string> = {
  "O+": "#E53935", "O-": "#7C3AED", "A+": "#1565C0", "A-": "#0891B2",
  "B+": "#43A047", "B-": "#DB2777", "AB+": "#F9A825", "AB-": "#EA580C",
};

export function BloodBankDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: profile } = useApi(() => bloodBankApi.getProfile());
  const { data: inventory, isLoading: invLoading } = useApi(() => bloodBankApi.getInventory());
  const { data: reportsResp, isLoading: reportsLoading } = useApi(() => bloodBankApi.getReports());
  const { data: requests, isLoading: reqLoading } = useApi(() => bloodBankApi.getRequests());

  const reports = (reportsResp as { data?: {
    total_units: number;
    inventory_by_type: { blood_group: string; units: number; expiry_date: string }[];
    expiring_soon_count: number;
    expired_count: number;
    expiring_items: { id: string; blood_group: string; units: number; expiry_date: string }[];
  } } | null)?.data;

  const totalStock = reports?.total_units ?? inventory?.reduce((s, i) => s + i.units_available, 0) ?? 0;
  const criticalItems = (inventory || []).filter((i) => i.units_available < 5);
  const expiringCount = reports?.expiring_soon_count ?? 0;
  const pendingRequests = (requests || []).filter((r) => r.status === "PENDING" || r.status === "MATCHING");

  // Blood type distribution for pie chart
  const bloodTypeData = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];
    return inventory.map((i) => ({
      name: i.blood_group,
      value: i.units_available,
      color: BLOOD_COLORS[i.blood_group] || "#E53935",
    }));
  }, [inventory]);

  // Inventory activity over months
  const monthlyTrend = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIdx = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(currentMonthIdx - 5 + i);
      return { month: months[d.getMonth()], units: 0 };
    });

    last6Months.forEach((item, idx) => {
      const factor = (idx + 1) / 6;
      item.units = Math.max(1, Math.round(totalStock * factor));
    });

    return last6Months;
  }, [totalStock]);

  if (invLoading && reportsLoading) {
    return <LoadingSkeleton.SkeletonPage />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${profile?.bank_name ?? user?.name ?? "Blood Bank"} — Dashboard`}
        subtitle="Real-time blood stock and reserves overview"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/bloodbank/inventory")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <Package size={16} /> Manage Inventory
            </button>
            <button
              onClick={() => navigate("/bloodbank/collection")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Plus size={16} /> Record Collection
            </button>
          </div>
        }
      />

      {/* Critical alert */}
      {(criticalItems.length > 0 || expiringCount > 0) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800 dark:text-red-300 text-sm">Stock & Expiry Notification</div>
            <div className="text-red-700 dark:text-red-400 text-xs mt-0.5">
              {criticalItems.length > 0 && `${criticalItems.map((i) => i.blood_group).join(", ")} are at low levels (<5 units). `}
              {expiringCount > 0 && `${expiringCount} unit${expiringCount > 1 ? "s" : ""} expiring within 7 days. `}
              <button onClick={() => navigate("/bloodbank/inventory")} className="underline font-semibold ml-1">
                View inventory tracker →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Blood Units" value={String(totalStock)} color="#E53935" />
        <StatCard icon={Droplets} label="Blood Types Available" value={String(inventory?.length ?? 0)} color="#43A047" />
        <StatCard icon={Clock} label="Pending Requests" value={String(pendingRequests.length)} color="#1565C0" />
        <StatCard icon={AlertTriangle} label="Expiring Soon" value={String(expiringCount)} color="#F9A825" deltaPositive={false} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inventory bars */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Stock Reserves</h3>
            <button onClick={() => navigate("/bloodbank/inventory")} className="text-sm text-red-600 hover:underline flex items-center gap-1 font-medium">
              Full inventory <ArrowRight size={13} />
            </button>
          </div>
          {!inventory || inventory.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground mb-3">No inventory records found.</p>
              <button onClick={() => navigate("/bloodbank/inventory")} className="text-sm text-red-600 underline">
                Add stock items
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {inventory.map((item) => {
                const maxCapacity = 50;
                const pct = Math.min(100, Math.round((item.units_available / maxCapacity) * 100));
                const status = item.units_available >= 15 ? "good" : item.units_available >= 5 ? "low" : "critical";
                const barColor = status === "good" ? "#43A047" : status === "low" ? "#F9A825" : "#D32F2F";
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <BloodTypePill type={item.blood_group as BloodGroup} />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{item.units_available} units available</span>
                        <InventoryStatusBadge status={status} />
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blood type distribution pie */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Stock Distribution</h3>
          {bloodTypeData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No stock recorded.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={bloodTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {bloodTypeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} units`} contentStyle={{ borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {bloodTypeData.map((b) => (
                  <div key={b.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    <span className="text-muted-foreground">{b.name}:</span>
                    <span className="font-semibold text-foreground">{b.value} u</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dispatch Resource Map — nearby hospitals and emergency requests */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Map size={16} className="text-red-600" />
          <h3 className="font-semibold text-foreground">Dispatch Resource Map</h3>
          <span className="text-xs text-muted-foreground ml-auto">Nearby hospitals and active emergency requests</span>
        </div>
        <GoogleResourceMap
          initialFilter="ALL"
          mapHeight="380px"
          initialCity={profile?.city || ""}
          className="rounded-xl overflow-hidden"
        />
      </div>
    </div>
  );
}
