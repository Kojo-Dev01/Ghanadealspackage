"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

/* ── Types ── */
type LocationResult = {
  lat: string;
  lng: string;
  location?: string;
  region?: string;
};

type Props = {
  latitude: string;
  longitude: string;
  location?: string;
  region?: string;
  regions: string[];
  onSelect: (result: LocationResult) => void;
  inputCls?: string;
};

/* ── Constants ── */
const GHANA_CENTER = { lat: 7.9465, lng: -1.0232 };
const DEFAULT_ZOOM = 7;
const PLACED_ZOOM = 16;

const LIBRARIES: ("places")[] = ["places"];

const MAP_CONTAINER: React.CSSProperties = { width: "100%", height: 350 };

/* ── Region matching helper ── */
function matchRegion(
  addressComponents: google.maps.GeocoderAddressComponent[],
  knownRegions: string[],
): string | undefined {
  const adminLevel1 = addressComponents.find((c) =>
    c.types.includes("administrative_area_level_1"),
  );
  if (!adminLevel1) return undefined;

  const raw = adminLevel1.long_name.replace(/ Region$/i, "").trim();
  return knownRegions.find(
    (r) => r.toLowerCase() === raw.toLowerCase(),
  );
}

/* ── Extract location name ── */
function extractLocation(
  addressComponents: google.maps.GeocoderAddressComponent[],
): string {
  const parts: string[] = [];
  for (const comp of addressComponents) {
    if (
      comp.types.includes("sublocality") ||
      comp.types.includes("sublocality_level_1") ||
      comp.types.includes("neighborhood") ||
      comp.types.includes("locality")
    ) {
      if (!parts.includes(comp.long_name)) parts.push(comp.long_name);
    }
  }
  return parts.join(", ");
}

/* ── Parse Google Maps link ── */
function parseMapsLink(url: string): { lat: number; lng: number } | null {
  // https://www.google.com/maps/@5.6037,-0.187,15z
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  // https://www.google.com/maps/place/.../@5.6037,-0.187,15z
  const placeMatch = url.match(/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };

  // https://maps.google.com/?q=5.6037,-0.187  or  ?ll=5.6037,-0.187
  const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  // Short links: https://goo.gl/maps/... or https://maps.app.goo.gl/...
  // These redirect — can't parse client-side, but try embedded coords
  const shortMatch = url.match(/(-?\d{1,3}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/);
  if (shortMatch) return { lat: parseFloat(shortMatch[1]), lng: parseFloat(shortMatch[2]) };

  return null;
}

/* ── Component ── */
export function CoordinatePicker({
  latitude,
  longitude,
  location,
  region,
  regions,
  onSelect,
  inputCls = "",
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapsLink, setMapsLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const lat = latitude ? parseFloat(latitude) : undefined;
  const lng = longitude ? parseFloat(longitude) : undefined;
  const hasPin = lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng);
  const center = hasPin ? { lat, lng } : GHANA_CENTER;
  const zoom = hasPin ? PLACED_ZOOM : DEFAULT_ZOOM;

  /* Geocoder helper */
  const getGeocoder = useCallback(() => {
    if (!geocoderRef.current && isLoaded) {
      geocoderRef.current = new google.maps.Geocoder();
    }
    return geocoderRef.current;
  }, [isLoaded]);

  /* Reverse-geocode a latlng → fill location/region */
  const reverseGeocode = useCallback(
    (latLng: { lat: number; lng: number }) => {
      const gc = getGeocoder();
      if (!gc) return;
      gc.geocode({ location: latLng }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const comps = results[0].address_components;
          onSelect({
            lat: latLng.lat.toFixed(7),
            lng: latLng.lng.toFixed(7),
            location: extractLocation(comps) || undefined,
            region: matchRegion(comps, regions) || undefined,
          });
        } else {
          onSelect({
            lat: latLng.lat.toFixed(7),
            lng: latLng.lng.toFixed(7),
          });
        }
      });
    },
    [getGeocoder, onSelect, regions],
  );

  /* Place selected from autocomplete */
  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const latVal = place.geometry.location.lat();
    const lngVal = place.geometry.location.lng();
    const comps = place.address_components ?? [];

    mapRef.current?.panTo({ lat: latVal, lng: lngVal });
    mapRef.current?.setZoom(PLACED_ZOOM);

    onSelect({
      lat: latVal.toFixed(7),
      lng: lngVal.toFixed(7),
      location: extractLocation(comps) || place.name || undefined,
      region: matchRegion(comps, regions) || undefined,
    });
  }, [onSelect, regions]);

  /* Map click → drop pin + reverse geocode */
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const latVal = e.latLng.lat();
      const lngVal = e.latLng.lng();
      reverseGeocode({ lat: latVal, lng: lngVal });
    },
    [reverseGeocode],
  );

  /* Marker drag end */
  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      reverseGeocode({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    },
    [reverseGeocode],
  );

  /* Paste Google Maps link */
  const handleLinkPaste = useCallback(
    (value: string) => {
      setMapsLink(value);
      setLinkError("");
      if (!value.trim()) return;

      const coords = parseMapsLink(value.trim());
      if (!coords) {
        setLinkError("Could not extract coordinates from this link");
        return;
      }
      if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) {
        setLinkError("Invalid coordinates in link");
        return;
      }

      mapRef.current?.panTo(coords);
      mapRef.current?.setZoom(PLACED_ZOOM);
      reverseGeocode(coords);
      setMapsLink("");
    },
    [reverseGeocode],
  );

  /* Loading state */
  if (!isLoaded) {
    return (
      <div className="rounded-lg border border-border p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading map…
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <p className="text-xs text-red-500 mt-2">
        Google Maps API key is missing. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {/* ── Search by address ── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
          Search Address
        </h3>
        <Autocomplete
          onLoad={(ac) => {
            autocompleteRef.current = ac;
            ac.setComponentRestrictions({ country: "gh" });
          }}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Type an address, landmark, or area in Ghana…"
            className={inputCls || "border border-border rounded-lg bg-panel-alt px-3 py-2.5 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 w-full"}
          />
        </Autocomplete>
      </div>

      {/* ── Paste Google Maps link ── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
          Or Paste a Google Maps Link
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={mapsLink}
            onChange={(e) => {
              setMapsLink(e.target.value);
              setLinkError("");
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text");
              e.preventDefault();
              handleLinkPaste(pasted);
            }}
            placeholder="https://maps.google.com/..."
            className={
              (inputCls || "border border-border rounded-lg bg-panel-alt px-3 py-2.5 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20") +
              " flex-1"
            }
          />
          <button
            type="button"
            onClick={() => handleLinkPaste(mapsLink)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors shrink-0"
          >
            Go
          </button>
        </div>
        {linkError && (
          <p className="text-[10px] text-red-500 mt-1">{linkError}</p>
        )}
      </div>

      {/* ── Interactive Map ── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
          Or Click the Map
        </h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER}
            center={center}
            zoom={zoom}
            onClick={onMapClick}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              zoomControl: true,
              gestureHandling: "greedy",
            }}
          >
            {hasPin && (
              <Marker
                position={{ lat: lat!, lng: lng! }}
                draggable
                onDragEnd={onMarkerDragEnd}
              />
            )}
          </GoogleMap>
        </div>
        {hasPin && (
          <p className="text-[10px] text-muted/60 mt-1">
            Drag the pin to adjust the location. Coordinates: {lat!.toFixed(5)}, {lng!.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
