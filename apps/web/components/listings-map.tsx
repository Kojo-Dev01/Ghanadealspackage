"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayViewF,
  OverlayView,
} from "@react-google-maps/api";
import Image from "next/image";
import Link from "next/link";
import type { PropertyRecord } from "../lib/api";

type Props = {
  properties: PropertyRecord[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
};

const MAP_ID = "ghanadeals-listings";

/* Ghana bounding box */
const GHANA_BOUNDS = {
  north: 11.175,
  south: 4.737,
  east: 1.199,
  west: -3.261,
};

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
  restriction: {
    latLngBounds: GHANA_BOUNDS,
    strictBounds: true,
  },
  minZoom: 5,
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

/* Ghana center fallback */
const GHANA_CENTER = { lat: 7.9465, lng: -1.0232 };
const GHANA_DEFAULT_ZOOM = 6;

function shortPrice(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

/* ── Price tag marker ── */
function PriceMarker({
  property,
  isHovered,
  isSelected,
  onClick,
}: {
  property: PropertyRecord;
  isHovered: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const active = isHovered || isSelected;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`map-price-tag${active ? " map-price-tag--active" : ""}`}
    >
      From {shortPrice(property.price)}
    </button>
  );
}

/* ── Info popup card ── */
function InfoCard({
  property,
  onClose,
}: {
  property: PropertyRecord;
  onClose: () => void;
}) {
  return (
    <div className="map-info-card">
      <button type="button" className="map-info-close" onClick={onClose}>
        ✕
      </button>
      <Link href={`/property/${property.id}`} className="map-info-link">
        <div className="map-info-img">
          <Image
            src={property.image}
            alt={property.title}
            width={280}
            height={160}
            unoptimized
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>
        <div className="map-info-body">
          <div className="map-info-price">{property.priceFormatted}</div>
          <div className="map-info-title">{property.title}</div>
          <div className="map-info-specs">
            {property.beds > 0 && <span>{property.beds} Beds</span>}
            {property.baths > 0 && <span>{property.baths} Baths</span>}
            <span>{property.area} sqm</span>
          </div>
          <div className="map-info-location">{property.location}</div>
        </div>
      </Link>
    </div>
  );
}

export function ListingsMap({ properties, hoveredId, onHover }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mappable = properties.filter(
    (p) => p.latitude != null && p.longitude != null,
  );

  /* Fit bounds when properties change */
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      fitBounds(map, mappable);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (mapRef.current && mappable.length > 0) {
      fitBounds(mapRef.current, mappable);
    }
    setSelectedId(null);
  }, [mappable.length]);

  const selected = selectedId
    ? mappable.find((p) => p.id === selectedId)
    : null;

  if (!isLoaded) {
    return (
      <div className="listings-map-placeholder">
        <div className="listings-spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (mappable.length === 0) {
    return (
      <div className="listings-map-placeholder">
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          No map data available
        </p>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          Properties don&apos;t have coordinates yet.
        </p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerClassName="listings-map-container"
      center={GHANA_CENTER}
      zoom={GHANA_DEFAULT_ZOOM}
      options={MAP_OPTIONS}
      onLoad={onLoad}
      onClick={() => setSelectedId(null)}
    >
      {mappable.map((p) => (
        <OverlayViewF
          key={p.id}
          position={{ lat: p.latitude!, lng: p.longitude! }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <PriceMarker
            property={p}
            isHovered={hoveredId === p.id}
            isSelected={selectedId === p.id}
            onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
          />
        </OverlayViewF>
      ))}

      {selected && (
        <OverlayViewF
          position={{ lat: selected.latitude!, lng: selected.longitude! }}
          mapPaneName={OverlayView.FLOAT_PANE}
        >
          <InfoCard
            property={selected}
            onClose={() => setSelectedId(null)}
          />
        </OverlayViewF>
      )}
    </GoogleMap>
  );
}

function fitBounds(map: google.maps.Map, items: PropertyRecord[]) {
  if (items.length === 0) {
    /* No items — show all of Ghana */
    map.fitBounds(GHANA_BOUNDS, { top: 20, bottom: 20, left: 20, right: 20 });
    return;
  }
  if (items.length === 1) {
    map.setCenter({ lat: items[0].latitude!, lng: items[0].longitude! });
    map.setZoom(14);
    return;
  }
  const bounds = new google.maps.LatLngBounds();
  items.forEach((p) => bounds.extend({ lat: p.latitude!, lng: p.longitude! }));
  map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
}
