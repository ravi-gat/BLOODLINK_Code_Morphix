import { useState } from "react";
import { Activity, CheckCircle, AlertTriangle, TrendingUp, ShieldCheck, HeartPulse, RefreshCw } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusBadge } from "../../components/shared/StatusBadge";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CheckItem {
  id: string;
  label: string;
  category: "vitals" | "history" | "lifestyle";
  pass: boolean;
  note?: string;
  weight: number;
}

const INITIAL_CHECKS: CheckItem[] = [
  { id: "c1", label: "Hemoglobin ≥ 12.5 g/dL (tested within safe range)", category: "vitals", pass: true, weight: 20 },
  { id: "c2", label: "Blood pressure normal (< 140/90 mmHg)", category: "vitals", pass: true, weight: 15 },
  { id: "c3", label: "Body weight ≥ 50 kg", category: "vitals", pass: true, weight: 15 },
  { id: "c4", label: "Pulse rate normal (60–100 bpm) without arrhythmia", category: "vitals", pass: true, weight: 10 },
  { id: "c5", label: "90-day cooldown completed since last whole blood donation", category: "history", pass: true, weight: 15 },
  { id: "c6", label: "No active infection, fever, or antibiotic use in past 48 hours", category: "history", pass: true, weight: 10 },
  { id: "c7", label: "No major surgery or blood transfusion in last 6 months", category: "history", pass: true, weight: 10 },
  { id: "c8", label: "No new tattoo or body piercing in last 6 months", category: "lifestyle", pass: true, weight: 5 },
];

export function HealthStatusPage() {
  const [checks, setChecks] = useState<CheckItem[]>(INITIAL_CHECKS);

  const toggleCheck = (id: string) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pass: !c.pass } : c))
    );
  };

  const resetChecks = () => {
    setChecks(INITIAL_CHECKS);
  };

  const totalScore = checks.reduce((acc, c) => acc + (c.pass ? c.weight : 0), 0);
  const isEligible = totalScore >= 80;

  const radarData = [
    { subject: "Hemoglobin", A: checks.find((c) => c.id === "c1")?.pass ? 95 : 40 },
    { subject: "Vitals (BP/Pulse)", A: checks.filter((c) => c.category === "vitals" && c.pass).length >= 3 ? 95 : 50 },
    { subject: "Weight & Body", A: checks.find((c) => c.id === "c3")?.pass ? 92 : 30 },
    { subject: "Cooldown Cycle", A: checks.find((c) => c.id === "c5")?.pass ? 100 : 0 },
    { subject: "Medical History", A: checks.filter((c) => c.category === "history" && c.pass).length === 3 ? 98 : 45 },
    { subject: "Lifestyle Safety", A: checks.find((c) => c.id === "c8")?.pass ? 95 : 20 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health & Eligibility Assessment"
        subtitle="Live AI-enabled donor suitability check and vital parameters calculator"
        breadcrumbs={[{ label: "Donor", path: "/donor/dashboard" }, { label: "Health Status" }]}
      />

      {/* AI Score Hero Card */}
      <div
        className={`rounded-2xl p-6 text-white transition-all shadow-md ${
          isEligible
            ? "bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800"
            : "bg-gradient-to-r from-amber-600 via-amber-700 to-red-800"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse size={22} className="animate-pulse" />
              <span className="font-bold text-sm tracking-wide uppercase">AI Health Readiness Score</span>
            </div>
            <div className="text-5xl font-extrabold font-mono tracking-tight">
              {totalScore}
              <span className="text-2xl text-white/70">/100</span>
            </div>
            <p className="text-white/90 text-sm mt-3 leading-relaxed max-w-lg">
              {isEligible ? (
                <>
                  <strong className="text-white">Active & Eligible to Donate.</strong> Your current physical vitals and medical parameters meet clinical transfusion safety protocols.
                </>
              ) : (
                <>
                  <strong className="text-white">Cooldown / Review Required.</strong> One or more clinical criteria require attention before you can safely donate blood.
                </>
              )}
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center sm:pr-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray={`${totalScore} ${100 - totalScore}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-extrabold text-xl">{totalScore}%</span>
                <span className="text-[10px] text-white/80 uppercase">{isEligible ? "Ready" : "Hold"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-foreground">Clinical Readiness Radar</h3>
              <p className="text-xs text-muted-foreground">Multi-dimensional health parameter coverage</p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isEligible
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
              }`}
            >
              {isEligible ? "PASS" : "ACTION REQUIRED"}
            </span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(150, 150, 150, 0.15)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" />
                <Radar
                  dataKey="A"
                  stroke={isEligible ? "#10B981" : "#F59E0B"}
                  fill={isEligible ? "#10B981" : "#F59E0B"}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    fontSize: "12px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Self-Assessment Checklist */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-red-600 dark:text-red-400" />
              <h3 className="font-bold text-sm text-foreground">Interactive Eligibility Checklist</h3>
            </div>
            <button
              type="button"
              onClick={resetChecks}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw size={12} /> Reset
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Click any item to simulate state changes and observe live score adjustments.
          </p>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {checks.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCheck(c.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  c.pass
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                    : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                }`}
              >
                {c.pass ? (
                  <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-semibold leading-snug ${
                      c.pass ? "text-emerald-900 dark:text-emerald-200" : "text-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {c.label}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    c.pass
                      ? "bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                      : "bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                  }`}
                >
                  {c.pass ? `+${c.weight} pts` : "0 pts"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
