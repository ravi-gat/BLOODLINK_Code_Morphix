import { TrendingUp, BarChart2, PieChart as PieIcon } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { Heart, Droplets, Users, CheckCircle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { MONTHLY_DATA, BLOOD_TYPE_DATA, HOSPITAL_USAGE_DATA } from "../../data/charts";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Blood usage, donation trends, and performance metrics"
        breadcrumbs={[{ label: "Hospital", path: "/hospital/dashboard" }, { label: "Analytics" }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplets} label="Total Blood Used" value="1,240" delta="+12% MoM" color="#E53935" />
        <StatCard icon={Heart} label="Donations Received" value="680" delta="+8% MoM" color="#43A047" />
        <StatCard icon={Users} label="Unique Donors" value="312" delta="+18 new" color="#1565C0" />
        <StatCard icon={CheckCircle} label="Fulfilment Rate" value="97.2%" delta="+1.4%" color="#7C3AED" />
      </div>

      {/* Monthly trend */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-red-600" />
          <h3 className="font-semibold text-foreground">Monthly Donations vs Requests</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHLY_DATA}>
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
            <Area type="monotone" dataKey="donations" stroke="#E53935" strokeWidth={2} fill="url(#anDon)" name="Donations" />
            <Area type="monotone" dataKey="requests" stroke="#1565C0" strokeWidth={2} fill="url(#anReq)" name="Requests" />
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
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={BLOOD_TYPE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                  {BLOOD_TYPE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {BLOOD_TYPE_DATA.map((b) => (
                <div key={b.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                  <span className="text-xs text-muted-foreground">{b.name} <span className="font-semibold text-foreground">{b.value}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hospital usage comparison */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Requests vs Fulfilled</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={HOSPITAL_USAGE_DATA} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="requests" fill="#E53935" radius={[4, 4, 0, 0]} name="Requests" />
              <Bar dataKey="fulfilled" fill="#43A047" radius={[4, 4, 0, 0]} name="Fulfilled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
