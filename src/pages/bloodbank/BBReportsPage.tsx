import { FileText, Download, TrendingUp } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { CheckCircle, Package, Droplets } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { WEEKLY_DATA } from "../../data/charts";

const MONTHLY_SUMMARY = [
  { month: "May", collected: 198, distributed: 185, expired: 4, wastage: "2.0%" },
  { month: "Jun", collected: 214, distributed: 198, expired: 7, wastage: "3.3%" },
  { month: "Jul", collected: 241, distributed: 228, expired: 5, wastage: "2.1%" },
  { month: "Aug", collected: 175, distributed: 162, expired: 3, wastage: "1.7%" },
];

export function BBReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Monthly performance summaries and analytics"
        breadcrumbs={[{ label: "Blood Bank", path: "/bloodbank/dashboard" }, { label: "Reports" }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
            <Download size={16} /> Export Report
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplets} label="This Month Collected" value="175" delta="+8% vs last" color="#E53935" />
        <StatCard icon={Package} label="Distributed" value="162" delta="92.6% utilised" color="#1565C0" />
        <StatCard icon={CheckCircle} label="Wastage Rate" value="1.7%" delta="-0.4% vs last" color="#43A047" />
        <StatCard icon={TrendingUp} label="Avg. Response Time" value="14 min" delta="to hospital" color="#7C3AED" />
      </div>

      {/* Weekly bar chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Weekly Collection vs Distribution vs Expired</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={WEEKLY_DATA} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
            <Legend />
            <Bar dataKey="collections" fill="#E53935" radius={[4, 4, 0, 0]} name="Collected" />
            <Bar dataKey="distributions" fill="#43A047" radius={[4, 4, 0, 0]} name="Distributed" />
            <Bar dataKey="expired" fill="#F9A825" radius={[4, 4, 0, 0]} name="Expired" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly summary table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Monthly Summary</h3>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Download size={14} /> CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Month", "Collected", "Distributed", "Expired", "Wastage %"].map((h) => (
                  <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHLY_SUMMARY.map((row) => (
                <tr key={row.month} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-foreground">{row.month} 2024</td>
                  <td className="py-3.5 px-5 font-mono text-foreground">{row.collected}</td>
                  <td className="py-3.5 px-5 font-mono text-foreground">{row.distributed}</td>
                  <td className="py-3.5 px-5 font-mono text-foreground">{row.expired}</td>
                  <td className="py-3.5 px-5">
                    <StatusBadge
                      text={row.wastage}
                      color={parseFloat(row.wastage) > 3 ? "#D32F2F" : parseFloat(row.wastage) > 2 ? "#F9A825" : "#43A047"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick download tiles */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { title: "July 2024 Full Report", size: "2.4 MB", type: "PDF" },
          { title: "Q2 2024 Summary", size: "1.1 MB", type: "PDF" },
          { title: "FY 2023–24 Annual Report", size: "5.8 MB", type: "PDF" },
        ].map((r) => (
          <div key={r.title} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <FileText size={18} className="text-red-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.type} · {r.size}</div>
              </div>
            </div>
            <button className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
              <Download size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
