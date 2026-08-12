import { Activity, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusBadge } from "../../components/shared/StatusBadge";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";

const HEALTH_METRICS = [
  { metric: "Hemoglobin", value: 14.2, unit: "g/dL", normal: "12–17", status: "good", icon: "🩸" },
  { metric: "Blood Pressure", value: "118/76", unit: "mmHg", normal: "<120/80", status: "good", icon: "💓" },
  { metric: "Pulse Rate", value: 72, unit: "bpm", normal: "60–100", status: "good", icon: "❤️" },
  { metric: "Temperature", value: 98.4, unit: "°F", normal: "98–99", status: "good", icon: "🌡️" },
  { metric: "Weight", value: 72, unit: "kg", normal: ">50 kg", status: "good", icon: "⚖️" },
  { metric: "Last Check", value: "Mar 12, 2024", unit: "", normal: "< 3 months", status: "good", icon: "📅" },
];

const RADAR_DATA = [
  { subject: "Hemoglobin", A: 94 },
  { subject: "BP", A: 96 },
  { subject: "Pulse", A: 90 },
  { subject: "Weight", A: 88 },
  { subject: "Eligibility", A: 94 },
  { subject: "History", A: 100 },
];

const AI_CHECKS = [
  { label: "Blood hemoglobin within safe range", pass: true },
  { label: "No recent illness or fever", pass: true },
  { label: "Blood pressure normal", pass: true },
  { label: "Weight meets minimum requirement", pass: true },
  { label: "90-day cooldown period completed", pass: false, note: "Eligible Jun 10, 2024" },
  { label: "No high-risk travel in last 12 months", pass: true },
  { label: "No recent tattoo or piercing (< 12 months)", pass: true },
  { label: "No major surgery in last 6 months", pass: true },
];

export function HealthStatusPage() {
  const score = 94;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Status"
        subtitle="AI-powered eligibility assessment based on your health data"
        breadcrumbs={[{ label: "Donor", path: "/donor/dashboard" }, { label: "Health Status" }]}
      />

      {/* AI score hero */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={20} />
              <span className="font-semibold">AI Health Score</span>
            </div>
            <div className="text-5xl font-extrabold font-mono">{score}<span className="text-2xl text-green-200">/100</span></div>
            <p className="text-green-200 text-sm mt-2">
              Your health profile is <strong className="text-white">excellent</strong>. You are eligible to donate blood.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="2.5"
                  strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-xl">{score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vitals */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Health Vitals</h3>
          <div className="space-y-3">
            {HEALTH_METRICS.map((m) => (
              <div key={m.metric} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                <span className="text-xl flex-shrink-0">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-foreground">{m.metric}</span>
                    <StatusBadge text="Normal" color="#43A047" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono font-semibold text-foreground">{m.value} {m.unit}</span>
                    <span>Normal: {m.normal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar chart */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Health Radar</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="rgba(0,0,0,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Radar dataKey="A" stroke="#43A047" fill="#43A047" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI eligibility checklist */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-green-600" />
          <h3 className="font-semibold text-foreground">AI Eligibility Checklist</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {AI_CHECKS.map((c) => (
            <div key={c.label} className={`flex items-start gap-3 p-3 rounded-xl ${c.pass ? "bg-green-50 dark:bg-green-900/10" : "bg-orange-50 dark:bg-orange-900/10"}`}>
              {c.pass ? (
                <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className={`text-xs font-medium ${c.pass ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"}`}>{c.label}</div>
                {c.note && <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">{c.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
