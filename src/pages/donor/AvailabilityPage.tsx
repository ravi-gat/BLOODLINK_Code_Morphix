import { useState } from "react";
import { Calendar, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../../components/shared/PageHeader";
import { Toggle } from "../../components/shared/Toggle";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { useApi } from "../../hooks/useApi";
import { donorApi, ApiError } from "../../services/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["Morning (8–12)", "Afternoon (12–5)", "Evening (5–9)"];

export function AvailabilityPage() {
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Fri", "Sat"]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(["Morning (8–12)", "Afternoon (12–5)"]);
  const [toggling, setToggling] = useState(false);

  const { data: profile, refetch } = useApi(() => donorApi.getProfile());

  const available = profile?.availability ?? true;
  const nextEligible = profile?.next_eligible_date ?? "—";

  const toggleDay = (d: string) =>
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const toggleTime = (t: string) =>
    setSelectedTimes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleAvailabilityChange = async (val: boolean) => {
    setToggling(true);
    try {
      await donorApi.setAvailability(val);
      toast.success(val ? "You are now available to donate." : "Availability turned off.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update.");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Availability"
        subtitle="Set when you're available to donate blood"
        breadcrumbs={[{ label: "Donor", path: "/donor/dashboard" }, { label: "Availability" }]}
      />

      {/* Master toggle */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Donation Availability</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {available ? "You are currently available to donate" : "You have marked yourself as unavailable"}
            </p>
          </div>
          <Toggle checked={available} onChange={handleAvailabilityChange} />
        </div>
        <div className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
          available ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-muted text-muted-foreground"
        }`}>
          <div className={`w-2 h-2 rounded-full ${available ? "bg-green-500" : "bg-gray-400"}`} />
          {available ? "Donors showing as available get 3× more requests from patients." : "You won't receive any donation requests while unavailable."}
        </div>
      </div>

      {/* Eligibility */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Eligibility Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: "Last Donation", value: "Mar 12, 2024" },
            { label: "Next Eligible", value: nextEligible, highlight: true },
            { label: "Cooldown Period", value: "90 days" },
            { label: "Blood Group", value: "O+", mono: true },
            { label: "Health Score", value: "94 / 100", highlight: true, mono: true },
            { label: "Status", value: "Eligible", highlight: true },
          ].map(({ label, value, highlight, mono }) => (
            <div key={label} className="bg-muted/50 rounded-xl p-3">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className={`font-semibold ${highlight ? "text-green-600" : "text-foreground"} ${mono ? "font-mono" : ""}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule preferences */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Preferred Days</h3>
        <div className="grid grid-cols-7 gap-2 mb-6">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedDays.includes(d) ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <h3 className="font-semibold text-foreground mb-3">Preferred Time Slots</h3>
        <div className="grid grid-cols-3 gap-3">
          {TIMES.map((t) => (
            <button
              key={t}
              onClick={() => toggleTime(t)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-medium border transition-colors ${
                selectedTimes.includes(t)
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700"
                  : "border-border text-muted-foreground hover:border-red-300"
              }`}
            >
              <Clock size={12} />
              {t}
            </button>
          ))}
        </div>
        <button className="mt-4 w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
          Save Preferences
        </button>
      </div>

      {/* Appointments */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Scheduled Appointments</h3>
          <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors">
            <Plus size={13} /> Add Appointment
          </button>
        </div>
        <div className="space-y-3">
          {myAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments</p>
          ) : (
            myAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">{apt.hospitalName}</div>
                  <div className="text-xs text-muted-foreground">{apt.date} · {apt.time} · {apt.type}</div>
                </div>
                <StatusBadge
                  text={apt.status}
                  color={apt.status === "Completed" ? "#43A047" : apt.status === "Cancelled" ? "#6B7280" : "#1565C0"}
                />
                {apt.status === "Scheduled" && (
                  <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
