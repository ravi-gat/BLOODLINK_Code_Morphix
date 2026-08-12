import { useState } from "react";
import { RefreshCw, Download, AlertTriangle } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { InventoryStatusBadge } from "../../components/shared/StatusBadge";
import { BLOOD_INVENTORY } from "../../data/hospitals";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const STATUS_COLOR = { good: "#43A047", low: "#F9A825", critical: "#D32F2F" };

export function BloodInventoryPage() {
  const [lastUpdated] = useState("2 min ago");

  const chartData = BLOOD_INVENTORY.map((i) => ({
    name: i.bloodGroup,
    units: i.units,
    capacity: i.capacity,
    fill: STATUS_COLOR[i.status],
  }));

  const totalUnits = BLOOD_INVENTORY.reduce((s, i) => s + i.units, 0);
  const criticalCount = BLOOD_INVENTORY.filter((i) => i.status === "critical").length;
  const lowCount = BLOOD_INVENTORY.filter((i) => i.status === "low").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Inventory"
        subtitle={`Last updated ${lastUpdated}`}
        breadcrumbs={[{ label: "Hospital", path: "/hospital/dashboard" }, { label: "Blood Inventory" }]}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
              <Download size={15} /> Export
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <div className="text-2xl font-bold font-mono text-foreground">{totalUnits}</div>
          <div className="text-sm text-muted-foreground mt-0.5">Total Units</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-900/50 p-4 text-center">
          <div className="text-2xl font-bold font-mono text-orange-600">{lowCount}</div>
          <div className="text-sm text-orange-600 mt-0.5">Low Stock Types</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-900/50 p-4 text-center">
          <div className="text-2xl font-bold font-mono text-red-600">{criticalCount}</div>
          <div className="text-sm text-red-600 mt-0.5">Critical Types</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Inventory Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v) => [`${v} units`, "Stock"]} />
            <Bar dataKey="units" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Detailed Inventory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Blood Group", "Units Available", "Capacity", "Usage %", "Expiring In", "Status"].map((h) => (
                  <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_INVENTORY.map((item) => {
                const pct = Math.round((item.units / item.capacity) * 100);
                const barColor = STATUS_COLOR[item.status];
                return (
                  <tr key={item.bloodGroup} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-5"><BloodTypePill type={item.bloodGroup} /></td>
                    <td className="py-4 px-5 font-mono font-semibold text-foreground">{item.units}</td>
                    <td className="py-4 px-5 text-muted-foreground font-mono">{item.capacity}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {item.expiringIn !== undefined && (
                        <span className={`text-xs font-medium ${item.expiringIn <= 3 ? "text-red-600" : item.expiringIn <= 7 ? "text-orange-600" : "text-muted-foreground"}`}>
                          {item.expiringIn <= 3 && <AlertTriangle size={11} className="inline mr-1" />}
                          {item.expiringIn} days
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5"><InventoryStatusBadge status={item.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
