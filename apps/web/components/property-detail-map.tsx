"use client";

import { useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from "@react-google-maps/api";

type Props = {
  latitude: number;
  longitude: number;
  title: string;
  image: string;
  priceFormatted: string;
  type: string;
  listingType: string;
};

const LIBRARIES: ("places")[] = ["places"];

const MAP_CONTAINER: React.CSSProperties = {
  width: "100%",
  height: "100%",
};

export function PropertyDetailMap({ latitude, longitude, title, image, priceFormatted, type, listingType }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  if (!isLoaded) {
    return (
      <div style={{ width: "100%", height: 340, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading map…
        </div>
      </div>
    );
  }

  const tagLabel = `${type} for ${listingType === "rent" ? "Rent" : "Sale"}`;

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", height: 340 }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER}
        center={{ lat: latitude, lng: longitude }}
        zoom={16}
        onLoad={onLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          minZoom: 6,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        }}
      >
        {/* Custom marker with image + name */}
        <OverlayViewF
          position={{ lat: latitude, lng: longitude }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div style={{
            transform: "translate(-50%, -100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <div style={{
              background: "var(--bg-card, #fff)",
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              overflow: "hidden",
              width: 160,
              border: "2px solid var(--red, #E63946)",
            }}>
              {image && (
                <div style={{ width: "100%", height: 90, overflow: "hidden" }}>
                  <img
                    src={image}
                    alt={title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              )}
              <div style={{
                padding: "6px 8px",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-primary, #1a1a2e)",
                background: "var(--bg-card, #fff)",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {title}
              </div>
            </div>
            {/* Pointer triangle */}
            <div style={{
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid var(--red, #E63946)",
              marginTop: -1,
            }} />
          </div>
        </OverlayViewF>
      </GoogleMap>

      {/* Property tag — top left */}
      <div style={{
        position: "absolute",
        top: 12,
        left: 12,
        background: "var(--red, #E63946)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        padding: "6px 12px",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        letterSpacing: "0.02em",
        zIndex: 1,
      }}>
        {tagLabel}
      </div>

      {/* Price tag — top right */}
      <div style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: "#fff",
        color: "#111827",
        fontSize: 14,
        fontWeight: 800,
        padding: "6px 12px",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 1,
      }}>
        {priceFormatted}
      </div>

      {/* View on Google Maps — bottom right */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#fff",
          color: "#16a34a",
          fontSize: 13,
          fontWeight: 600,
          padding: "8px 14px",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          textDecoration: "none",
          zIndex: 1,
          transition: "background 0.2s",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        View in Map
      </a>
    </div>
  );
}
