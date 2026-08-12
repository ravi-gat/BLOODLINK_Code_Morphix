import { FileText, Download, TrendingUp, BarChart2 } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { CheckCircle, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { MONTHLY_DATA } from "../../data/charts";

const REPORTS = [
  { title: "Platform Monthly Report — Jul 2024", desc: "Full activity, donor growth, request stats", size: "4.2 MB", type: "PDF", date: "Aug 1, 2024" },
  { title: "Q2 2024 — Platform Summary", desc: "Quarterly performance and KPI report", size: "2.8 MB", type: "PDF", date: "Jul 1, 2024" },
  { title: "Emergency Response Analysis — Jun 2024", desc: "Response times, match rates, outcomes", size: "1.5 MB", type: "PDF", date: "Jul 5, 2024" },
  { title: "Blood Bank Inventory Audit — Jul 2024", desc: "All blood banks stock, wastage, distribution", size: "3.1 MB", type: "PDF", date: "Aug 1, 2024" },
  { title: "Donor Retention Report — H1 2024", desc: "Donation frequency, dropout analysis", size: "2.2 MB", type: "PDF", date: "Jul 15, 2024" },
  { title: "FY 2023–24 Annual Report", desc: "Full fiscal year platform summary", size: "9.4 MB", type: "PDF", date: "Apr 30, 2024" },
];

export function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Platform-wide analytics reports and data exports"
        breadcrumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Reports" }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
            <Download size={16} /> Generate Report
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Donations" value="5,230" delta="+8% MoM" color="#E53935" />
        <StatCard icon={TrendingUp} label="Requests Fulfilled" value="4,980" delta="95.2% rate" color="#43A047" />
        <StatCard icon={CheckCircle} label="New Users (Jul)" value="2,841" delta="+9.4% MoM" color="#1565C0" />
        <StatCard icon={BarChart2} label="Platform Uptime" value="99.97%" delta="Last 30 days" color="#7C3AED" />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">8-Month Platform Activity</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY_DATA} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} />
            <Legend />
            <Bar dataKey="donations" fill="#E53935" radius={[5, 5, 0, 0]} name="Donations" />
            <Bar dataKey="requests" fill="#1565C0" radius={[5, 5, 0, 0]} name="Requests" />
            <Bar dataKey="fulfilled" fill="#43A047" radius={[5, 5, 0, 0]} name="Fulfilled" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Report library */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Report Library</h3>
        </div>
        <div className="divide-y divide-border">
          {REPORTS.map((r) => (
            <div key={r.title} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{r.type} · {r.size} · {r.date}</div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0">
                <Download size={14} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
