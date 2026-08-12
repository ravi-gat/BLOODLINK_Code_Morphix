import { Award, TrendingUp, Gift } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { REWARD_TIERS, REWARD_TRANSACTIONS } from "../../data/rewards";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { REWARD_TREND_DATA } from "../../data/charts";

const CURRENT_POINTS = 820;
const CURRENT_TIER = REWARD_TIERS.find(
  (t) => CURRENT_POINTS >= t.minPoints && CURRENT_POINTS <= t.maxPoints
) ?? REWARD_TIERS[2];
const NEXT_TIER = REWARD_TIERS[REWARD_TIERS.indexOf(CURRENT_TIER) + 1];
const PROGRESS = NEXT_TIER
  ? ((CURRENT_POINTS - CURRENT_TIER.minPoints) / (NEXT_TIER.minPoints - CURRENT_TIER.minPoints)) * 100
  : 100;

export function RewardsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards & Achievements"
        subtitle="Your donation rewards and tier progress"
        breadcrumbs={[{ label: "Donor", path: "/donor/dashboard" }, { label: "Rewards" }]}
      />

      {/* Current tier card */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-yellow-100 text-sm font-medium mb-1">Current Tier</div>
            <div className="text-3xl font-extrabold">{CURRENT_TIER.icon} {CURRENT_TIER.name}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold font-mono">{CURRENT_POINTS}</div>
            <div className="text-yellow-100 text-sm">Points</div>
          </div>
        </div>
        {NEXT_TIER && (
          <>
            <div className="flex justify-between text-sm mb-1.5 text-yellow-100">
              <span>{CURRENT_POINTS} pts</span>
              <span>{NEXT_TIER.minPoints} pts for {NEXT_TIER.icon} {NEXT_TIER.name}</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2.5">
              <div className="bg-white h-2.5 rounded-full transition-all" style={{ width: `${PROGRESS}%` }} />
            </div>
            <p className="text-yellow-100 text-xs mt-2">
              {NEXT_TIER.minPoints - CURRENT_POINTS} more points to reach {NEXT_TIER.name}
            </p>
          </>
        )}
      </div>

      {/* Tier breakdown */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {REWARD_TIERS.map((t) => {
          const isActive = CURRENT_TIER.name === t.name;
          const isPast = CURRENT_POINTS >= t.minPoints;
          return (
            <div
              key={t.name}
              className={`bg-card rounded-2xl border p-4 text-center transition-all ${
                isActive ? "border-yellow-400 ring-2 ring-yellow-300/50 shadow-md" : "border-border"
              }`}
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className={`font-semibold text-sm mb-0.5 ${isActive ? "" : "text-foreground"}`} style={{ color: isActive ? t.color : undefined }}>{t.name}</div>
              <div className="text-xs text-muted-foreground font-mono">{t.minPoints}+ pts</div>
              {isActive && <StatusBadge text="Current" color={t.color} />}
              {!isActive && isPast && <StatusBadge text="Achieved" color="#43A047" />}
            </div>
          );
        })}
      </div>

      {/* Benefits */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift size={18} className="text-yellow-500" />
          <h3 className="font-semibold text-foreground">{CURRENT_TIER.icon} {CURRENT_TIER.name} Benefits</h3>
        </div>
        <ul className="space-y-2">
          {CURRENT_TIER.benefits.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Points chart */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-yellow-500" />
            <h3 className="font-semibold text-foreground">Points Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={REWARD_TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Line type="monotone" dataKey="points" stroke="#F9A825" strokeWidth={2.5} dot={{ fill: "#F9A825", r: 4 }} name="Points" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction history */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Transaction History</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {REWARD_TRANSACTIONS.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  t.type === "earned" ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"
                }`}>
                  <span className="text-sm">{t.type === "earned" ? "+" : "−"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{t.reason}</div>
                  <div className="text-xs text-muted-foreground font-mono">{t.date}</div>
                </div>
                <div className={`font-mono font-semibold text-sm ${t.type === "earned" ? "text-green-600" : "text-orange-600"}`}>
                  {t.type === "earned" ? "+" : ""}{t.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
