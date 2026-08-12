import { useState } from "react";
import { MapPin, Phone, MessageCircle, Heart, Star, Circle, Navigation } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { Avatar } from "../../components/shared/Avatar";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Toggle } from "../../components/shared/Toggle";
import { DONORS } from "../../data/donors";
import type { BloodGroup } from "../../types";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function NearbyDonorsPage() {
  const [selectedBlood, setSelectedBlood] = useState<BloodGroup | "">("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filtered = DONORS.filter((d) => {
    if (onlyAvailable && !d.available) return false;
    if (selectedBlood && d.bloodGroup !== selectedBlood) return false;
    return true;
  }).sort((a, b) => parseFloat(a.distance ?? "99") - parseFloat(b.distance ?? "99"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nearby Donors"
        subtitle="Donors within your area, sorted by distance"
        breadcrumbs={[{ label: "Patient", path: "/patient/dashboard" }, { label: "Nearby Donors" }]}
      />

      {/* Map placeholder */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 h-48 flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,#1565C0 39px,#1565C0 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#1565C0 39px,#1565C0 40px)" }} />
          <div className="relative text-center">
            <Navigation size={32} className="text-blue-600 mx-auto mb-2" />
            <p className="text-blue-700 dark:text-blue-300 font-semibold text-sm">Interactive Map</p>
            <p className="text-blue-500 dark:text-blue-400 text-xs mt-0.5">Showing {filtered.length} donors near New Delhi</p>
          </div>
          {/* Mock donor pins */}
          {filtered.slice(0, 5).map((d, i) => (
            <div
              key={d.id}
              className="absolute"
              style={{ left: `${20 + i * 14}%`, top: `${25 + (i % 3) * 20}%` }}
            >
              <div className={`w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold ${d.available ? "bg-red-600" : "bg-gray-400"}`}>
                {d.bloodGroup.replace("+", "").replace("-", "")}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-red-600" /><span>Available</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-gray-400" /><span>Unavailable</span>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">Click a pin to see donor details</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {BLOOD_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedBlood(selectedBlood === g ? "" : g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedBlood === g ? "bg-red-600 text-white" : "bg-card border border-border text-muted-foreground hover:border-red-300"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Available only</span>
          <Toggle checked={onlyAvailable} onChange={setOnlyAvailable} size="sm" />
        </div>
      </div>

      {/* Donor list */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((d) => (
          <div key={d.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar initials={d.initials} />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${d.available ? "bg-green-500" : "bg-gray-400"}`} />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{d.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin size={10} />{d.distance}
                  </div>
                </div>
              </div>
              <BloodTypePill type={d.bloodGroup} />
            </div>
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Star size={10} fill="#F9A825" className="text-yellow-400" />{d.rating}</span>
              <span>·</span>
              <span>{d.totalDonations} donations</span>
            </div>
            <div className="flex items-center gap-1.5 mb-4">
              <Circle size={7} fill={d.available ? "#43A047" : "#9CA3AF"} className={d.available ? "text-green-500" : "text-gray-400"} />
              <span className={`text-xs font-medium ${d.available ? "text-green-600" : "text-muted-foreground"}`}>
                {d.available ? "Available" : "Unavailable"}
              </span>
              {d.verified && <StatusBadge text="✓" color="#43A047" />}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button className="flex flex-col items-center gap-1 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium">
                <Phone size={12} />Call
              </button>
              <button className="flex flex-col items-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-medium">
                <MessageCircle size={12} />Chat
              </button>
              <button disabled={!d.available} className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${d.available ? "bg-red-600 text-white hover:bg-red-700" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                <Heart size={12} />Request
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
