/**
 * GoogleResourceMap — production-quality healthcare resource map.
 *
 * Features:
 *  - Google Maps JavaScript API rendering
 *  - Hospital, Blood Bank, Emergency Request markers from real DB data
 *  - Aggregate donor-count clusters (city-level only — no individual addresses)
 *  - Current-user geolocation (browser navigator.geolocation)
 *  - Distance display (km) from user location
 *  - "Get Directions" → Google Maps navigation URL
 *  - Filter by category (All / Hospital / Blood Bank / Emergency)
 *  - Blood group filter for blood banks and emergencies
 *  - City search
 *  - Responsive: full-width on mobile, sidebar-detail on desktop
 *  - Loading skeleton, error states, empty states
 *  - No fake data — all markers come from the backend API
 *
 * Privacy rules enforced:
 *  - Donor exact addresses are NEVER shown on the map
 *  - Patient information is NEVER shown
 *  - Only aggregate donor counts per city
 *  - Emergency markers show blood group, urgency, hospital — not patient details
 *
 * Setup:
 *  VITE_GOOGLE_MAPS_API_KEY must be set in .env
 *  Enable: Maps JavaScript API, Places API, Geocoding API in Google Cloud Console
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin, Building2, Droplets, AlertTriangle, Navigation,
  Search, RefreshCw, Locate, Filter, ExternalLink, X,
  Loader2, Users, ChevronRight,
} from "lucide-react";
import { useGoogleMaps } from "../../hooks/useGoogleMaps";
import { mapApi } from "../../services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarkerType = "HOSPITAL" | "BLOOD_BANK" | "EMERGENCY_REQUEST" | "DONOR_CLUSTER";
export type FilterType = "ALL" | "HOSPITAL" | "BLOOD_BANK" | "EMERGENCY";

export interface ResourceMarker {
  id: string;
  type: MarkerType;
  name: string;
  city: string;
  address?: string;
  latitude: number | null;
  longitude: number | null;
  location_source?: string;
  directions_url?: string;
  // Hospital / blood bank extras
  total_units?: number;
  inventory?: Record<string, number>;
  // Emergency extras
  blood_group?: string;
  units_required?: number;
  urgency?: string;
  status?: string;
  hospital_name?: string;
  // Donor cluster
  available_donors_count?: number;
  // Computed
  distance_km?: number;
}

interface Props {
  /** Pre-filter by category */
  initialFilter?: FilterType;
  /** Pre-filter by blood group (e.g. "O+") */
  initialBloodGroup?: string;
  /** Pre-filter by city */
  initialCity?: string;
  /** Height of the map canvas area */
  mapHeight?: string;
  /** Extra className on the root container */
  className?: string;
  /** Show donor clusters — only for roles allowed to see them */
  showDonorClusters?: boolean;
}

// ── Marker colours ────────────────────────────────────────────────────────────

const MARKER_COLORS: Record<MarkerType, string> = {
  HOSPITAL:         "#1565C0",
  BLOOD_BANK:       "#B71C1C",
  EMERGENCY_REQUEST:"#F57F17",
  DONOR_CLUSTER:    "#2E7D32",
};

const URGENCY_COLORS: Record<string, string> = {
  Critical: "#B71C1C",
  High:     "#E65100",
  Moderate: "#F57F17",
  Low:      "#558B2F",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMarkerIcon(
  color: string,
  label: string,
  scale = 1,
): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 0.95,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
    scale: 14 * scale,
    labelOrigin: new google.maps.Point(0, 0),
  } as google.maps.Symbol;
}

function haversineKm(
  lat1: number, lon1: number, lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GoogleResourceMap({
  initialFilter = "ALL",
  initialBloodGroup = "",
  initialCity = "",
  mapHeight = "480px",
  className = "",
  showDonorClusters = false,
}: Props) {
  const { ready: mapsReady, error: mapsError } = useGoogleMaps();

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [filterType, setFilterType] = useState<FilterType>(initialFilter);
  const [bloodGroupFilter, setBloodGroupFilter] = useState(initialBloodGroup);
  const [citySearch, setCitySearch] = useState(initialCity);
  const [showFilters, setShowFilters] = useState(false);

  const [allMarkers, setAllMarkers] = useState<ResourceMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [selectedMarker, setSelectedMarker] = useState<ResourceMarker | null>(null);

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // ── Fetch data from backend ───────────────────────────────────────────────

  const fetchLocations = useCallback(async (city?: string) => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await mapApi.getLocations(city || undefined);
      const combined: ResourceMarker[] = [
        ...(res.hospitals || []).map((h: any): ResourceMarker => ({
          id: h.id, type: "HOSPITAL", name: h.name, city: h.city,
          address: h.address, latitude: h.latitude, longitude: h.longitude,
          location_source: h.location_source, directions_url: h.directions_url,
        })),
        ...(res.blood_banks || []).map((b: any): ResourceMarker => ({
          id: b.id, type: "BLOOD_BANK", name: b.name, city: b.city,
          address: b.address, latitude: b.latitude, longitude: b.longitude,
          location_source: b.location_source, directions_url: b.directions_url,
          total_units: b.total_units, inventory: b.inventory,
        })),
        ...(res.emergency_requests || []).map((e: any): ResourceMarker => ({
          id: e.id, type: "EMERGENCY_REQUEST",
          name: `Emergency: ${e.blood_group}`,
          city: e.city, latitude: e.latitude, longitude: e.longitude,
          directions_url: e.directions_url,
          blood_group: e.blood_group, units_required: e.units_required,
          urgency: e.urgency, status: e.status, hospital_name: e.hospital_name,
        })),
        ...(showDonorClusters ? (res.donor_clusters || []).map((d: any): ResourceMarker => ({
          id: `cluster-${d.city}`, type: "DONOR_CLUSTER",
          name: `${d.available_donors_count} Available Donors`,
          city: d.city, latitude: d.latitude, longitude: d.longitude,
          available_donors_count: d.available_donors_count,
        })) : []),
      ];
      setAllMarkers(combined);
    } catch (err: any) {
      setApiError(err?.message || "Unable to load map data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [showDonorClusters]);

  useEffect(() => { fetchLocations(initialCity || undefined); }, []);

  // ── Initialise Google Map ─────────────────────────────────────────────────

  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;
    if (googleMapRef.current) return; // already initialised

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 12.9716, lng: 77.5946 }, // Bengaluru
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    googleMapRef.current = map;
  }, [mapsReady]);

  // ── Sync markers to map ───────────────────────────────────────────────────

  const visibleMarkers = allMarkers.filter((m) => {
    if (m.latitude == null || m.longitude == null) return false;
    if (filterType !== "ALL") {
      if (filterType === "HOSPITAL" && m.type !== "HOSPITAL") return false;
      if (filterType === "BLOOD_BANK" && m.type !== "BLOOD_BANK") return false;
      if (filterType === "EMERGENCY" && m.type !== "EMERGENCY_REQUEST") return false;
    }
    if (bloodGroupFilter) {
      if (m.type === "BLOOD_BANK") {
        const units = m.inventory?.[bloodGroupFilter] ?? 0;
        if (units <= 0) return false;
      }
      if (m.type === "EMERGENCY_REQUEST" && m.blood_group !== bloodGroupFilter) return false;
    }
    if (citySearch.trim()) {
      const q = citySearch.trim().toLowerCase();
      if (!m.city?.toLowerCase().includes(q) && !m.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  }).map((m) => ({
    ...m,
    distance_km: userLocation
      ? haversineKm(userLocation.lat, userLocation.lng, m.latitude!, m.longitude!)
      : undefined,
  })).sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));

  useEffect(() => {
    const map = googleMapRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (visibleMarkers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    visibleMarkers.forEach((rm) => {
      if (rm.latitude == null || rm.longitude == null) return;
      const pos = { lat: rm.latitude, lng: rm.longitude };

      const color = rm.type === "EMERGENCY_REQUEST"
        ? (URGENCY_COLORS[rm.urgency || ""] || MARKER_COLORS.EMERGENCY_REQUEST)
        : MARKER_COLORS[rm.type];

      const typeLabel = rm.type === "HOSPITAL" ? "H" :
                        rm.type === "BLOOD_BANK" ? "B" :
                        rm.type === "EMERGENCY_REQUEST" ? "!" : "D";

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: rm.name,
        icon: makeMarkerIcon(color, typeLabel),
        label: {
          text: typeLabel,
          color: "#FFFFFF",
          fontWeight: "bold",
          fontSize: "11px",
        },
        animation: rm.type === "EMERGENCY_REQUEST"
          ? google.maps.Animation.BOUNCE
          : undefined,
      });

      // Stop bounce after 2s for emergencies
      if (rm.type === "EMERGENCY_REQUEST") {
        setTimeout(() => marker.setAnimation(null), 2000);
      }

      marker.addListener("click", () => {
        setSelectedMarker(rm);
        infoWindowRef.current?.close();

        const content = buildInfoWindowContent(rm);
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    if (visibleMarkers.length === 1) {
      map.setCenter({ lat: visibleMarkers[0].latitude!, lng: visibleMarkers[0].longitude! });
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, 60);
    }
  }, [visibleMarkers.length, filterType, bloodGroupFilter, citySearch, mapsReady, userLocation]);

  // ── User location ─────────────────────────────────────────────────────────

  const requestUserLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);

        const map = googleMapRef.current;
        if (!map) return;

        userMarkerRef.current?.setMap(null);
        userMarkerRef.current = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          title: "Your Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#1565C0",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 3,
            scale: 10,
          } as google.maps.Symbol,
          zIndex: 1000,
        });

        map.panTo({ lat: latitude, lng: longitude });
        map.setZoom(11);
      },
      (err) => {
        setLocationLoading(false);
        setLocationError(
          err.code === GeolocationPositionError.PERMISSION_DENIED
            ? "Location permission denied. Enable location access in your browser settings."
            : "Unable to determine your location. Please search by city instead."
        );
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // ── Info window content ───────────────────────────────────────────────────

  function buildInfoWindowContent(rm: ResourceMarker): string {
    const dirBtn = rm.directions_url
      ? `<a href="${rm.directions_url}" target="_blank" rel="noopener noreferrer"
           style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:6px 12px;
                  background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;">
           Navigate →
         </a>`
      : "";

    if (rm.type === "HOSPITAL") {
      return `<div style="font-family:sans-serif;max-width:220px;padding:4px">
        <div style="font-weight:700;font-size:13px;color:#111827">${rm.name}</div>
        <div style="color:#6b7280;font-size:11px;margin-top:2px">${rm.address || rm.city}</div>
        <div style="margin-top:6px;display:inline-block;background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600">Hospital</div>
        ${rm.distance_km != null ? `<div style="color:#6b7280;font-size:11px;margin-top:4px">${rm.distance_km} km away</div>` : ""}
        ${dirBtn}
      </div>`;
    }

    if (rm.type === "BLOOD_BANK") {
      const inv = rm.inventory
        ? Object.entries(rm.inventory)
            .filter(([, u]) => u > 0)
            .map(([bg, u]) => `<span style="margin-right:4px">${bg}: <b>${u}</b></span>`)
            .join("")
        : "No inventory data";
      return `<div style="font-family:sans-serif;max-width:240px;padding:4px">
        <div style="font-weight:700;font-size:13px;color:#111827">${rm.name}</div>
        <div style="color:#6b7280;font-size:11px;margin-top:2px">${rm.address || rm.city}</div>
        <div style="margin-top:6px;display:inline-block;background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600">Blood Bank — ${rm.total_units ?? 0} total units</div>
        <div style="margin-top:6px;font-size:11px;color:#374151">${inv}</div>
        ${rm.distance_km != null ? `<div style="color:#6b7280;font-size:11px;margin-top:4px">${rm.distance_km} km away</div>` : ""}
        ${dirBtn}
      </div>`;
    }

    if (rm.type === "EMERGENCY_REQUEST") {
      const urgColor = URGENCY_COLORS[rm.urgency || ""] || "#F57F17";
      return `<div style="font-family:sans-serif;max-width:240px;padding:4px">
        <div style="font-weight:700;font-size:13px;color:#dc2626">🚨 Emergency Blood Request</div>
        <div style="margin-top:4px"><b style="font-size:16px">${rm.blood_group}</b> — ${rm.units_required} unit${(rm.units_required ?? 1) > 1 ? "s" : ""} needed</div>
        <div style="margin-top:4px;display:inline-block;background:${urgColor}22;color:${urgColor};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700">${rm.urgency} urgency</div>
        <div style="color:#6b7280;font-size:11px;margin-top:4px">${rm.hospital_name ? rm.hospital_name + ", " : ""}${rm.city}</div>
        ${rm.distance_km != null ? `<div style="color:#6b7280;font-size:11px;margin-top:2px">${rm.distance_km} km away</div>` : ""}
        ${dirBtn}
      </div>`;
    }

    if (rm.type === "DONOR_CLUSTER") {
      return `<div style="font-family:sans-serif;max-width:200px;padding:4px">
        <div style="font-weight:700;font-size:13px;color:#111827">${rm.city}</div>
        <div style="margin-top:4px;color:#16a34a;font-weight:600">${rm.available_donors_count} available donor${(rm.available_donors_count ?? 1) > 1 ? "s" : ""}</div>
        <div style="color:#6b7280;font-size:11px;margin-top:2px">City-level count (no individual addresses shown)</div>
      </div>`;
    }

    return `<div style="padding:4px"><b>${rm.name}</b><br/>${rm.city}</div>`;
  }

  // ── Open directions externally ────────────────────────────────────────────

  const openDirections = (marker: ResourceMarker) => {
    if (marker.directions_url) {
      window.open(marker.directions_url, "_blank", "noopener,noreferrer");
    } else if (marker.latitude && marker.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${marker.latitude},${marker.longitude}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // ── Counts for filter tabs ────────────────────────────────────────────────

  const counts = {
    ALL: allMarkers.filter(m => m.latitude != null).length,
    HOSPITAL: allMarkers.filter(m => m.type === "HOSPITAL" && m.latitude != null).length,
    BLOOD_BANK: allMarkers.filter(m => m.type === "BLOOD_BANK" && m.latitude != null).length,
    EMERGENCY: allMarkers.filter(m => m.type === "EMERGENCY_REQUEST" && m.latitude != null).length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col ${className}`}>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-border bg-muted/20 space-y-2">
        {/* Search + controls row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLocations(citySearch.trim() || undefined)}
              placeholder="Search city or facility…"
              aria-label="Search city"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchLocations(citySearch.trim() || undefined)}
            disabled={loading}
            aria-label="Refresh map data"
            className="p-1.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={requestUserLocation}
            disabled={locationLoading}
            aria-label="Use my location"
            title="Use my location"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              userLocation
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {locationLoading ? <Loader2 size={13} className="animate-spin" /> : <Locate size={13} />}
            <span className="hidden sm:inline">
              {userLocation ? "Location set" : "My Location"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle blood group filter"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              bloodGroupFilter
                ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <Filter size={13} />
            <span>{bloodGroupFilter || "Blood Group"}</span>
            {bloodGroupFilter && (
              <X size={11} onClick={(e) => { e.stopPropagation(); setBloodGroupFilter(""); }} />
            )}
          </button>
        </div>

        {/* Blood group filter panel */}
        {showFilters && (
          <div className="flex flex-wrap gap-1 pt-1">
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => { setBloodGroupFilter(bloodGroupFilter === bg ? "" : bg); setShowFilters(false); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  bloodGroupFilter === bg
                    ? "bg-red-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        )}

        {/* Category filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(["ALL", "HOSPITAL", "BLOOD_BANK", "EMERGENCY"] as FilterType[]).map((f) => {
            const labels: Record<FilterType, string> = {
              ALL: "All", HOSPITAL: "Hospitals",
              BLOOD_BANK: "Blood Banks", EMERGENCY: "Emergencies",
            };
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === f
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {labels[f]}
                <span className={`text-[10px] px-1 rounded-full ${filterType === f ? "bg-white/20" : "bg-muted"}`}>
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Location errors */}
        {locationError && (
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
            {locationError}
          </p>
        )}
      </div>

      {/* ── Map + Side Panel ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row" style={{ minHeight: mapHeight }}>

        {/* Map canvas */}
        <div className="flex-1 relative" style={{ minHeight: mapHeight }}>
          {/* Google Maps container */}
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: mapHeight }} />

          {/* Overlay states */}
          {!mapsReady && !mapsError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 backdrop-blur-sm gap-3">
              <Loader2 size={28} className="animate-spin text-red-600" />
              <span className="text-sm font-medium text-foreground">Loading Google Maps…</span>
            </div>
          )}

          {mapsError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/60 backdrop-blur-sm gap-3 p-6 text-center">
              <MapPin size={32} className="text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">Map unavailable</p>
              <p className="text-xs text-muted-foreground max-w-xs">{mapsError}</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Set <code className="bg-muted px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in your{" "}
                <code className="bg-muted px-1 rounded">.env</code> file and restart the dev server.
              </p>
            </div>
          )}

          {apiError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs rounded-xl px-4 py-2 shadow-sm max-w-xs text-center">
              {apiError}
            </div>
          )}

          {loading && mapsReady && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> Loading map data…
            </div>
          )}
        </div>

        {/* Side panel — marker list */}
        {visibleMarkers.length > 0 && (
          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border overflow-y-auto bg-background"
            style={{ maxHeight: mapHeight }}>
            <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {visibleMarkers.length} location{visibleMarkers.length !== 1 ? "s" : ""}
              </span>
              {userLocation && (
                <span className="text-[10px] text-muted-foreground">Sorted by distance</span>
              )}
            </div>

            <div className="divide-y divide-border/60">
              {visibleMarkers.map((m) => {
                const isSelected = selectedMarker?.id === m.id;
                const color = m.type === "EMERGENCY_REQUEST"
                  ? (URGENCY_COLORS[m.urgency || ""] || MARKER_COLORS.EMERGENCY_REQUEST)
                  : MARKER_COLORS[m.type];

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMarker(m);
                      if (m.latitude && m.longitude && googleMapRef.current) {
                        googleMapRef.current.panTo({ lat: m.latitude, lng: m.longitude });
                        googleMapRef.current.setZoom(14);
                      }
                    }}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                      isSelected ? "bg-red-50/60 dark:bg-red-950/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5"
                        style={{ backgroundColor: color }}
                      >
                        {m.type === "HOSPITAL" ? "H" :
                         m.type === "BLOOD_BANK" ? "B" :
                         m.type === "EMERGENCY_REQUEST" ? "!" : "D"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {m.address || m.city}
                        </div>
                        {m.type === "BLOOD_BANK" && m.total_units != null && (
                          <div className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">
                            {m.total_units} units available
                          </div>
                        )}
                        {m.type === "EMERGENCY_REQUEST" && (
                          <div className="text-[10px] font-bold mt-0.5" style={{ color }}>
                            {m.blood_group} · {m.urgency}
                          </div>
                        )}
                        {m.distance_km != null && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {m.distance_km} km away
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <ChevronRight size={12} className="text-muted-foreground" />
                        {m.directions_url && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openDirections(m); }}
                            aria-label={`Get directions to ${m.name}`}
                            title="Get directions"
                            className="p-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                          >
                            <Navigation size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state when no visible markers and not loading */}
        {!loading && visibleMarkers.length === 0 && mapsReady && !apiError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <MapPin size={32} className="text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">No locations found</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {bloodGroupFilter
                ? `No ${filterType !== "ALL" ? filterType.toLowerCase().replace("_", " ") : "facilities"} have ${bloodGroupFilter} blood available.`
                : citySearch
                ? `No facilities found in "${citySearch}".`
                : "No registered facilities in the database yet."}
            </p>
            <button
              type="button"
              onClick={() => {
                setCitySearch("");
                setBloodGroupFilter("");
                setFilterType("ALL");
                fetchLocations();
              }}
              className="text-xs text-red-600 underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Footer status ────────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-border bg-muted/10 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {allMarkers.filter(m => m.location_source === "database").length} precise locations ·{" "}
          {allMarkers.filter(m => m.location_source === "city_fallback").length} city-approximate
        </span>
        <span className="flex items-center gap-1">
          <ExternalLink size={10} />
          Powered by Google Maps
        </span>
      </div>
    </div>
  );
}
