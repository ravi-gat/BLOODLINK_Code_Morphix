import { useState } from "react";
import { Filter, Star, MapPin, Phone, MessageCircle, Heart, Circle, Zap, Search } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { BloodTypePill } from "../../components/shared/BloodTypePill";
import { Avatar } from "../../components/shared/Avatar";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Toggle } from "../../components/shared/Toggle";
import { EmptyState } from "../../components/shared/EmptyState";
import { DONORS } from "../../data/donors";
import type { BloodGroup } from "../../types";
import type { Donor } from "../../types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../app/components/ui/dialog";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function SearchBloodPage() {
  const [selectedBlood, setSelectedBlood] = useState<BloodGroup | "">("");
  const [city, setCity] = useState("New Delhi");
  const [distance, setDistance] = useState(10);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState("nearest");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestComplete, setRequestComplete] = useState(false);
  const [message, setMessage] = useState("");

  const filtered = DONORS.filter((d) => {
    if (onlyAvailable && !d.available) return false;
    if (onlyVerified && !d.verified) return false;
    if (selectedBlood && d.bloodGroup !== selectedBlood) return false;
    const term = searchTerm.trim().toLowerCase();
    if (term && !`${d.name} ${d.city} ${d.bloodGroup}`.toLowerCase().includes(term)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "donations") return b.totalDonations - a.totalDonations;
    return parseFloat(a.distance ?? "99") - parseFloat(b.distance ?? "99");
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search Blood Donors"
        subtitle="Find compatible, verified donors near you"
        breadcrumbs={[{ label: "Patient", path: "/patient/dashboard" }, { label: "Search Blood" }]}
      />

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search donor by name..."
            aria-label="Search donors"
            data-testid="search-input"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none"
        >
          <option value="nearest">Nearest first</option>
          <option value="rating">Highest rated</option>
          <option value="donations">Most donations</option>
        </select>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 block">Blood Group</label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Distance: {distance} km
                </label>
                <input
                  type="range" min={1} max={50} value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-full accent-red-600"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                  <span>1 km</span><span>50 km</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Available Now</span>
                  <Toggle checked={onlyAvailable} onChange={setOnlyAvailable} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Verified Only</span>
                  <Toggle checked={onlyVerified} onChange={setOnlyVerified} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* AI card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={15} className="text-yellow-300" />
              <span className="font-semibold text-sm">AI Matching</span>
            </div>
            <p className="text-blue-200 text-xs leading-relaxed">
              Our AI ranks donors by compatibility, proximity, and response likelihood for your blood group.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span> donors found near {city || "your location"}
            </p>
            <StatusBadge text="AI Sorted" color="#1565C0" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No donors found"
              description="Try adjusting your filters — remove the availability or blood group filter."
              action={{ label: "Clear Filters", onClick: () => { setSelectedBlood(""); setOnlyAvailable(false); setOnlyVerified(false); } }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((d) => (
                <div key={d.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={d.initials} />
                      <div>
                        <div className="font-semibold text-foreground text-sm">{d.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={10} />{d.distance}
                        </div>
                      </div>
                    </div>
                    <BloodTypePill type={d.bloodGroup} />
                  </div>
                  <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star size={11} fill="#F9A825" className="text-yellow-400" />{d.rating}
                    </span>
                    <span>·</span>
                    <span>{d.totalDonations} donations</span>
                    <span>·</span>
                    <span>{d.responseTime}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-4">
                    <Circle size={8} fill={d.available ? "#43A047" : "#9CA3AF"} className={d.available ? "text-green-500" : "text-gray-400"} />
                    <span className={`text-xs font-medium ${d.available ? "text-green-600" : "text-muted-foreground"}`}>
                      {d.available ? "Available Now" : "Unavailable"}
                    </span>
                    {d.verified && <StatusBadge text="Verified" color="#1565C0" />}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <a href={`tel:${d.phone.replace(/\s/g, "")}`} aria-label={`Call ${d.name}`} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium">
                      <Phone size={12} />Call
                    </a>
                    <button type="button" onClick={() => setMessage(`Chat is not available in this demo. Please call ${d.name} using the contact action.`)} aria-label={`Message ${d.name}`} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-medium">
                      <MessageCircle size={12} />Chat
                    </button>
                    <button
                      disabled={!d.available}
                      type="button"
                      onClick={() => { setSelectedDonor(d); setRequestComplete(false); }}
                      aria-label={`Request blood from ${d.name}`}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        d.available ? "bg-red-600 text-white hover:bg-red-700" : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      <Heart size={12} />Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {message && <p role="status" className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}
        </div>
      </div>
      <Dialog open={Boolean(selectedDonor)} onOpenChange={(open) => { if (!open && !requesting) setSelectedDonor(null); }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{requestComplete ? "Request sent" : "Confirm donor request"}</DialogTitle>
            <DialogDescription>{requestComplete ? `Your request was sent to ${selectedDonor?.name}. They will be notified to respond.` : `Send a blood-request notification to ${selectedDonor?.name} (${selectedDonor?.bloodGroup})?`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {requestComplete ? <button type="button" onClick={() => setSelectedDonor(null)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Close</button> : <>
              <button type="button" data-testid="modal-cancel" onClick={() => setSelectedDonor(null)} disabled={requesting} className="rounded-xl border border-border px-4 py-2 text-sm font-medium">Cancel</button>
              <button type="button" data-testid="modal-confirm" onClick={async () => { setRequesting(true); await new Promise((resolve) => setTimeout(resolve, 700)); setRequesting(false); setRequestComplete(true); }} disabled={requesting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{requesting ? "Sending..." : "Confirm request"}</button>
            </>}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
