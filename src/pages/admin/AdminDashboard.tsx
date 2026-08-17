import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Users, Heart, Building2, Droplets, AlertTriangle, TrendingUp,
  ArrowRight, Settings, CheckCircle, Activity,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { Avatar } from "../../components/shared/Avatar";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { RoleBadge, StatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useApi } from "../../hooks/useApi";
import { adminApi, ApiError } from "../../services/api";
import type { BloodGroup } from "../../types";

// Demo chart data — replace with real analytics when enough data exists
const MONTHLY_DATA = [
  { month: "Mar", donations: 28, requests: 24 },
  { month: "Apr", donations: 35, requests: 30 },
  { month: "May", donations: 42, requests: 38 },
  { month: "Jun", donations: 38, requests: 34 },
  { month: "Jul", donations: 51, requests: 44 },
  { month: "Aug", donations: 48, requests: 41 },
];

const BLOOD_COLORS: Record<string, string> = {
  "O+": "#E53935", "O-": "#7C3AED", "A+": "#1565C0", "A-": "#0891B2",
  "B+": "#43A047", "B-": "#DB2777", "AB+": "#F9A825", "AB-": "#EA580C",
};

export function AdminDashboard() {
  const navigate = useNavigate();

  const { data: dashboardResp, isLoading: dashLoading } = useApi(() => adminApi.getDashboard());
  const { data: hospitals, isLoading: hospLoading, refetch: refetchHospitals } = useApi(
    () => adminApi.getHospitals()
  );
  const { data: analytics } = useApi(() => adminApi.getAnalytics());

  const kpis = (dashboardResp as { data?: Record<string, number> } | null)?.data;
  const hospitalList = (hospitals as { data?: { id: string; name: string; city: string; verification_status: string; created_at?: string }[] } | null)?.data ?? [];
  const pendingHospitals = hospitalList.filter((h) => h.verification_status === "PENDING");
  const analyticsData = (analytics as { data?: { blood_type_distribution: { blood_group: string; count: number }[] } } | null)?.data;

  const bloodTypeData = analyticsData?.blood_type_distribution?.map((b) => ({
    name: b.blood_group,
    value: b.count,
    color: BLOOD_COLORS[b.blood_group] ?? "#888",
  })) ?? [];

  const handleVerifyHospital = async (id: string, verified: boolean) => {
    try {
      await adminApi.verifyHospital(id, verified);
      toast.success(verified ? "Hospital verified." : "Hospital rejected.");
      refetchHospitals();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Center"
        subtitle="BloodLink Platform — Demo Data"
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
      {dashLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <LoadingSkeleton.SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Users", value: kpis?.total_users ?? 0, color: "#E53935" },
            { label: "Active Donors", value: kpis?.active_donors ?? 0, color: "#1565C0" },
            { label: "Hospitals", value: kpis?.total_hospitals ?? 0, color: "#43A047" },
            { label: "Blood Banks", value: kpis?.total_blood_banks ?? 0, color: "#F9A825" },
            { label: "Active Requests", value: kpis?.active_requests ?? 0, color: "#7C3AED" },
            { label: "Blood Units", value: kpis?.total_blood_units ?? 0, color: "#DB2777" },
          ].map((k) => (
            <div key={k.label} className="bg-card rounded-2xl border border-border p-4 text-center hover:shadow-sm transition-shadow">
              <div className="text-xl font-extrabold font-mono" style={{ color: k.color }}>
                {k.value.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-1">Monthly Donations & Requests</h3>
          <p className="text-xs text-muted-foreground mb-4">Demo data — real analytics update as the platform grows.</p>
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
          {bloodTypeData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={bloodTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                    {bloodTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => v} contentStyle={{ borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-1 mt-2">
                {bloodTypeData.map((b) => (
                  <div key={b.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    <span className="text-xs text-muted-foreground">{b.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending hospital approvals */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Pending Hospital Approvals</h3>
            <button onClick={() => navigate("/admin/hospitals")}
              className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1">
              All <ArrowRight size={13} />
            </button>
          </div>
          {hospLoading ? (
            <LoadingSkeleton.SkeletonCard />
          ) : pendingHospitals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending approvals.</p>
          ) : (
            <div className="space-y-3">
              {pendingHospitals.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div>
                    <div className="text-sm font-medium text-foreground">{h.name}, {h.city}</div>
                    <div className="text-xs text-muted-foreground">
                      {h.created_at ? new Date(h.created_at).toLocaleDateString("en-IN") : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyHospital(h.id, true)}
                      className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerifyHospital(h.id, false)}
                      className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
          <div className="space-y-2">
            {[
              { label: "Manage Users", path: "/admin/users", icon: Users, color: "#E53935" },
              { label: "All Hospitals", path: "/admin/hospitals", icon: Building2, color: "#43A047" },
              { label: "Blood Banks", path: "/admin/bloodbanks", icon: Droplets, color: "#1565C0" },
              { label: "Emergency Requests", path: "/admin/emergency", icon: AlertTriangle, color: "#F9A825" },
              { label: "Analytics", path: "/admin/analytics", icon: TrendingUp, color: "#7C3AED" },
            ].map(({ label, path, icon: Icon, color }) => (
              <button key={label} onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
                <ArrowRight size={13} className="text-muted-foreground ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
