import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Filter, Star, MapPin, Phone, MessageCircle, Heart, Circle, Zap, Search, Loader2, Map as MapIcon } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { Avatar } from "../../components/shared/Avatar";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Toggle } from "../../components/shared/Toggle";
import { EmptyState } from "../../components/shared/EmptyState";
import { GoogleResourceMap } from "../../components/shared/GoogleResourceMap";
import { patientApi, type DonorPublic } from "../../services/api";
import type { BloodGroup } from "../../types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../app/components/ui/dialog";
import { toast } from "sonner";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function SearchBloodPage() {
  const [searchParams] = useSearchParams();
  const [selectedBlood, setSelectedBlood] = useState<BloodGroup | "">(
    (searchParams.get("blood_group") as BloodGroup) || ""
  );
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<DonorPublic | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestComplete, setRequestComplete] = useState(false);
  const [donors, setDonors] = useState<DonorPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"donors" | "map">("donors");

  useEffect(() => {
    async function fetchDonors() {
      setLoading(true);
      try {
        const data = await patientApi.getNearbyDonors({
          blood_group: selectedBlood || undefined,
          city: city.trim() || undefined,
        });
        setDonors(data);
      } catch {
        toast.error("Failed to load donors from server.");
      } finally {
        setLoading(false);
      }
    }
    fetchDonors();
  }, [selectedBlood, city]);

  const filtered = donors.filter((d) => {
    if (onlyAvailable && !d.availability) return false;
    const term = searchTerm.trim().toLowerCase();
    if (term && !`${d.name || ""} ${d.city || ""} ${d.blood_group || ""}`.toLowerCase().includes(term))
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search Blood Donors"
        subtitle="Find compatible donors from live database"
        breadcrumbs={[{ label: "Patient", path: "/patient/dashboard" }, { label: "Search Blood" }]}
      />

      {/* Tab switcher */}
      <div className="flex gap-1.5 bg-muted p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("donors")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "donors" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search size={14} /> Donor List
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("map")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "map" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapIcon size={14} /> Find Blood Near Me
        </button>
      </div>

      {/* Map view */}
      {activeTab === "map" && (
        <GoogleResourceMap
          initialFilter="BLOOD_BANK"
          initialBloodGroup={selectedBlood || ""}
          initialCity={city || ""}
          mapHeight="500px"
          showDonorClusters={true}
          className="w-full"
        />
      )}

      {/* Donor list view */}
      {activeTab === "donors" && (<>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search donor by name or city..."
            aria-label="Search donors"
            data-testid="search-input"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={15} className="text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">Filters</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 block">
                  Blood Group
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BLOOD_GROUPS.map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setSelectedBlood(selectedBlood === g ? "" : g)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        selectedBlood === g
                          ? "bg-red-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru, Mumbai..."
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Available Now</span>
                  <Toggle checked={onlyAvailable} onChange={setOnlyAvailable} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* AI card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={15} className="text-yellow-300" />
              <span className="font-semibold text-sm">AI Matching Engine</span>
            </div>
            <p className="text-blue-200 text-xs leading-relaxed">
              Prioritizes compatible donors by blood type compatibility, availability, and response history.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span> donors found in database
            </p>
            <StatusBadge text="Database Verified" color="#1565C0" />
          </div>

          {loading ? (
            <div className="py-16 flex justify-center items-center">
              <Loader2 className="animate-spin text-red-600 mr-2" size={24} />
              <span className="text-muted-foreground text-sm">Searching donors...</span>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No donors found"
              description="No donors match your current filters. Try changing blood group or clearing city search."
              action={{
                label: "Clear Filters",
                onClick: () => {
                  setSelectedBlood("");
                  setCity("");
                  setOnlyAvailable(false);
                },
              }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                        <Avatar initials={initials} />
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
                    <div className="flex items-center gap-1 mb-4">
                      <Circle
                        size={8}
                        fill={d.availability ? "#43A047" : "#9CA3AF"}
                        className={d.availability ? "text-green-500" : "text-gray-400"}
                      />
                      <span className={`text-xs font-medium ${d.availability ? "text-green-600" : "text-muted-foreground"}`}>
                        {d.availability ? "Available Now" : "Unavailable"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">
                      Last Donation: {d.last_donation_date || "No recorded donations"}
                    </div>
                    <button
                      disabled={!d.availability}
                      type="button"
                      onClick={() => {
                        setSelectedDonor(d);
                        setRequestComplete(false);
                      }}
                      aria-label={`Request blood from ${d.name}`}
                      className={`w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        d.availability
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      <Heart size={12} />
                      Request Donation
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </>)}

      <Dialog
        open={Boolean(selectedDonor)}
        onOpenChange={(open) => {
          if (!open && !requesting) setSelectedDonor(null);
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{requestComplete ? "Request sent" : "Confirm donor request"}</DialogTitle>
            <DialogDescription>
              {requestComplete
                ? `Your request notification has been dispatched to ${selectedDonor?.name || "the donor"}.`
                : `Send a blood donation request to ${selectedDonor?.name || "donor"} (${selectedDonor?.blood_group})?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {requestComplete ? (
              <button
                type="button"
                onClick={() => setSelectedDonor(null)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  data-testid="modal-cancel"
                  onClick={() => setSelectedDonor(null)}
                  disabled={requesting}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="modal-confirm"
                  onClick={async () => {
                    if (!selectedDonor) return;
                    setRequesting(true);
                    try {
                      await patientApi.createRequest({
                        blood_group: selectedDonor.blood_group || "O+",
                        units_required: 1,
                        urgency: "High",
                        city: selectedDonor.city || "Bengaluru",
                      });
                      setRequesting(false);
                      setRequestComplete(true);
                      toast.success("Request sent to donor successfully.");
                    } catch {
                      setRequesting(false);
                      toast.error("Failed to submit request.");
                    }
                  }}
                  disabled={requesting}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {requesting ? "Sending..." : "Confirm request"}
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
