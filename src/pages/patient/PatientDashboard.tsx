import { useNavigate } from "react-router";
import {
  AlertTriangle, Search, MapPin, Heart, Activity, Bell,
  Clock, CheckCircle, ArrowRight, Zap, Star, Phone, MessageCircle,
  Circle, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { Avatar } from "../../components/shared/Avatar";
import { UrgencyBadge, RequestStatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSkeleton } from "../../components/shared/LoadingSkeleton";
import { useAuthStore } from "../../stores/useAuthStore";
import { useApi } from "../../hooks/useApi";
import { patientApi } from "../../services/api";
import type { BloodGroup, UrgencyLevel, RequestStatus } from "../../types";

export function PatientDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: myRequests, isLoading: reqLoading } = useApi(() => patientApi.getMyRequests());
  const { data: nearbyDonors, isLoading: donorLoading } = useApi(
    () => patientApi.getNearbyDonors(),
  );

  const recentRequests = myRequests?.slice(0, 3) ?? [];
  const availableDonors = nearbyDonors?.filter((d) => d.availability).slice(0, 3) ?? [];

  const totalRequests = myRequests?.length ?? 0;
  const fulfilled = myRequests?.filter((r) => r.status === "COMPLETED").length ?? 0;
  const pending = myRequests?.filter((r) => r.status === "PENDING" || r.status === "MATCHING").length ?? 0;
  const inProgress = myRequests?.filter((r) =>
    r.status === "ACCEPTED" || r.status === "IN_PROGRESS" || r.status === "DONOR_FOUND"
  ).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0]} 👋`}
        subtitle="Here's your blood request overview"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <button
            onClick={() => navigate("/patient/emergency")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <AlertTriangle size={16} />
            Emergency Request
          </button>
        }
      />

      {/* Emergency banner */}
      <div className="bg-red-600 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="font-semibold">Need blood urgently?</div>
            <div className="text-red-200 text-sm">Submit an emergency request — our system alerts matching donors immediately.</div>
          </div>
        </div>
        <button
          onClick={() => navigate("/patient/emergency")}
          className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white text-red-700 font-semibold text-sm hover:bg-red-50 transition-colors"
        >
          Request Now →
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Total Requests" value={String(totalRequests)} color="#E53935" />
        <StatCard icon={CheckCircle} label="Fulfilled" value={String(fulfilled)} color="#43A047" />
        <StatCard icon={Clock} label="Pending" value={String(pending)} deltaPositive={false} color="#F9A825" />
        <StatCard icon={Activity} label="In Progress" value={String(inProgress)} color="#1565C0" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Requests */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Blood Requests</h3>
            <button
              onClick={() => navigate("/patient/history")}
              className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          {reqLoading ? (
            <LoadingSkeleton.SkeletonPage />
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No requests yet.{" "}
              <button onClick={() => navigate("/patient/emergency")} className="text-red-600 underline">
                Create your first one
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <BloodTypePill type={req.blood_group as BloodGroup} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">
                      {req.hospital_name || req.city}
                    </div>
                    <div className="text-xs text-muted-foreground">{req.units_required} units · {req.city}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <UrgencyBadge urgency={req.urgency as UrgencyLevel} />
                    <RequestStatusBadge status={req.status as RequestStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate("/patient/emergency")}
            className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
          >
            + New Blood Request
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-yellow-300" />
              <span className="font-semibold text-sm">Nearby Donors</span>
            </div>
            {donorLoading ? (
              <div className="text-blue-200 text-xs">Loading donors...</div>
            ) : availableDonors.length === 0 ? (
              <p className="text-blue-200 text-xs">No available donors found in your city.</p>
            ) : (
              <>
                <p className="text-blue-200 text-xs leading-relaxed mb-4">
                  {availableDonors.length} compatible donor{availableDonors.length !== 1 ? "s" : ""} available now.
                </p>
                <div className="space-y-2">
                  {availableDonors.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-2.5 bg-white/10 rounded-xl p-2.5">
                      <span className="text-xs font-bold text-blue-200">#{i + 1}</span>
                      <Avatar initials={(d.name ?? "?")[0] + (d.name?.split(" ")[1]?.[0] ?? "")} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium truncate">{d.name ?? "Donor"}</div>
                        <div className="text-blue-300 text-xs">{d.city}</div>
                      </div>
                      <BloodTypePill type={d.blood_group as BloodGroup ?? "O+"} size="sm" />
                    </div>
                  ))}
                </div>
              </>
            )}
            <button
              onClick={() => navigate("/patient/search")}
              className="mt-3 w-full py-2 rounded-lg bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors"
            >
              View All Donors →
            </button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-red-600" />
              <h3 className="font-semibold text-foreground text-sm">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: "Search Donors", path: "/patient/search", icon: Search, color: "#E53935" },
                { label: "Nearby Donors", path: "/patient/nearby", icon: MapPin, color: "#1565C0" },
                { label: "Request History", path: "/patient/history", icon: Clock, color: "#43A047" },
              ].map(({ label, path, icon: Icon, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
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

      {/* Nearby Donors */}
      {availableDonors.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Nearby Available Donors</h3>
            <button onClick={() => navigate("/patient/nearby")} className="text-sm text-red-600 hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDonors.map((d) => (
              <div key={d.id} className="bg-muted/50 rounded-xl p-4 hover:bg-muted transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={(d.name ?? "?")[0] + (d.name?.split(" ")[1]?.[0] ?? "")} size="md" />
                    <div>
                      <div className="font-medium text-foreground text-sm">{d.name ?? "Donor"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} />{d.city}
                      </div>
                    </div>
                  </div>
                  <BloodTypePill type={d.blood_group as BloodGroup ?? "O+"} />
                </div>
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  <Heart size={11} className="text-red-400" />
                  {d.total_donations} donation{d.total_donations !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1 mb-3">
                  <Circle size={8} fill="#43A047" className="text-green-500" />
                  <span className="text-xs font-medium text-green-600">Available Now</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {d.blood_group && (
                    <a href={`tel:`} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium">
                      <Phone size={12} />Call
                    </a>
                  )}
                  <button className="flex flex-col items-center gap-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-medium col-span-1">
                    <Heart size={12} />Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-red-600" />
          <h3 className="font-semibold text-foreground">Your Request Activity</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={
            (() => {
              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const currentMonthIdx = new Date().getMonth();
              const last6Months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(currentMonthIdx - 5 + i);
                return { month: months[d.getMonth()], year: d.getFullYear(), monthIdx: d.getMonth(), count: 0 };
              });
              (myRequests || []).forEach((req) => {
                if (!req.created_at) return;
                const reqDate = new Date(req.created_at);
                const m = reqDate.getMonth();
                const y = reqDate.getFullYear();
                const found = last6Months.find((item) => item.monthIdx === m && item.year === y);
                if (found) found.count += 1;
              });
              return last6Months.map((item) => ({ month: item.month, requests: item.count }));
            })()
          }>
            <defs>
              <linearGradient id="pColDon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E53935" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
            <Area type="monotone" dataKey="requests" stroke="#E53935" strokeWidth={2} fill="url(#pColDon)" name="Requests" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
