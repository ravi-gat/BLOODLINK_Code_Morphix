import { useNavigate } from "react-router";
import {
  Package, Droplets, AlertTriangle, TrendingUp, ArrowRight, Plus,
  Clock, CheckCircle,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { InventoryStatusBadge, StatusBadge } from "../../components/shared/StatusBadge";
import { useAuthStore } from "../../stores/useAuthStore";
import { BLOOD_INVENTORY } from "../../data/hospitals";
import { COLLECTION_RECORDS, DISTRIBUTION_RECORDS } from "../../data/bloodbanks";
import { BLOOD_TYPE_DATA, INVENTORY_TREND_DATA } from "../../data/charts";

const STATUS_COLOR = { good: "#43A047", low: "#F9A825", critical: "#D32F2F" };

export function BloodBankDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const totalStock = BLOOD_INVENTORY.reduce((s, i) => s + i.units, 0);
  const criticalItems = BLOOD_INVENTORY.filter((i) => i.status === "critical");
  const recentCollections = COLLECTION_RECORDS.slice(0, 4);
  const recentDistributions = DISTRIBUTION_RECORDS.slice(0, 3);

  // bags expiring in ≤3 days
  const expiringCount = COLLECTION_RECORDS.filter((c) => {
    const expiry = new Date(c.expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
    return daysLeft <= 3 && c.status === "Available";
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user?.name ?? "Blood Bank"} — Dashboard`}
        subtitle="Real-time blood inventory overview"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <button
            onClick={() => navigate("/bloodbank/collection")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus size={16} /> Record Collection
          </button>
        }
      />

      {/* Critical alert */}
      {criticalItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800 dark:text-red-300 text-sm">Critical Stock Alert</div>
            <div className="text-red-700 dark:text-red-400 text-xs mt-0.5">
              {criticalItems.map((i) => i.bloodGroup).join(", ")} are critically low.{" "}
              {expiringCount > 0 && `${expiringCount} bag${expiringCount > 1 ? "s" : ""} expiring within 3 days. `}
              <button onClick={() => navigate("/bloodbank/expiry")} className="underline font-medium">View expiry tracker</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Stock" value={String(totalStock)} delta="units" color="#E53935" />
        <StatCard icon={Droplets} label="Collections Today" value="5" delta="+2 pending" color="#43A047" />
        <StatCard icon={TrendingUp} label="Distributions Today" value="4" delta="3 hospitals" color="#1565C0" />
        <StatCard icon={AlertTriangle} label="Expiring Soon" value={String(expiringCount)} delta="within 3 days" color="#F9A825" deltaPositive={false} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inventory bars */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Blood Inventory</h3>
            <button onClick={() => navigate("/bloodbank/inventory")} className="text-sm text-red-600 hover:underline flex items-center gap-1 font-medium">
              Full view <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {BLOOD_INVENTORY.map((item) => {
              const pct = Math.round((item.units / item.capacity) * 100);
              const barColor = STATUS_COLOR[item.status];
              return (
                <div key={item.bloodGroup} className="flex items-center gap-4">
                  <BloodTypePill type={item.bloodGroup} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{item.units} / {item.capacity} units</span>
                      <InventoryStatusBadge status={item.status} />
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Stock Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={BLOOD_TYPE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" paddingAngle={2}>
                {BLOOD_TYPE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {BLOOD_TYPE_DATA.map((b) => (
              <div key={b.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                <span className="text-xs text-muted-foreground">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent collections */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Collections</h3>
            <button onClick={() => navigate("/bloodbank/collection")} className="text-sm text-red-600 hover:underline flex items-center gap-1 font-medium">
              All <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {recentCollections.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                <BloodTypePill type={c.donorBloodGroup} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{c.donorName}</div>
                  <div className="text-xs text-muted-foreground">{c.component} · {c.volume} ml</div>
                </div>
                <StatusBadge
                  text={c.status}
                  color={c.status === "Available" ? "#43A047" : c.status === "Issued" ? "#1565C0" : c.status === "Quarantine" ? "#F9A825" : "#D32F2F"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Stock trend */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-red-600" />
            <h3 className="font-semibold text-foreground">5-Day Stock Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={INVENTORY_TREND_DATA}>
              <defs>
                <linearGradient id="bbStock" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E53935" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Area type="monotone" dataKey="stock" stroke="#E53935" strokeWidth={2} fill="url(#bbStock)" name="Total Units" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent distributions */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Distributions</h3>
          <button onClick={() => navigate("/bloodbank/distribution")} className="text-sm text-red-600 hover:underline flex items-center gap-1 font-medium">
            All <ArrowRight size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Hospital", "Blood Group", "Units", "Component", "Issued At", "Status"].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDistributions.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-medium text-foreground">{d.hospital}</td>
                  <td className="py-3 px-3"><BloodTypePill type={d.bloodGroup} /></td>
                  <td className="py-3 px-3 font-mono text-foreground">{d.units}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{d.component}</td>
                  <td className="py-3 px-3 text-xs text-muted-foreground font-mono">
                    {new Date(d.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge text={d.status} color={d.status === "Delivered" ? "#43A047" : d.status === "Issued" ? "#1565C0" : "#F9A825"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
