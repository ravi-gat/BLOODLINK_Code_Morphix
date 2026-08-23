"""
Maps and Location API router.

Serves real facility coordinates stored in the PostgreSQL database.
When a facility has no stored coordinates, falls back to a city-level
lookup table so the map is still useful without requiring manual
geocoding of every record.

Uses Google Maps Geocoding API (server-side) to geocode facility
addresses on demand and cache the result back to the database.
All Google Maps API calls are server-side — the API key is never
exposed to frontend clients.

Endpoints:
    GET  /api/maps/locations        — all hospitals, blood banks, emergencies
    GET  /api/maps/nearby           — resources within a radius
    GET  /api/maps/hospitals        — hospital markers only
    GET  /api/maps/blood-banks      — blood-bank markers only
    GET  /api/maps/emergencies      — active emergency request markers
    POST /api/maps/geocode          — geocode an address string (admin)
    GET  /api/maps/reverse-geocode  — city/address from lat/lng
    GET  /api/maps/directions       — navigation URL for a facility

Privacy rules:
    • Donor home addresses are NEVER returned.
    • Patient information is NEVER returned in map responses.
    • Only aggregate donor counts per city are returned.
    • All coordinate inputs are validated server-side.
"""
import math
import logging
import httpx
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.config import settings
from ..core.database import get_db
from ..core.deps import get_current_user, get_admin_user
from ..models.user import User
from ..models.profiles import Hospital, BloodBank, Donor
from ..models.blood import BloodInventory
from ..models.emergency import EmergencyRequest
from ..models.enums import EmergencyStatus, UserStatus
from ..utils.helpers import bg_to_label

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/maps", tags=["Maps & Location"])

# ---------------------------------------------------------------------------
# City coordinate fallback table (when DB lat/lng is NULL)
# Coordinates are well-known city centres, not facility-specific.
# ---------------------------------------------------------------------------
CITY_COORDINATES: Dict[str, tuple[float, float]] = {
    "bengaluru":         (12.9716, 77.5946),
    "bangalore":         (12.9716, 77.5946),
    "mumbai":            (19.0760, 72.8777),
    "delhi":             (28.7041, 77.1025),
    "new delhi":         (28.6139, 77.2090),
    "chennai":           (13.0827, 80.2707),
    "hyderabad":         (17.3850, 78.4867),
    "kolkata":           (22.5726, 88.3639),
    "pune":              (18.5204, 73.8567),
    "ahmedabad":         (23.0225, 72.5714),
    "jaipur":            (26.9124, 75.7873),
    "lucknow":           (26.8467, 80.9462),
    "mysuru":            (12.2958, 76.6394),
    "mysore":            (12.2958, 76.6394),
    "kochi":             (9.9312,  76.2673),
    "coimbatore":        (11.0168, 76.9558),
    "chandigarh":        (30.7333, 76.7794),
    "bhopal":            (23.2599, 77.4126),
    "patna":             (25.5941, 85.1376),
    "thiruvananthapuram":(8.5241,  76.9366),
    "surat":             (21.1702, 72.8311),
    "nagpur":            (21.1458, 79.0882),
    "indore":            (22.7196, 75.8577),
    "visakhapatnam":     (17.6868, 83.2185),
    "mangaluru":         (12.9141, 74.8560),
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_coordinates(
    stored_lat: Optional[float],
    stored_lng: Optional[float],
    city: Optional[str],
    jitter_seed: str = "",
) -> tuple[Optional[float], Optional[float], str]:
    """
    Return (lat, lng, source) for a facility.

    Priority:
    1. Stored DB coordinates (precise geocoded location)
    2. City-level fallback with small deterministic jitter per facility
    3. None, None, 'unavailable'

    'source' is one of: 'database' | 'city_fallback' | 'unavailable'
    """
    if stored_lat is not None and stored_lng is not None:
        return stored_lat, stored_lng, "database"

    if city:
        base = CITY_COORDINATES.get(city.strip().lower())
        if base:
            if jitter_seed:
                h = sum(ord(c) for c in jitter_seed)
                lat = round(base[0] + ((h % 41) - 20) * 0.003, 6)
                lng = round(base[1] + (((h * 7) % 41) - 20) * 0.003, 6)
            else:
                lat, lng = base
            return lat, lng, "city_fallback"

    return None, None, "unavailable"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres (Haversine formula)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


def _validate_coords(lat: float, lng: float) -> None:
    if not (-90.0 <= lat <= 90.0):
        raise HTTPException(status_code=400, detail="latitude must be between -90 and 90.")
    if not (-180.0 <= lng <= 180.0):
        raise HTTPException(status_code=400, detail="longitude must be between -180 and 180.")


def _directions_url(dest_lat: float, dest_lng: float,
                    origin_lat: Optional[float] = None,
                    origin_lng: Optional[float] = None) -> str:
    """Build a Google Maps navigation URL."""
    dest = f"{dest_lat},{dest_lng}"
    if origin_lat is not None and origin_lng is not None:
        return (
            f"https://www.google.com/maps/dir/?api=1"
            f"&origin={origin_lat},{origin_lng}"
            f"&destination={dest}"
        )
    return f"https://www.google.com/maps/dir/?api=1&destination={dest}"


async def _geocode_address(address: str) -> Optional[tuple[float, float]]:
    """
    Geocode an address string using the Google Geocoding API.
    Returns (lat, lng) or None if the API is not configured or fails.
    Coordinates are cached in the DB by the caller.
    """
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={"address": address, "key": api_key},
            )
        data = resp.json()
        if data.get("status") == "OK" and data.get("results"):
            loc = data["results"][0]["geometry"]["location"]
            return round(float(loc["lat"]), 6), round(float(loc["lng"]), 6)
    except Exception as exc:
        logger.warning(f"[Maps] Geocoding failed for '{address}': {exc}")
    return None


# ---------------------------------------------------------------------------
# Response builders
# ---------------------------------------------------------------------------

def _hospital_marker(h: Hospital, user_lat=None, user_lng=None) -> dict:
    lat, lng, source = _resolve_coordinates(h.latitude, h.longitude, h.city, h.id)
    marker: dict[str, Any] = {
        "id": h.id,
        "type": "HOSPITAL",
        "name": h.hospital_name,
        "city": h.city,
        "address": h.address or f"{h.hospital_name}, {h.city}",
        "latitude": lat,
        "longitude": lng,
        "location_source": source,
    }
    if lat and lng and user_lat is not None and user_lng is not None:
        marker["distance_km"] = haversine_km(user_lat, user_lng, lat, lng)
    if lat and lng:
        marker["directions_url"] = _directions_url(lat, lng)
    return marker


def _blood_bank_marker(b: BloodBank, db: Session, user_lat=None, user_lng=None) -> dict:
    lat, lng, source = _resolve_coordinates(b.latitude, b.longitude, b.city, b.id)
    stock = (
        db.query(BloodInventory.blood_group, func.sum(BloodInventory.units_available))
        .filter(BloodInventory.blood_bank_id == b.id)
        .group_by(BloodInventory.blood_group)
        .all()
    )
    inventory = {bg_to_label(bg): int(units) for bg, units in stock}
    total_units = sum(inventory.values())

    marker: dict[str, Any] = {
        "id": b.id,
        "type": "BLOOD_BANK",
        "name": b.name,
        "city": b.city,
        "address": b.address or f"{b.name}, {b.city}",
        "latitude": lat,
        "longitude": lng,
        "location_source": source,
        "total_units": total_units,
        "inventory": inventory,
    }
    if lat and lng and user_lat is not None and user_lng is not None:
        marker["distance_km"] = haversine_km(user_lat, user_lng, lat, lng)
    if lat and lng:
        marker["directions_url"] = _directions_url(lat, lng)
    return marker


def _emergency_marker(e: EmergencyRequest, db: Session, user_lat=None, user_lng=None) -> dict:
    # For emergencies use city fallback — emergency doesn't have its own lat/lng column
    base_coords = CITY_COORDINATES.get((e.city or "").strip().lower())
    lat = lng = None
    if base_coords:
        h = sum(ord(c) for c in e.id)
        lat = round(base_coords[0] + ((h % 41) - 20) * 0.003, 6)
        lng = round(base_coords[1] + (((h * 7) % 41) - 20) * 0.003, 6)

    # If emergency is linked to a hospital, prefer that location
    hospital_name = None
    if e.hospital_id:
        hosp = db.query(Hospital).filter(Hospital.id == e.hospital_id).first()
        if hosp:
            hospital_name = hosp.hospital_name
            if hosp.latitude and hosp.longitude:
                lat, lng = hosp.latitude, hosp.longitude
            elif not lat:
                hc = CITY_COORDINATES.get((hosp.city or "").strip().lower())
                if hc:
                    hh = sum(ord(c) for c in hosp.id)
                    lat = round(hc[0] + ((hh % 41) - 20) * 0.003, 6)
                    lng = round(hc[1] + (((hh * 7) % 41) - 20) * 0.003, 6)

    marker: dict[str, Any] = {
        "id": e.id,
        "type": "EMERGENCY_REQUEST",
        "blood_group": bg_to_label(e.blood_group),
        "units_required": e.units_required,
        "urgency": e.urgency,
        "city": e.city,
        "status": e.status.value,
        "hospital_name": hospital_name,
        "latitude": lat,
        "longitude": lng,
        # Do NOT include patient name, phone, medical notes — privacy
    }
    if lat and lng and user_lat is not None and user_lng is not None:
        marker["distance_km"] = haversine_km(user_lat, user_lng, lat, lng)
    if lat and lng:
        marker["directions_url"] = _directions_url(lat, lng)
    return marker


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/locations")
def get_all_locations(
    city: Optional[str] = None,
    blood_group: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return all map markers: hospitals, blood banks, active emergencies,
    and aggregate donor clusters (city-level only — no individual addresses).
    """
    # Hospitals
    h_q = db.query(Hospital)
    if city:
        h_q = h_q.filter(Hospital.city.ilike(f"%{city.strip()}%"))
    hospitals = [_hospital_marker(h) for h in h_q.all()]

    # Blood Banks
    b_q = db.query(BloodBank)
    if city:
        b_q = b_q.filter(BloodBank.city.ilike(f"%{city.strip()}%"))
    blood_banks = [_blood_bank_marker(b, db) for b in b_q.all()]

    # Active Emergency Requests
    e_q = db.query(EmergencyRequest).filter(
        EmergencyRequest.status.in_([EmergencyStatus.ACTIVE, EmergencyStatus.PENDING])
    )
    if city:
        e_q = e_q.filter(EmergencyRequest.city.ilike(f"%{city.strip()}%"))
    emergencies = [_emergency_marker(e, db) for e in e_q.all()]

    # Donor clusters — city-level counts only (privacy-preserving)
    donor_q = (
        db.query(Donor.city, func.count(Donor.id))
        .join(User, Donor.user_id == User.id)
        .filter(Donor.availability_status == True, User.status == UserStatus.ACTIVE)
        .group_by(Donor.city)
        .all()
    )
    donor_clusters = []
    for d_city, count in donor_q:
        if d_city:
            base = CITY_COORDINATES.get(d_city.strip().lower())
            if base:
                donor_clusters.append({
                    "type": "DONOR_CLUSTER",
                    "city": d_city,
                    "available_donors_count": count,
                    "latitude": base[0],
                    "longitude": base[1],
                })

    return {
        "success": True,
        "hospitals": hospitals,
        "blood_banks": blood_banks,
        "emergency_requests": emergencies,
        "donor_clusters": donor_clusters,
    }


@router.get("/hospitals")
def get_hospital_markers(
    city: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hospital markers only."""
    q = db.query(Hospital)
    if city:
        q = q.filter(Hospital.city.ilike(f"%{city.strip()}%"))
    return {"success": True, "data": [_hospital_marker(h) for h in q.all()]}


@router.get("/blood-banks")
def get_blood_bank_markers(
    city: Optional[str] = None,
    blood_group: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Blood bank markers with live inventory from DB."""
    q = db.query(BloodBank)
    if city:
        q = q.filter(BloodBank.city.ilike(f"%{city.strip()}%"))
    markers = [_blood_bank_marker(b, db) for b in q.all()]

    # Filter by blood group availability
    if blood_group:
        markers = [
            m for m in markers
            if m.get("inventory", {}).get(blood_group, 0) > 0
        ]

    return {"success": True, "data": markers}


@router.get("/emergencies")
def get_emergency_markers(
    city: Optional[str] = None,
    blood_group: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Active/pending emergency request markers."""
    q = db.query(EmergencyRequest).filter(
        EmergencyRequest.status.in_([EmergencyStatus.ACTIVE, EmergencyStatus.PENDING])
    )
    if city:
        q = q.filter(EmergencyRequest.city.ilike(f"%{city.strip()}%"))
    if blood_group:
        from ..utils.helpers import label_to_bg
        bg = label_to_bg(blood_group)
        if bg:
            q = q.filter(EmergencyRequest.blood_group == bg)
    markers = [_emergency_marker(e, db) for e in q.all()]
    return {"success": True, "data": markers}


@router.get("/nearby")
def get_nearby_resources(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(50.0, gt=0, le=500.0),
    blood_group: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return hospitals and blood banks within radius_km of the given coordinates.
    Results are sorted by distance ascending.
    """
    _validate_coords(latitude, longitude)

    # Hospitals
    all_hospitals = db.query(Hospital).all()
    nearby_hospitals = []
    for h in all_hospitals:
        lat, lng, source = _resolve_coordinates(h.latitude, h.longitude, h.city, h.id)
        if lat is None:
            continue
        dist = haversine_km(latitude, longitude, lat, lng)
        if dist <= radius_km:
            m = _hospital_marker(h, latitude, longitude)
            nearby_hospitals.append(m)
    nearby_hospitals.sort(key=lambda x: x.get("distance_km", 9999))

    # Blood Banks
    all_banks = db.query(BloodBank).all()
    nearby_banks = []
    for b in all_banks:
        lat, lng, source = _resolve_coordinates(b.latitude, b.longitude, b.city, b.id)
        if lat is None:
            continue
        dist = haversine_km(latitude, longitude, lat, lng)
        if dist <= radius_km:
            m = _blood_bank_marker(b, db, latitude, longitude)
            if blood_group and m.get("inventory", {}).get(blood_group, 0) == 0:
                continue
            nearby_banks.append(m)
    nearby_banks.sort(key=lambda x: x.get("distance_km", 9999))

    # Active emergencies
    e_q = db.query(EmergencyRequest).filter(
        EmergencyRequest.status.in_([EmergencyStatus.ACTIVE, EmergencyStatus.PENDING])
    )
    if blood_group:
        from ..utils.helpers import label_to_bg
        bg = label_to_bg(blood_group)
        if bg:
            e_q = e_q.filter(EmergencyRequest.blood_group == bg)

    nearby_emergencies = []
    for e in e_q.all():
        m = _emergency_marker(e, db, latitude, longitude)
        if m.get("latitude") is None:
            continue
        dist = m.get("distance_km")
        if dist is not None and dist <= radius_km:
            nearby_emergencies.append(m)
    nearby_emergencies.sort(key=lambda x: x.get("distance_km", 9999))

    return {
        "success": True,
        "user_location": {"latitude": latitude, "longitude": longitude},
        "radius_km": radius_km,
        "hospitals": nearby_hospitals,
        "blood_banks": nearby_banks,
        "emergency_requests": nearby_emergencies,
    }


@router.get("/reverse-geocode")
async def reverse_geocode(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    current_user: User = Depends(get_current_user),
):
    """
    Return city/address for a lat/lng using Google Geocoding API.
    Falls back to the closest city in the lookup table when the API
    is not configured.
    """
    _validate_coords(latitude, longitude)

    api_key = settings.GOOGLE_MAPS_API_KEY
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params={
                        "latlng": f"{latitude},{longitude}",
                        "key": api_key,
                        "result_type": "locality|administrative_area_level_2",
                    },
                )
            data = resp.json()
            if data.get("status") == "OK" and data.get("results"):
                return {
                    "success": True,
                    "formatted_address": data["results"][0].get("formatted_address"),
                    "latitude": latitude,
                    "longitude": longitude,
                    "source": "google_geocoding_api",
                }
        except Exception as exc:
            logger.warning(f"[Maps] Reverse geocode failed: {exc}")

    # Fallback: nearest city from lookup table
    nearest_city = None
    nearest_dist = float("inf")
    for city_name, (clat, clng) in CITY_COORDINATES.items():
        d = haversine_km(latitude, longitude, clat, clng)
        if d < nearest_dist:
            nearest_dist = d
            nearest_city = city_name.title()

    return {
        "success": True,
        "formatted_address": nearest_city,
        "latitude": latitude,
        "longitude": longitude,
        "source": "city_lookup_fallback",
        "note": "Configure GOOGLE_MAPS_API_KEY for precise reverse geocoding.",
    }


@router.post("/geocode")
async def geocode_facility(
    facility_type: str = Query(..., regex="^(hospital|bloodbank)$"),
    facility_id: str = Query(...),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Admin endpoint: geocode a facility address and cache the result in the DB.
    Requires ADMIN role and a configured GOOGLE_MAPS_API_KEY.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GOOGLE_MAPS_API_KEY is not configured. Set it in backend/.env to enable geocoding.",
        )

    if facility_type == "hospital":
        facility = db.query(Hospital).filter(Hospital.id == facility_id).first()
        if not facility:
            raise HTTPException(status_code=404, detail="Hospital not found.")
        address = f"{facility.address or facility.hospital_name}, {facility.city}, India"
    else:
        facility = db.query(BloodBank).filter(BloodBank.id == facility_id).first()
        if not facility:
            raise HTTPException(status_code=404, detail="Blood bank not found.")
        address = f"{facility.address or facility.name}, {facility.city}, India"

    coords = await _geocode_address(address)
    if not coords:
        raise HTTPException(
            status_code=502,
            detail=f"Could not geocode address: {address}. Check the address and try again.",
        )

    lat, lng = coords
    facility.latitude = lat
    facility.longitude = lng
    db.commit()

    return {
        "success": True,
        "facility_id": facility_id,
        "facility_type": facility_type,
        "latitude": lat,
        "longitude": lng,
        "address_geocoded": address,
    }


@router.get("/directions")
def get_directions(
    facility_type: str = Query(..., regex="^(hospital|bloodbank|emergency)$"),
    facility_id: str = Query(...),
    origin_lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    origin_lng: Optional[float] = Query(None, ge=-180.0, le=180.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return a Google Maps navigation URL for a given facility.
    If origin_lat/lng are provided, includes the starting point.
    Opens in Google Maps (browser) or Google Maps app (mobile).
    """
    lat = lng = None

    if facility_type == "hospital":
        h = db.query(Hospital).filter(Hospital.id == facility_id).first()
        if not h:
            raise HTTPException(status_code=404, detail="Hospital not found.")
        lat, lng, _ = _resolve_coordinates(h.latitude, h.longitude, h.city, h.id)

    elif facility_type == "bloodbank":
        b = db.query(BloodBank).filter(BloodBank.id == facility_id).first()
        if not b:
            raise HTTPException(status_code=404, detail="Blood bank not found.")
        lat, lng, _ = _resolve_coordinates(b.latitude, b.longitude, b.city, b.id)

    elif facility_type == "emergency":
        e = db.query(EmergencyRequest).filter(EmergencyRequest.id == facility_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Emergency request not found.")
        # Use linked hospital coordinates if available
        if e.hospital_id:
            h = db.query(Hospital).filter(Hospital.id == e.hospital_id).first()
            if h:
                lat, lng, _ = _resolve_coordinates(h.latitude, h.longitude, h.city, h.id)
        if lat is None:
            base = CITY_COORDINATES.get((e.city or "").strip().lower())
            if base:
                lat, lng = base

    if lat is None or lng is None:
        raise HTTPException(
            status_code=404,
            detail="Location not available for this facility. "
                   "An admin can geocode the address via POST /api/maps/geocode.",
        )

    url = _directions_url(lat, lng, origin_lat, origin_lng)
    return {
        "success": True,
        "directions_url": url,
        "destination": {"latitude": lat, "longitude": lng},
    }
