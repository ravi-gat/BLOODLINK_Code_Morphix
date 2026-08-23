import React, { useMemo } from "react";
import { TrendingUp, BarChart2, PieChart as PieIcon, Heart, Droplets, Clock, CheckCircle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useApi } from "../../hooks/useApi";
import { hospitalApi } from "../../services/api";

const BLOOD_COLORS: Record<string, string> = {
  "O+": "#E53935", "O-": "#7C3AED", "A+": "#1565C0", "A-": "#0891B2",
  "B+": "#43A047", "B-": "#DB2777", "AB+": "#F9A825", "AB-": "#EA580C",
};

export function AnalyticsPage() {
  const { data: analyticsResp, isLoading: analyticsLoading } = useApi(() => hospitalApi.getAnalytics());
  const { data: inventory, isLoading: invLoading } = useApi(() => hospitalApi.getInventory());
  const { data: requests, isLoading: reqLoading } = useApi(() => hospitalApi.getRequests());

  const analytics = (analyticsResp as { data?: {
    total_requests: number;
    completed_requests: number;
    pending_requests: number;
    fulfillment_rate: number;
    blood_group_distribution: { blood_group: string; count: number }[];
  } } | null)?.data;

  // Monthly requests & inventory distribution
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIdx = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(currentMonthIdx - 5 + i);
      return { month: months[d.getMonth()], year: d.getFullYear(), monthIdx: d.getMonth(), donations: 0, requests: 0 };
    });

    (requests || []).forEach((req) => {
      if (!req.created_at) return;
      const reqDate = new Date(req.created_at);
      const m = reqDate.getMonth();
      const y = reqDate.getFullYear();
      const found = last6Months.find((item) => item.monthIdx === m && item.year === y);
      if (found) {
        found.requests += 1;
        if (req.status === "COMPLETED") {
          found.donations += 1;
        }
      }
    });

    return last6Months.map((item) => ({
      month: item.month,
      requests: item.requests,
      donations: item.donations,
    }));
  }, [requests]);

  // Blood type distribution from inventory or requests
  const bloodTypeData = useMemo(() => {
    if (analytics?.blood_group_distribution && analytics.blood_group_distribution.length > 0) {
      const total = analytics.blood_group_distribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
      return analytics.blood_group_distribution.map((b) => ({
        name: b.blood_group,
        value: b.count,
        percentage: Math.round((b.count / total) * 100),
        color: BLOOD_COLORS[b.blood_group] || "#E53935",
      }));
    }

    if (inventory && inventory.length > 0) {
      const totalUnits = inventory.reduce((acc, curr) => acc + curr.units_available, 0) || 1;
      return inventory.map((item) => ({
        name: item.blood_group,
        value: item.units_available,
        percentage: Math.round((item.units_available / totalUnits) * 100),
        color: BLOOD_COLORS[item.blood_group] || "#E53935",
      }));
    }

    return [];
  }, [analytics, inventory]);

  // Inventory vs Reserved summary
  const inventoryComparison = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];
    return inventory.map((i) => ({
      name: i.blood_group,
      available: i.units_available,
      reserved: (i as any).units_reserved || 0,
    }));
  }, [inventory]);

  if (analyticsLoading && invLoading && reqLoading) {
    return <LoadingSkeleton.SkeletonPage />;
  }

  const totalUnits = inventory?.reduce((acc, curr) => acc + curr.units_available, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Resource Metrics"
        subtitle="Live blood inventory, requisition trends, and fulfillment metrics"
        breadcrumbs={[{ label: "Hospital", path: "/hospital/dashboard" }, { label: "Analytics" }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplets} label="In-Stock Units" value={String(totalUnits)} color="#E53935" />
        <StatCard icon={Heart} label="Fulfilled Requisitions" value={String(analytics?.completed_requests ?? 0)} color="#43A047" />
        <StatCard icon={Clock} label="Pending Requests" value={String(analytics?.pending_requests ?? 0)} color="#1565C0" />
        <StatCard icon={CheckCircle} label="Fulfillment Rate" value={`${analytics?.fulfillment_rate ?? 0}%`} color="#7C3AED" />
      </div>

      {/* Monthly trend */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-red-600" />
          <h3 className="font-semibold text-foreground">Monthly Donations vs Requests</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="anDon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E53935" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="anReq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
            <Legend />
            <Area type="monotone" dataKey="donations" stroke="#E53935" strokeWidth={2} fill="url(#anDon)" name="Fulfilled" />
            <Area type="monotone" dataKey="requests" stroke="#1565C0" strokeWidth={2} fill="url(#anReq)" name="Requisitions" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Blood type distribution */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Blood Type Distribution</h3>
          </div>
          {bloodTypeData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No stock data available yet.</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={bloodTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                    {bloodTypeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} units`} contentStyle={{ borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
                {bloodTypeData.map((b) => (
                  <div key={b.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    <span className="text-xs text-muted-foreground truncate">{b.name} <span className="font-semibold text-foreground">{b.value} u</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hospital usage comparison */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Inventory Units by Group</h3>
          </div>
          {inventoryComparison.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No inventory units recorded.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={inventoryComparison} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="available" fill="#E53935" radius={[4, 4, 0, 0]} name="Available Units" />
                <Bar dataKey="reserved" fill="#43A047" radius={[4, 4, 0, 0]} name="Reserved" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
