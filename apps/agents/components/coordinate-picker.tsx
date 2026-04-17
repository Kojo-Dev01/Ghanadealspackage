"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

const GHANA_BOUNDS = {
  north: 11.175,
  south: 4.737,
  east: 1.199,
  west: -3.261,
};

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
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchValue, setSearchValue] = useState("");

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
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Type an address, landmark, or area in Ghana…"
              className={inputCls ? `${inputCls} w-full pr-8` : "border border-border rounded-lg bg-panel-alt px-3 py-2.5 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 w-full pr-8"}
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  if (searchInputRef.current) searchInputRef.current.value = "";
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        </Autocomplete>
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
              restriction: {
                latLngBounds: GHANA_BOUNDS,
                strictBounds: false,
              },
              minZoom: 6,
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
            Drag the pin to adjust the location.
          </p>
        )}
      </div>
    </div>
  );
}
