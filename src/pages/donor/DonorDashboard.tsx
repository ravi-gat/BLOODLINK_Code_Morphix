import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Heart, Bell, CheckCircle, Award, Activity, Calendar,
  ArrowRight, Droplets, MapPin, TrendingUp, Plus,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { Avatar } from "../../components/shared/Avatar";
import { UrgencyBadge, StatusBadge } from "../../components/shared/StatusBadge";
import { Toggle } from "../../components/shared/Toggle";
import { useAuthStore } from "../../stores/useAuthStore";
import { BLOOD_REQUESTS } from "../../data/requests";
import { REWARD_TREND_DATA } from "../../data/charts";

const BADGES = [
  { icon: "🩸", label: "First Drop" },
  { icon: "🏆", label: "10 Lives" },
  { icon: "⚡", label: "Emergency" },
  { icon: "🌟", label: "Top Donor" },
  { icon: "💪", label: "Consistent" },
  { icon: "🔬", label: "Rare Type" },
];

const HISTORY = [
  { date: "Mar 12, 2024", hospital: "AIIMS Delhi", type: "Whole Blood", status: "Completed" },
  { date: "Nov 28, 2023", hospital: "Apollo Hospitals", type: "Platelet", status: "Completed" },
  { date: "Aug 5, 2023", hospital: "Fortis Healthcare", type: "Whole Blood", status: "Completed" },
  { date: "Apr 19, 2023", hospital: "Max Hospital", type: "Plasma", status: "Completed" },
];

const UPCOMING = [
  { date: "Jun 10, 2024", time: "10:30 AM", hospital: "AIIMS Delhi", type: "Scheduled" },
  { date: "Jun 18, 2024", time: "2:00 PM", hospital: "Apollo Hospitals", type: "Requested" },
];

export function DonorDashboard() {
  const { user } = useAuthStore();
  const [available, setAvailable] = useState(true);
  const navigate = useNavigate();

  const emergencyRequests = BLOOD_REQUESTS.filter(
    (r) => r.urgency === "Critical" && r.status !== "Fulfilled" && r.status !== "Cancelled"
  ).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0]} 👋`}
        subtitle="Your donation activity overview"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <button
            onClick={() => navigate("/donor/requests")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Droplets size={16} />
            View Requests
          </button>
        }
      />

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">You're making a difference 💪</h2>
            <p className="text-red-200 text-sm">
              You have saved <strong className="text-white">12 lives</strong> so far. Your{" "}
              <strong className="text-white">{user?.bloodGroup || "O+"}</strong> blood type is in high demand right now.
            </p>
          </div>
          <div className="hidden sm:block text-right flex-shrink-0 ml-4">
            <div className="text-3xl font-extrabold font-mono">820</div>
            <div className="text-red-200 text-sm">Reward Points</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5 text-center">
            <Avatar initials={user?.initials ?? "AM"} size="xl" />
            <div className="font-semibold text-foreground mt-3">{user?.name}</div>
            <div className="text-sm text-muted-foreground mb-3">{user?.email}</div>
            <BloodTypePill type={user?.bloodGroup ?? "O+"} size="lg" />
            <div className="mt-4 bg-muted rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Available to Donate</span>
              <Toggle checked={available} onChange={setAvailable} size="sm" />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-foreground text-sm mb-4">Donation Status</h4>
            <div className="space-y-3 text-sm">
              {[
                { label: "Last Donated", value: "Mar 12, 2024" },
                { label: "Next Eligible", value: "Jun 10, 2024", highlight: true },
                { label: "AI Health Score", value: "94 / 100", mono: true, highlight: true },
              ].map(({ label, value, highlight, mono }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-medium ${highlight ? "text-green-600" : "text-foreground"} ${mono ? "font-mono" : ""}`}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-foreground text-sm mb-3">Achievement Badges</h4>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted">
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-xs text-muted-foreground text-center leading-tight">{b.label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/donor/rewards")}
              className="mt-3 w-full text-center text-xs text-red-600 hover:underline font-medium flex items-center justify-center gap-1"
            >
              View all rewards <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Heart} label="Lives Saved" value="12" color="#E53935" />
            <StatCard icon={Bell} label="Requests Received" value="34" color="#1565C0" />
            <StatCard icon={CheckCircle} label="Requests Accepted" value="12" color="#43A047" />
            <StatCard icon={Award} label="Reward Points" value="820" color="#F9A825" />
          </div>

          {/* Emergency requests */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Nearby Emergency Requests</h3>
              <StatusBadge text={`${emergencyRequests.length} Active`} color="#E53935" />
            </div>
            <div className="space-y-3">
              {emergencyRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <BloodTypePill type={r.bloodGroup} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{r.hospital}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={10} /> {r.city} · {r.units} units needed
                    </div>
                  </div>
                  <UrgencyBadge urgency={r.urgency} />
                  <button
                    onClick={() => navigate("/donor/requests")}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors flex-shrink-0"
                  >
                    Respond
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* History + Schedule */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Donation History</h3>
                <button onClick={() => navigate("/donor/history")} className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                  View all <ArrowRight size={11} />
                </button>
              </div>
              <div className="space-y-3">
                {HISTORY.map((d) => (
                  <div key={d.date} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{d.hospital}</div>
                      <div className="text-xs text-muted-foreground">{d.date} · {d.type}</div>
                    </div>
                    <StatusBadge text={d.status} color="#43A047" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Upcoming Schedule</h3>
                <button onClick={() => navigate("/donor/availability")} className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                  Manage <ArrowRight size={11} />
                </button>
              </div>
              <div className="space-y-3">
                {UPCOMING.map((s) => (
                  <div key={s.date} className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={13} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{s.date} · {s.time}</span>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-300 mb-1.5">{s.hospital}</div>
                    <StatusBadge text={s.type} color="#1565C0" />
                  </div>
                ))}
                <button
                  onClick={() => navigate("/donor/availability")}
                  className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Schedule Donation
                </button>
              </div>
            </div>
          </div>

          {/* Reward chart */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-yellow-500" />
              <h3 className="font-semibold text-foreground">Reward Points Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={REWARD_TREND_DATA}>
                <defs>
                  <linearGradient id="rwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F9A825" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F9A825" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
                <Area type="monotone" dataKey="points" stroke="#F9A825" strokeWidth={2} fill="url(#rwGrad)" name="Points" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
