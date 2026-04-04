"use client";

import { useState, useEffect, useRef } from "react";
import type { PropertyRecord } from "../lib/api";

type Props = {
  properties: PropertyRecord[];
};

export function ListingsMap({ properties }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mappable = properties.filter((p) => p.latitude != null && p.longitude != null);

  if (mappable.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", background: "var(--panel-alt)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No map data available</p>
        <p style={{ fontSize: 12 }}>Properties in this view don&apos;t have map coordinates yet.</p>
      </div>
    );
  }

  // Calculate center from all mappable properties
  const avgLat = mappable.reduce((s, p) => s + p.latitude!, 0) / mappable.length;
  const avgLng = mappable.reduce((s, p) => s + p.longitude!, 0) / mappable.length;

  // Calculate bounding box for zoom
  const lats = mappable.map((p) => p.latitude!);
  const lngs = mappable.map((p) => p.longitude!);
  const minLat = Math.min(...lats) - 0.01;
  const maxLat = Math.max(...lats) + 0.01;
  const minLng = Math.min(...lngs) - 0.01;
  const maxLng = Math.max(...lngs) + 0.01;

  const selected = selectedId ? mappable.find((p) => p.id === selectedId) : null;

  const fmt = (v: number) =>
    `GHS ${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(v)}`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 320px" : "1fr", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", height: 500 }}>
      <div style={{ position: "relative", height: "100%" }}>
        <iframe
          title="Property map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik`}
        />
        {/* Overlay with clickable property pins */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 8, pointerEvents: "auto", justifyContent: "flex-start", maxHeight: "100%", overflowY: "auto" }}>
            {mappable.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                style={{
                  padding: "4px 8px",
                  background: selectedId === p.id ? "var(--accent)" : "white",
                  color: selectedId === p.id ? "white" : "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(p.price)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div style={{ background: "var(--panel)", borderLeft: "1px solid var(--border)", padding: 16, overflowY: "auto" }}>
          <button onClick={() => setSelectedId(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-secondary)" }}>
            &times;
          </button>
          {selected.image && (
            <img src={selected.image} alt={selected.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />
          )}
          <p style={{ fontWeight: 700, fontSize: 16, color: "var(--accent)", marginBottom: 4 }}>
            {fmt(selected.price)}
          </p>
          <a href={`/property/${selected.id}`} style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", textDecoration: "none" }}>
            {selected.title}
          </a>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            {selected.location}, {selected.region}
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "var(--text-secondary)" }}>
            {selected.beds > 0 && <span>{selected.beds} bed</span>}
            {selected.baths > 0 && <span>{selected.baths} bath</span>}
            {selected.area > 0 && <span>{selected.area} sqft</span>}
          </div>
          <a
            href={`/property/${selected.id}`}
            style={{
              display: "block",
              textAlign: "center",
              padding: "8px 16px",
              marginTop: 16,
              background: "var(--accent)",
              color: "white",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Details
          </a>
        </div>
      )}
    </div>
  );
}
