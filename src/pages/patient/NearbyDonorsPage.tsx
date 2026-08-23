import { useState, useEffect } from "react";
import { MapPin, Phone, MessageCircle, Heart, Star, Circle, Navigation, Loader2, Map } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { Avatar } from "../../components/shared/Avatar";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Toggle } from "../../components/shared/Toggle";
import { GoogleResourceMap } from "../../components/shared/GoogleResourceMap";
import { patientApi, type DonorPublic } from "../../services/api";
import type { BloodGroup } from "../../types";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function NearbyDonorsPage() {
  const [selectedBlood, setSelectedBlood] = useState<BloodGroup | "">("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [donors, setDonors] = useState<DonorPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDonors() {
      setLoading(true);
      setError(null);
      try {
        const data = await patientApi.getNearbyDonors({
          blood_group: selectedBlood || undefined,
        });
        setDonors(data);
      } catch (err: any) {
        setError(err.message || "Failed to load donors from server.");
      } finally {
        setLoading(false);
      }
    }
    loadDonors();
  }, [selectedBlood]);

  const filtered = donors.filter((d) => {
    if (onlyAvailable && !d.availability) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nearby Donors"
        subtitle="Donors within your area from live database"
        breadcrumbs={[{ label: "Patient", path: "/patient/dashboard" }, { label: "Nearby Donors" }]}
      />

      {/* Google Resource Map — shows hospitals, blood banks, emergency requests */}
      <GoogleResourceMap
        initialFilter="ALL"
        initialBloodGroup={selectedBlood || ""}
        mapHeight="420px"
        showDonorClusters={true}
        className="w-full"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {BLOOD_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedBlood(selectedBlood === g ? "" : g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedBlood === g
                  ? "bg-red-600 text-white"
                  : "bg-card border border-border text-muted-foreground hover:border-red-300"
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
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <Loader2 className="animate-spin text-red-600 mr-2" size={24} />
          <span className="text-muted-foreground text-sm">Loading donors from database...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl text-center text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">No donors found matching the selected criteria.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((d) => {
            const initials = d.name
              ? d.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "D";
            return (
              <div
                key={d.id}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar initials={initials} />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
                          d.availability ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{d.name || "Anonymous Donor"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} />
                        {d.city || "City unavailable"}
                      </div>
                    </div>
                  </div>
                  {d.blood_group && <BloodTypePill type={d.blood_group as BloodGroup} />}
                </div>
                <div className="flex items-center gap-1.5 mb-4">
                  <Circle
                    size={7}
                    fill={d.availability ? "#43A047" : "#9CA3AF"}
                    className={d.availability ? "text-green-500" : "text-gray-400"}
                  />
                  <span className={`text-xs font-medium ${d.availability ? "text-green-600" : "text-muted-foreground"}`}>
                    {d.availability ? "Available to donate" : "Currently Unavailable"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Last donation: {d.last_donation_date || "No recorded donations"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
