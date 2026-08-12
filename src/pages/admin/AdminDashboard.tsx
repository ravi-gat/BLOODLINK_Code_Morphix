import { useNavigate } from "react-router";
import {
  Users, Heart, Building2, Droplets, AlertTriangle, TrendingUp,
  ArrowRight, Settings, FileText, CheckCircle, Activity,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { Avatar } from "../../components/shared/Avatar";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { RoleBadge, StatusBadge, UrgencyBadge } from "../../components/shared/StatusBadge";
import { MONTHLY_DATA, BLOOD_TYPE_DATA } from "../../data/charts";
import { BLOOD_REQUESTS } from "../../data/requests";
import { DONORS } from "../../data/donors";
import { HOSPITALS } from "../../data/hospitals";

const KPI = [
  { label: "Total Users", value: "2,84,310", color: "#E53935" },
  { label: "Active Donors", value: "1,24,850", color: "#1565C0" },
  { label: "Hospitals", value: "847", color: "#43A047" },
  { label: "Blood Banks", value: "312", color: "#F9A825" },
  { label: "Active Requests", value: "284", color: "#7C3AED" },
  { label: "Lives Saved", value: "48,310", color: "#DB2777" },
];

const ACTIVITY_LOG = [
  { text: "Emergency O- request fulfilled at AIIMS Delhi", time: "2 min ago", type: "success" },
  { text: "New hospital registered: Sunshine Multispecialty", time: "14 min ago", type: "info" },
  { text: "Low stock alert: AB- < 20% at Fortis Gurugram", time: "28 min ago", type: "warning" },
  { text: "AI model retrained with 1,200 new match outcomes", time: "1 hr ago", type: "info" },
  { text: "Suspicious login attempt blocked for admin account", time: "3 hr ago", type: "error" },
];

const LOG_COLOR: Record<string, string> = {
  success: "bg-green-500", info: "bg-blue-500", warning: "bg-yellow-500", error: "bg-red-500",
};

const PENDING_HOSPITALS = HOSPITALS.filter((h) => h.status === "Pending");

const RECENT_USERS = [
  { name: "Priya Sharma", role: "donor", blood: "A+", city: "Mumbai", joined: "Aug 4, 2024", status: "Verified" },
  { name: "Amit Verma", role: "patient", blood: "B+", city: "Pune", joined: "Aug 4, 2024", status: "Pending" },
  { name: "Dr. Neha Gupta", role: "hospital", blood: "", city: "Hyderabad", joined: "Aug 3, 2024", status: "Verified" },
  { name: "Ravi Shankar", role: "donor", blood: "O-", city: "Chennai", joined: "Aug 3, 2024", status: "Verified" },
  { name: "Sneha Pillai", role: "bloodbank", blood: "", city: "Bengaluru", joined: "Aug 2, 2024", status: "Under Review" },
  { name: "Kunal Joshi", role: "donor", blood: "AB+", city: "Delhi", joined: "Aug 2, 2024", status: "Verified" },
];

const STATUS_BADGE_COLOR: Record<string, string> = {
  Verified: "#43A047", Pending: "#F9A825", "Under Review": "#1565C0",
};

export function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Center"
        subtitle="BloodLink Platform · August 6, 2026"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate("/admin/reports")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
              <TrendingUp size={16} /> Reports
            </button>
            <button onClick={() => navigate("/admin/settings")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
              <Settings size={16} /> Settings
            </button>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI.map((k) => (
          <div key={k.label} className="bg-card rounded-2xl border border-border p-4 text-center hover:shadow-sm transition-shadow">
            <div className="text-xl font-extrabold font-mono" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Monthly Donations & Requests</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_DATA} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Legend />
              <Bar dataKey="donations" fill="#E53935" radius={[6, 6, 0, 0]} name="Donations" />
              <Bar dataKey="requests" fill="#1565C0" radius={[6, 6, 0, 0]} name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Blood Type Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={BLOOD_TYPE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
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

      {/* Users table */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent User Registrations</h3>
          <button onClick={() => navigate("/admin/users")}
            className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1">
            View all <ArrowRight size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["User", "Role", "Blood Type", "Location", "Joined", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_USERS.map((u) => (
                <tr key={u.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} size="sm" />
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3"><RoleBadge role={u.role} /></td>
                  <td className="py-3 px-3">{u.blood ? <BloodTypePill type={u.blood} /> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-3 px-3 text-muted-foreground">{u.city}</td>
                  <td className="py-3 px-3 text-muted-foreground font-mono text-xs">{u.joined}</td>
                  <td className="py-3 px-3"><StatusBadge text={u.status} color={STATUS_BADGE_COLOR[u.status] ?? "#6B7280"} /></td>
                  <td className="py-3 px-3">
                    <button onClick={() => navigate("/admin/users")} className="text-xs text-red-600 hover:underline font-medium">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending approvals + activity log */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Pending Hospital Approvals</h3>
            <button onClick={() => navigate("/admin/hospitals")}
              className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1">
              All <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {PENDING_HOSPITALS.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <div className="text-sm font-medium text-foreground">{h.name}, {h.city}</div>
                  <div className="text-xs text-muted-foreground">Applied {h.joinedAt}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">Approve</button>
                  <button className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">System Activity Log</h3>
          <div className="space-y-3">
            {ACTIVITY_LOG.map((log) => (
              <div key={log.text} className="flex items-start gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${LOG_COLOR[log.type]}`} />
                <div className="flex-1">
                  <div className="text-foreground leading-snug">{log.text}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
