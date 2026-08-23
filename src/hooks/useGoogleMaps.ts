/**
 * useGoogleMaps — loads the Google Maps JavaScript API once globally
 * and exposes readiness state to any component that needs it.
 *
 * The script is injected into <head> on first mount and is not injected
 * again on subsequent calls (idempotent).
 *
 * VITE_GOOGLE_MAPS_API_KEY must be set in .env for the map to render.
 * When the key is absent the hook returns { ready: false, error: "..." }
 * and the component should show a graceful fallback.
 */
import { useState, useEffect } from "react";

const GOOGLE_MAPS_SCRIPT_ID = "bloodlink-google-maps-script";

let _loadPromise: Promise<void> | null = null;

function loadScript(apiKey: string): Promise<void> {
  if (_loadPromise) return _loadPromise;

  _loadPromise = new Promise((resolve, reject) => {
    // Already loaded (e.g. HMR reload)
    if (typeof window.google !== "undefined" && window.google.maps) {
      resolve();
      return;
    }

    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      // Script tag exists but Maps not yet defined — wait
      const check = setInterval(() => {
        if (typeof window.google !== "undefined" && window.google.maps) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps API."));
    document.head.appendChild(script);
  });

  return _loadPromise;
}

interface UseGoogleMapsResult {
  ready: boolean;
  error: string | null;
}

export function useGoogleMaps(): UseGoogleMapsResult {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError(
        "VITE_GOOGLE_MAPS_API_KEY is not set. Add it to your .env file to enable the map."
      );
      return;
    }

    loadScript(apiKey)
      .then(() => setReady(true))
      .catch((err) => setError(err.message ?? "Failed to load Google Maps."));
  }, [apiKey]);

  return { ready, error };
}
