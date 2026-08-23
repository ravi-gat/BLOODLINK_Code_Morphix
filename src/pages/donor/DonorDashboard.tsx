import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Heart, Bell, CheckCircle, Award, Activity, Calendar,
  ArrowRight, Droplets, MapPin, TrendingUp, Plus, Map,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { GoogleResourceMap } from "../../components/shared/GoogleResourceMap";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { Avatar } from "../../components/shared/Avatar";
import { UrgencyBadge, StatusBadge } from "../../components/shared/StatusBadge";
import { Toggle } from "../../components/shared/Toggle";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useAuthStore } from "../../stores/useAuthStore";
import { useApi } from "../../hooks/useApi";
import { donorApi, ApiError } from "../../services/api";
import type { BloodGroup, UrgencyLevel } from "../../types";

export function DonorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useApi(
    () => donorApi.getProfile()
  );
  const { data: requests, isLoading: reqLoading } = useApi(() => donorApi.getRequests());
  const { data: donations, isLoading: donLoading } = useApi(() => donorApi.getDonations());
  const { data: rewardsResp } = useApi(() => donorApi.getRewards());

  const rewards = (rewardsResp as { data?: { points: number; level: string } } | null)?.data;
  const emergencyRequests = requests?.filter(
    (r) => r.urgency === "Critical" && r.status !== "COMPLETED" && r.status !== "CANCELLED"
  ).slice(0, 3) ?? [];

  const recentDonations = donations?.slice(0, 4) ?? [];
  const rewardPoints = rewards?.points ?? profile?.reward_points ?? 0;
  const rewardLevel = rewards?.level ?? "Bronze";

  const handleAvailabilityToggle = async (val: boolean) => {
    try {
      await donorApi.setAvailability(val);
      toast.success(val ? "You are now available to donate." : "Availability turned off.");
      refetchProfile();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update availability.");
    }
  };

  if (profileLoading) return <LoadingSkeleton.SkeletonPage />;

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

      {/* Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">You're making a difference 💪</h2>
            <p className="text-red-200 text-sm">
              You have completed{" "}
              <strong className="text-white">{profile?.total_donations ?? 0} donation{(profile?.total_donations ?? 0) !== 1 ? "s" : ""}</strong>.{" "}
              Your{" "}
              <strong className="text-white">{profile?.blood_group ?? user?.bloodGroup ?? "blood type"}</strong> is in demand.
            </p>
          </div>
          <div className="hidden sm:block text-right flex-shrink-0 ml-4">
            <div className="text-3xl font-extrabold font-mono">{rewardPoints}</div>
            <div className="text-red-200 text-sm">Reward Points · {rewardLevel}</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5 text-center">
            <Avatar initials={user?.initials ?? "?"} size="xl" />
            <div className="font-semibold text-foreground mt-3">{user?.name}</div>
            <div className="text-sm text-muted-foreground mb-3">{user?.email}</div>
            <BloodTypePill type={(profile?.blood_group ?? user?.bloodGroup ?? "O+") as BloodGroup} size="lg" />
            <div className="mt-4 bg-muted rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Available to Donate</span>
              <Toggle
                checked={profile?.availability ?? true}
                onChange={handleAvailabilityToggle}
                size="sm"
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-foreground text-sm mb-4">Donation Status</h4>
            <div className="space-y-3 text-sm">
              {[
                { label: "Last Donated", value: profile?.last_donation_date ?? "—" },
                { label: "Next Eligible", value: profile?.next_eligible_date ?? "—", highlight: true },
                { label: "Health Status", value: profile?.health_status ?? "Unknown" },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-medium ${highlight ? "text-green-600" : "text-foreground"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Heart} label="Total Donations" value={String(profile?.total_donations ?? 0)} color="#E53935" />
            <StatCard icon={Bell} label="Open Requests" value={String(requests?.length ?? 0)} color="#1565C0" />
            <StatCard icon={CheckCircle} label="Donations Done" value={String(profile?.total_donations ?? 0)} color="#43A047" />
            <StatCard icon={Award} label="Reward Points" value={String(rewardPoints)} color="#F9A825" />
          </div>

          {/* Emergency requests */}
          {reqLoading ? (
            <LoadingSkeleton.SkeletonCard />
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Nearby Emergency Requests</h3>
                <StatusBadge
                  text={`${emergencyRequests.length} Critical`}
                  color={emergencyRequests.length > 0 ? "#E53935" : "#6B7280"}
                />
              </div>
              {emergencyRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No critical requests at this time.</p>
              ) : (
                <div className="space-y-3">
                  {emergencyRequests.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <BloodTypePill type={r.blood_group as BloodGroup} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm">{r.hospital_name || r.city}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={10} /> {r.city} · {r.units_required} unit{r.units_required > 1 ? "s" : ""} needed
                        </div>
                      </div>
                      <UrgencyBadge urgency={r.urgency as UrgencyLevel} />
                      <button
                        onClick={() => navigate("/donor/requests")}
                        className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors flex-shrink-0"
                      >
                        Respond
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Donation history */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Donation History</h3>
                <button onClick={() => navigate("/donor/history")} className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                  View all <ArrowRight size={11} />
                </button>
              </div>
              {donLoading ? (
                <LoadingSkeleton.SkeletonCard />
              ) : recentDonations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No donations recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentDonations.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {d.hospital_name || d.blood_bank_name || "Unknown location"}
                        </div>
                        <div className="text-xs text-muted-foreground">{d.donation_date} · {d.component_type}</div>
                      </div>
                      <StatusBadge text={d.status} color={d.status === "COMPLETED" ? "#43A047" : "#F9A825"} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Reward Progress</h3>
                <button onClick={() => navigate("/donor/rewards")} className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                  Details <ArrowRight size={11} />
                </button>
              </div>
              <div className="text-center mb-4">
                <div className="text-4xl font-extrabold font-mono text-yellow-500">{rewardPoints}</div>
                <div className="text-sm text-muted-foreground mt-1">points · {rewardLevel} tier</div>
              </div>
              <button
                onClick={() => navigate("/donor/availability")}
                className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Schedule Donation
              </button>
            </div>
          </div>

          {/* Reward trend chart */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-yellow-500" />
              <h3 className="font-semibold text-foreground">Donation & Points Activity</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={
                (() => {
                  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const currentMonthIdx = new Date().getMonth();
                  const last6Months = Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(currentMonthIdx - 5 + i);
                    return { month: months[d.getMonth()], year: d.getFullYear(), monthIdx: d.getMonth(), donations: 0, points: 0 };
                  });

                  (donations || []).forEach((don) => {
                    if (!don.donation_date) return;
                    const dDate = new Date(don.donation_date);
                    const m = dDate.getMonth();
                    const y = dDate.getFullYear();
                    const found = last6Months.find((item) => item.monthIdx === m && item.year === y);
                    if (found) found.donations += 1;
                  });

                  let cumulativePoints = 0;
                  return last6Months.map((item) => {
                    cumulativePoints += item.donations * 100;
                    return {
                      month: item.month,
                      points: cumulativePoints || (rewardPoints ? Math.round(rewardPoints * ((last6Months.indexOf(item) + 1) / 6)) : 0),
                    };
                  });
                })()
              }>
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

      {/* Find Nearby Donation Centers — Map */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-1">
          <Map size={16} className="text-red-600" />
          <h3 className="font-semibold text-foreground">Find Nearby Donation Centers</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Hospitals and blood banks accepting donations near you. Tap a marker to see details and get directions.
        </p>
        <GoogleResourceMap
          initialFilter="ALL"
          mapHeight="380px"
          initialCity={profile?.city || ""}
          className="rounded-xl overflow-hidden"
        />
      </div>
    </div>
  );
}
