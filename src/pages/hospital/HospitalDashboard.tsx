import { useNavigate } from "react-router";
import {
  Droplets, Users, AlertTriangle, Calendar, ArrowRight, Plus, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { UrgencyBadge, InventoryStatusBadge } from "../../components/shared/StatusBadge";
import { useAuthStore } from "../../stores/useAuthStore";
import { BLOOD_INVENTORY, APPOINTMENTS } from "../../data/hospitals";
import { BLOOD_REQUESTS } from "../../data/requests";
import { MONTHLY_DATA } from "../../data/charts";

export function HospitalDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const emergencyReqs = BLOOD_REQUESTS.filter(
    (r) => r.urgency === "Critical" || r.urgency === "High"
  ).slice(0, 4);
  const todayApts = APPOINTMENTS.filter((a) => a.status === "Scheduled").slice(0, 3);
  const lowStockItems = BLOOD_INVENTORY.filter((i) => i.status !== "good");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user?.name ?? "Hospital"} — Dashboard`}
        subtitle="Last updated 2 minutes ago"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <button
            onClick={() => navigate("/hospital/emergency")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus size={16} /> New Request
          </button>
        }
      />

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-orange-800 dark:text-orange-300 text-sm">Low Stock Alert</div>
            <div className="text-orange-700 dark:text-orange-400 text-xs mt-0.5">
              {lowStockItems.filter(i => i.status === "critical").length} blood types critically low ·{" "}
              {lowStockItems.filter(i => i.status === "low").length} blood types low.{" "}
              <button onClick={() => navigate("/hospital/inventory")} className="underline font-medium">View inventory</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplets} label="Available Blood Units" value="76" delta="Total stock" color="#E53935" />
        <StatCard icon={Users} label="Patients Waiting" value="18" delta="3 critical" color="#1565C0" deltaPositive={false} />
        <StatCard icon={AlertTriangle} label="Emergency Requests" value="5" delta="Active" color="#D32F2F" deltaPositive={false} />
        <StatCard icon={Calendar} label="Today's Appointments" value="23" delta="Donation camp" color="#43A047" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inventory */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Blood Inventory Status</h3>
            <button onClick={() => navigate("/hospital/inventory")} className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1">
              Full view <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {BLOOD_INVENTORY.map((item) => {
              const pct = Math.round((item.units / item.capacity) * 100);
              const barColor = item.status === "good" ? "#43A047" : item.status === "low" ? "#F9A825" : "#D32F2F";
              return (
                <div key={item.bloodGroup} className="flex items-center gap-4">
                  <BloodTypePill type={item.bloodGroup} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{item.units} / {item.capacity} units</span>
                      <InventoryStatusBadge status={item.status} />
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency requests */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Emergency Requests</h3>
            <button onClick={() => navigate("/hospital/emergency")} className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1">
              All <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {emergencyReqs.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground text-sm truncate">{r.patientName}</span>
                  <UrgencyBadge urgency={r.urgency} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BloodTypePill type={r.bloodGroup} />
                    <span className="text-xs text-muted-foreground">{r.units} units</span>
                  </div>
                  <button className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors">
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart + Appointments */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-red-600" />
            <h3 className="font-semibold text-foreground">Blood Usage — Last 8 Months</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_DATA}>
              <defs>
                <linearGradient id="hColDon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E53935" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hColReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="donations" stroke="#E53935" strokeWidth={2} fill="url(#hColDon)" name="Donations" />
              <Area type="monotone" dataKey="requests" stroke="#1565C0" strokeWidth={2} fill="url(#hColReq)" name="Requests" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Today's Appointments</h3>
            <button onClick={() => navigate("/hospital/appointments")} className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1">
              All <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {todayApts.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <BloodTypePill type={a.donorBloodGroup} />
                  <span className="font-medium text-foreground text-sm truncate flex-1">{a.donorName}</span>
                </div>
                <div className="text-xs text-muted-foreground">{a.time} · {a.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
