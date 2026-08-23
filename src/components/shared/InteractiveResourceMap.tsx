import { useState, useEffect } from "react";
import {
  MapPin,
  Building2,
  Droplets,
  AlertTriangle,
  ExternalLink,
  Phone,
  Navigation,
  Search,
  Filter,
  Layers,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { mapsApi, type MapLocationsData } from "../../services/api";

export interface MapMarker {
  id: string;
  type: "HOSPITAL" | "BLOOD_BANK" | "EMERGENCY_REQUEST";
  name: string;
  city: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  blood_group?: string;
  units_required?: number;
  urgency?: string;
  total_units?: number;
  available_groups?: string[];
}

interface Props {
  initialCity?: string;
  initialType?: "ALL" | "HOSPITAL" | "BLOOD_BANK" | "EMERGENCY";
  className?: string;
  height?: string;
}

export function InteractiveResourceMap({
  initialCity = "",
  initialType = "ALL",
  className = "",
  height = "520px",
}: Props) {
  const [filterType, setFilterType] = useState<"ALL" | "HOSPITAL" | "BLOOD_BANK" | "EMERGENCY">(initialType);
  const [searchQuery, setSearchQuery] = useState(initialCity);
  const [loading, setLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [data, setData] = useState<{
    hospitals: MapMarker[];
    bloodBanks: MapMarker[];
    emergencies: MapMarker[];
  }>({
    hospitals: [],
    bloodBanks: [],
    emergencies: [],
  });

  const loadLocations = async (cityQuery?: string) => {
    setLoading(true);
    try {
      const res = await mapsApi.getLocations(cityQuery ? { city: cityQuery } : undefined);
      const hospitals: MapMarker[] = (res?.hospitals || []).map((h: any) => ({
        id: h.id,
        type: "HOSPITAL",
        name: h.name || h.hospital_name,
        city: h.city,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude,
        phone: h.phone,
      }));

      const bloodBanks: MapMarker[] = (res?.blood_banks || []).map((b: any) => ({
        id: b.id,
        type: "BLOOD_BANK",
        name: b.name || b.blood_bank_name,
        city: b.city,
        address: b.address,
        latitude: b.latitude,
        longitude: b.longitude,
        phone: b.phone,
        total_units: b.total_units,
        available_groups: b.available_groups,
      }));

      const emergencies: MapMarker[] = (res?.emergency_requests || []).map((e: any) => ({
        id: e.id,
        type: "EMERGENCY_REQUEST",
        name: `Emergency: ${e.blood_group} (${e.units_required} Units)`,
        city: e.city,
        address: e.hospital_name ? `${e.hospital_name}, ${e.city}` : e.city,
        latitude: e.latitude,
        longitude: e.longitude,
        blood_group: e.blood_group,
        units_required: e.units_required,
        urgency: e.urgency,
      }));

      setData({ hospitals, bloodBanks, emergencies });
      if (!selectedMarker && (hospitals.length > 0 || bloodBanks.length > 0)) {
        setSelectedMarker(hospitals[0] || bloodBanks[0]);
      }
    } catch {
      // Fallback empty state
      setData({ hospitals: [], bloodBanks: [], emergencies: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations(searchQuery);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLocations(searchQuery.trim());
  };

  const allMarkers: MapMarker[] = [
    ...(filterType === "ALL" || filterType === "HOSPITAL" ? data.hospitals : []),
    ...(filterType === "ALL" || filterType === "BLOOD_BANK" ? data.bloodBanks : []),
    ...(filterType === "ALL" || filterType === "EMERGENCY" ? data.emergencies : []),
  ];

  const activeMarker = selectedMarker || allMarkers[0];

  // Open directions link
  const openDirections = (marker: MapMarker) => {
    const query = encodeURIComponent(`${marker.name}, ${marker.city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <div className={`bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col ${className}`}>
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city (e.g. Bengaluru, Mumbai)"
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </form>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "ALL", label: "All Facilities", count: data.hospitals.length + data.bloodBanks.length + data.emergencies.length },
            { key: "HOSPITAL", label: "Hospitals", count: data.hospitals.length },
            { key: "BLOOD_BANK", label: "Blood Banks", count: data.bloodBanks.length },
            { key: "EMERGENCY", label: "Emergencies", count: data.emergencies.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterType(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterType === tab.key
                  ? "bg-red-600 text-white shadow-2xs"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border hover:bg-muted"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterType === tab.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => loadLocations(searchQuery)}
            disabled={loading}
            aria-label="Refresh locations"
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-auto shrink-0"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Map + Directory Grid */}
      <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border" style={{ minHeight: height }}>
        {/* Left Interactive List Directory */}
        <div className="lg:col-span-1 max-h-96 lg:max-h-[520px] overflow-y-auto p-3 space-y-2">
          {allMarkers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MapPin size={32} className="text-muted-foreground/40 mx-auto mb-3" />
              <div className="font-semibold text-foreground text-xs">No locations registered</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                No facilities found in "{searchQuery || "all cities"}". Try searching another area.
              </p>
            </div>
          ) : (
            allMarkers.map((m) => {
              const isSelected = activeMarker?.id === m.id;
              const isHospital = m.type === "HOSPITAL";
              const isBloodBank = m.type === "BLOOD_BANK";
              const isEmergency = m.type === "EMERGENCY_REQUEST";

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMarker(m)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-red-50 dark:bg-red-950/30 border-red-500 ring-1 ring-red-500 shadow-2xs"
                      : "bg-background border-border hover:border-red-200 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white ${
                        isHospital
                          ? "bg-blue-600"
                          : isBloodBank
                          ? "bg-red-600"
                          : "bg-amber-600"
                      }`}
                    >
                      {isHospital ? (
                        <Building2 size={14} />
                      ) : isBloodBank ? (
                        <Droplets size={14} />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-foreground truncate">{m.name}</span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            isHospital
                              ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              : isBloodBank
                              ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {m.type.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">{m.address || m.city}</div>
                      {isBloodBank && typeof m.total_units === "number" && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          Stock: {m.total_units} units available
                        </div>
                      )}
                      {isEmergency && m.urgency && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                          Urgency: {m.urgency}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Map Canvas & Details Header */}
        <div className="lg:col-span-2 flex flex-col relative bg-muted/20">
          {/* Active Marker Highlight Banner */}
          {activeMarker && (
            <div className="p-4 bg-background/95 backdrop-blur-sm border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-10 shadow-2xs">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                    activeMarker.type === "HOSPITAL"
                      ? "bg-blue-600"
                      : activeMarker.type === "BLOOD_BANK"
                      ? "bg-red-600"
                      : "bg-amber-600"
                  }`}
                >
                  {activeMarker.type === "HOSPITAL" ? (
                    <Building2 size={18} />
                  ) : activeMarker.type === "BLOOD_BANK" ? (
                    <Droplets size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{activeMarker.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {activeMarker.address || activeMarker.city} • Lat: {activeMarker.latitude.toFixed(4)}, Lng: {activeMarker.longitude.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => openDirections(activeMarker)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Navigation size={12} /> Get Directions <ExternalLink size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Interactive OpenStreetMap Canvas */}
          <div className="flex-1 w-full min-h-[340px] relative bg-slate-100 dark:bg-slate-900">
            {activeMarker ? (
              <iframe
                title="Clinical Map View"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "340px" }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeMarker.longitude - 0.04}%2C${activeMarker.latitude - 0.03}%2C${activeMarker.longitude + 0.04}%2C${activeMarker.latitude + 0.03}&layer=mapnik&marker=${activeMarker.latitude}%2C${activeMarker.longitude}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-center p-6 text-muted-foreground text-xs">
                Select a facility from the left list to view precise geolocation coordinates and routing.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
