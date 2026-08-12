import { TrendingUp, BarChart2, Activity, Zap } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  MONTHLY_DATA, BLOOD_TYPE_DATA, DONOR_GROWTH_DATA, HOSPITAL_USAGE_DATA,
} from "../../data/charts";
import { Heart, Users, CheckCircle, Droplets } from "lucide-react";

export function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Platform-wide performance metrics and AI insights"
        breadcrumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Analytics" }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="User Growth (MoM)" value="+9.4%" delta="vs last month" color="#1565C0" />
        <StatCard icon={Heart} label="Donation Rate" value="97.2%" delta="+1.4% MoM" color="#E53935" />
        <StatCard icon={CheckCircle} label="Fulfilment Rate" value="94.8%" delta="+0.8% MoM" color="#43A047" />
        <StatCard icon={Zap} label="Avg. Match Time" value="8 min" delta="-1 min MoM" color="#F9A825" />
      </div>

      {/* Donor + User growth */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-red-600" />
          <h3 className="font-semibold text-foreground">User & Donor Growth</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={DONOR_GROWTH_DATA}>
            <defs>
              <linearGradient id="adDon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E53935" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="adPat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} />
            <Legend />
            <Area type="monotone" dataKey="donors" stroke="#E53935" strokeWidth={2} fill="url(#adDon)" name="Donors" />
            <Area type="monotone" dataKey="patients" stroke="#1565C0" strokeWidth={2} fill="url(#adPat)" name="Patients" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hospital usage */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Top Hospitals by Request Volume</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={HOSPITAL_USAGE_DATA} barSize={16}>
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

        {/* Blood type distribution */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Droplets size={16} className="text-red-600" />
            <h3 className="font-semibold text-foreground">Blood Type Demand Distribution</h3>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie data={BLOOD_TYPE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {BLOOD_TYPE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-3">
              {BLOOD_TYPE_DATA.map((b) => (
                <div key={b.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                  <span className="text-xs text-muted-foreground">{b.name}</span>
                  <span className="text-xs font-bold text-foreground ml-auto">{b.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI insights */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-green-400" />
          <h3 className="font-semibold">AI Platform Insights</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Match Accuracy", value: "98.3%", icon: "🎯" },
            { label: "Avg. Response Time", value: "8 min", icon: "⚡" },
            { label: "AI Matches Made", value: "48,310", icon: "🤖" },
            { label: "Model Last Trained", value: "Today 1:00 AM", icon: "🔬" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-extrabold font-mono text-white">{s.value}</div>
              <div className="text-blue-200 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
