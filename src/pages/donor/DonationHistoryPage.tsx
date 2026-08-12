import { Award, Droplets, Download } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { StatCard } from "../../components/shared/StatCard";
import { DONATION_HISTORY } from "../../data/donors";
import { Heart, CheckCircle, Calendar, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const YEARLY = [
  { year: "2020", donations: 2 },
  { year: "2021", donations: 1 },
  { year: "2022", donations: 3 },
  { year: "2023", donations: 4 },
  { year: "2024", donations: 2 },
];

export function DonationHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation History"
        subtitle="Your complete donation record"
        breadcrumbs={[{ label: "Donor", path: "/donor/dashboard" }, { label: "Donation History" }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplets} label="Total Donations" value="12" delta="+2 this year" color="#E53935" />
        <StatCard icon={Heart} label="Lives Saved" value="12" color="#43A047" />
        <StatCard icon={Award} label="Points Earned" value="820" color="#F9A825" />
        <StatCard icon={CheckCircle} label="Completion Rate" value="100%" color="#1565C0" />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Donations Per Year</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={YEARLY} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
            <Bar dataKey="donations" fill="#E53935" radius={[6, 6, 0, 0]} name="Donations" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">All Donations</h3>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Date", "Hospital", "Type", "Units", "Points", "Status"].map((h) => (
                  <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DONATION_HISTORY.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">{d.date}</td>
                  <td className="py-3.5 px-5 font-medium text-foreground">{d.hospital}</td>
                  <td className="py-3.5 px-5">
                    <StatusBadge text={d.type} color="#1565C0" />
                  </td>
                  <td className="py-3.5 px-5 text-foreground font-mono">{d.units}</td>
                  <td className="py-3.5 px-5">
                    <span className="font-mono font-semibold text-yellow-600">+{d.rewardEarned}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusBadge text={d.status} color="#43A047" />
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
