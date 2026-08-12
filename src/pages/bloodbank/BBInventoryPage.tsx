import { useState } from "react";
import { Download, RefreshCw, AlertTriangle } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { InventoryStatusBadge, StatusBadge } from "../../components/shared/StatusBadge";
import { BLOOD_INVENTORY } from "../../data/hospitals";
import { COLLECTION_RECORDS } from "../../data/bloodbanks";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_COLOR: Record<string, string> = { good: "#43A047", low: "#F9A825", critical: "#D32F2F" };

export function BBInventoryPage() {
  const [view, setView] = useState<"summary" | "bags">("summary");

  const chartData = BLOOD_INVENTORY.map((i) => ({
    name: i.bloodGroup,
    units: i.units,
    capacity: i.capacity,
    fill: STATUS_COLOR[i.status],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Inventory"
        subtitle="Current stock levels and individual bag tracking"
        breadcrumbs={[{ label: "Blood Bank", path: "/bloodbank/dashboard" }, { label: "Inventory" }]}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground">
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground">
              <Download size={15} /> Export
            </button>
          </div>
        }
      />

      {/* View toggle */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-xl w-fit">
        {(["summary", "bags"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {v === "summary" ? "By Blood Type" : "Individual Bags"}
          </button>
        ))}
      </div>

      {view === "summary" ? (
        <>
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Inventory by Blood Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v) => [`${v} units`, "Stock"]} />
                <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                  {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Blood Group", "Units", "Capacity", "Usage %", "Expiring In", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BLOOD_INVENTORY.map((item) => {
                    const pct = Math.round((item.units / item.capacity) * 100);
                    return (
                      <tr key={item.bloodGroup} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-5"><BloodTypePill type={item.bloodGroup} /></td>
                        <td className="py-4 px-5 font-mono font-semibold text-foreground">{item.units}</td>
                        <td className="py-4 px-5 font-mono text-muted-foreground">{item.capacity}</td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: STATUS_COLOR[item.status] }} />
                            </div>
                            <span className="text-xs font-mono">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`text-xs font-medium ${(item.expiringIn ?? 99) <= 3 ? "text-red-600" : (item.expiringIn ?? 99) <= 7 ? "text-orange-600" : "text-muted-foreground"}`}>
                            {(item.expiringIn ?? 99) <= 3 && <AlertTriangle size={11} className="inline mr-1" />}
                            {item.expiringIn} days
                          </span>
                        </td>
                        <td className="py-4 px-5"><InventoryStatusBadge status={item.status} /></td>
                        <td className="py-4 px-5">
                          <button className="text-xs text-red-600 hover:underline font-medium">Request</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Bag ID", "Donor", "Blood Group", "Component", "Volume", "Collected", "Expiry", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COLLECTION_RECORDS.map((c) => {
                  const expiry = new Date(c.expiryDate);
                  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{c.bagId}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{c.donorName}</td>
                      <td className="py-3 px-4"><BloodTypePill type={c.donorBloodGroup} /></td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{c.component}</td>
                      <td className="py-3 px-4 font-mono text-foreground">{c.volume} ml</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(c.collectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-orange-500" : "text-muted-foreground"}`}>
                          {daysLeft <= 0 ? "Expired" : `${daysLeft}d`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge text={c.status} color={c.status === "Available" ? "#43A047" : c.status === "Issued" ? "#1565C0" : c.status === "Quarantine" ? "#F9A825" : "#D32F2F"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
