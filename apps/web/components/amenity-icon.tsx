/**
 * Maps amenity names → inline SVG icons.
 * Falls back to a generic checkmark for unmatched names.
 */

import type { ReactElement } from "react";

const svgProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ── Icon paths keyed by lowercase amenity pattern ── */
const ICONS: Record<string, ReactElement> = {
  // Pool
  pool: <svg {...svgProps}><path d="M2 12c1.3 1.3 3.2 2 5 2s3.7-.7 5-2c1.3 1.3 3.2 2 5 2s3.7-.7 5-2"/><path d="M2 18c1.3 1.3 3.2 2 5 2s3.7-.7 5-2c1.3 1.3 3.2 2 5 2s3.7-.7 5-2"/><path d="M9 6v6m6-8v8"/></svg>,
  // Gym / Fitness
  gym: <svg {...svgProps}><path d="M6.5 6.5h-2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2"/><path d="M17.5 6.5h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2"/><rect x="6.5" y="4" width="2" height="16" rx="1"/><rect x="15.5" y="4" width="2" height="16" rx="1"/><path d="M8.5 12h7"/></svg>,
  fitness: <svg {...svgProps}><path d="M6.5 6.5h-2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2"/><path d="M17.5 6.5h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2"/><rect x="6.5" y="4" width="2" height="16" rx="1"/><rect x="15.5" y="4" width="2" height="16" rx="1"/><path d="M8.5 12h7"/></svg>,
  // Security / CCTV / Gated
  security: <svg {...svgProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
  cctv: <svg {...svgProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
  gated: <svg {...svgProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
  // Garden
  garden: <svg {...svgProps}><path d="M7 20h10"/><path d="M12 20v-6"/><path d="M12 14C8 14 5 11 5 7c3 0 6 1 7 4 1-3 4-4 7-4 0 4-3 7-7 7"/></svg>,
  // Balcony / Terrace / Rooftop
  balcony: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M8 12v6m4-6v6m4-6v6"/></svg>,
  terrace: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M8 12v6m4-6v6m4-6v6"/></svg>,
  rooftop: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M8 12v6m4-6v6m4-6v6"/></svg>,
  // A/C / Air Conditioning
  "a/c": <svg {...svgProps}><path d="M12 2v10"/><path d="M18.4 6.6 12 12 5.6 6.6"/><path d="M20 12H4"/><path d="M12 12v10"/><path d="M5.6 17.4 12 12l6.4 5.4"/></svg>,
  "air conditioning": <svg {...svgProps}><path d="M12 2v10"/><path d="M18.4 6.6 12 12 5.6 6.6"/><path d="M20 12H4"/><path d="M12 12v10"/><path d="M5.6 17.4 12 12l6.4 5.4"/></svg>,
  // Generator / Backup Power / Solar / Electricity
  generator: <svg {...svgProps}><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>,
  backup: <svg {...svgProps}><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>,
  electricity: <svg {...svgProps}><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>,
  power: <svg {...svgProps}><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>,
  solar: <svg {...svgProps}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>,
  // Water / Borehole
  borehole: <svg {...svgProps}><path d="M12 2v6l-3 3v4a3 3 0 0 0 6 0v-4l-3-3V2"/><path d="M6 12h12"/></svg>,
  water: <svg {...svgProps}><path d="M12 2v6l-3 3v4a3 3 0 0 0 6 0v-4l-3-3V2"/><path d="M6 12h12"/></svg>,
  // WiFi / Internet
  wifi: <svg {...svgProps}><path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>,
  internet: <svg {...svgProps}><path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>,
  // Cable TV
  cable: <svg {...svgProps}><rect x="2" y="7" width="20" height="15" rx="2"/><path d="m17 2-5 5-5-5"/></svg>,
  tv: <svg {...svgProps}><rect x="2" y="7" width="20" height="15" rx="2"/><path d="m17 2-5 5-5-5"/></svg>,
  // Parking / Garage
  parking: <svg {...svgProps}><circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>,
  garage: <svg {...svgProps}><path d="M3 20V9l9-6 9 6v11"/><path d="M3 20h18"/><path d="M5 20v-6h14v6"/><path d="M9 14v6"/></svg>,
  "car port": <svg {...svgProps}><circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>,
  // Elevator
  elevator: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 8 3-3 3 3m-6 8 3 3 3-3"/></svg>,
  lift: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 8 3-3 3 3m-6 8 3 3 3-3"/></svg>,
  // Laundry
  laundry: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="13" r="5"/><circle cx="12" cy="13" r="2"/><path d="M7 6h1m2 0h1"/></svg>,
  // Storage
  storage: <svg {...svgProps}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16"/><path d="m3.27 6.96 8.73 5.04 8.73-5.04M12 22.08V12"/></svg>,
  // Study
  study: <svg {...svgProps}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  // Maid / BQ / Staff / Servant
  maid: <svg {...svgProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  staff: <svg {...svgProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  servant: <svg {...svgProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bq: <svg {...svgProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  concierge: <svg {...svgProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  // Playground / Children
  playground: <svg {...svgProps}><circle cx="12" cy="4" r="2"/><path d="M12 6v4"/><path d="m8 10 4 6 4-6"/><path d="M8 22l2-8m6 8-2-8"/></svg>,
  "children": <svg {...svgProps}><circle cx="12" cy="4" r="2"/><path d="M12 6v4"/><path d="m8 10 4 6 4-6"/><path d="M8 22l2-8m6 8-2-8"/></svg>,
  // Tennis / Basketball
  tennis: <svg {...svgProps}><circle cx="12" cy="12" r="10"/><path d="M18.09 5.91A10.3 10.3 0 0 1 12 8a10.3 10.3 0 0 1-6.09-2.09"/><path d="M18.09 18.09A10.3 10.3 0 0 0 12 16a10.3 10.3 0 0 0-6.09 2.09"/></svg>,
  basketball: <svg {...svgProps}><circle cx="12" cy="12" r="10"/><path d="M18.09 5.91A10.3 10.3 0 0 1 12 8a10.3 10.3 0 0 1-6.09-2.09"/><path d="M18.09 18.09A10.3 10.3 0 0 0 12 16a10.3 10.3 0 0 0-6.09 2.09"/></svg>,
  // Clubhouse
  clubhouse: <svg {...svgProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  // Spa / Sauna / Jacuzzi
  spa: <svg {...svgProps}><path d="M9.5 10C5.4 10 2 6.6 2 2.5"/><path d="M14.5 10c4.1 0 7.5-3.4 7.5-7.5"/><path d="M12 2c-2.5 5-2.5 5-5 7.5S2 17 2 19.5 4 22 6.5 22h11c2.5 0 4.5-2 4.5-4.5S19 11.5 16 9.5"/></svg>,
  sauna: <svg {...svgProps}><path d="M9.5 10C5.4 10 2 6.6 2 2.5"/><path d="M14.5 10c4.1 0 7.5-3.4 7.5-7.5"/><path d="M12 2c-2.5 5-2.5 5-5 7.5S2 17 2 19.5 4 22 6.5 22h11c2.5 0 4.5-2 4.5-4.5S19 11.5 16 9.5"/></svg>,
  jacuzzi: <svg {...svgProps}><path d="M9.5 10C5.4 10 2 6.6 2 2.5"/><path d="M14.5 10c4.1 0 7.5-3.4 7.5-7.5"/><path d="M12 2c-2.5 5-2.5 5-5 7.5S2 17 2 19.5 4 22 6.5 22h11c2.5 0 4.5-2 4.5-4.5S19 11.5 16 9.5"/></svg>,
  // Barbecue
  barbecue: <svg {...svgProps}><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/><path d="M4 12h16"/><path d="m8 16 1.5-4m6.5 4-1.5-4M12 12v10"/></svg>,
  // Fireplace
  fireplace: <svg {...svgProps}><path d="M12 2c-4 4-6 8-6 12a6 6 0 0 0 12 0c0-4-2-8-6-12"/><path d="M12 22a3 3 0 0 1-3-3c0-2 1-4 3-6 2 2 3 4 3 6a3 3 0 0 1-3 3"/></svg>,
  // Walk-in Closet / Wardrobe
  closet: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M9 12h2m2 0h2"/></svg>,
  wardrobe: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M9 12h2m2 0h2"/></svg>,
  // Kitchen
  kitchen: <svg {...svgProps}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3m0 0v7"/></svg>,
  appliances: <svg {...svgProps}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3m0 0v7"/></svg>,
  // Smart Home
  smart: <svg {...svgProps}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
  // Intercom
  intercom: <svg {...svgProps}><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2.05 4.18 2 2 0 0 1 4 2h3.09a2 2 0 0 1 2 1.72c.13.81.36 1.6.66 2.34a2 2 0 0 1-.45 2.11L8 9.49a16 16 0 0 0 6.51 6.51l1.32-1.32a2 2 0 0 1 2.11-.45c.74.3 1.53.53 2.34.66A2 2 0 0 1 22 16.92"/></svg>,
  // Ensuite / Bathroom / Toilet
  ensuite: <svg {...svgProps}><path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1"/><path d="M6 12V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/></svg>,
  toilet: <svg {...svgProps}><path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1"/><path d="M6 12V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/></svg>,
  // Dining
  dining: <svg {...svgProps}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3m0 0v7"/></svg>,
  // View
  view: <svg {...svgProps}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>,
  // Tiled / Flooring / Marble / Granite
  tiled: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M12 3v18M3 12h18"/></svg>,
  flooring: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M12 3v18M3 12h18"/></svg>,
  marble: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M12 3v18M3 12h18"/></svg>,
  granite: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M12 3v18M3 12h18"/></svg>,
  ceiling: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M12 3v18M3 12h18"/></svg>,
  // Fence / Wall / Paved
  fence: <svg {...svgProps}><path d="M4 4v16m4-16v16m4-16v16m4-16v16m4-16v16"/><path d="M2 8h20M2 16h20"/></svg>,
  wall: <svg {...svgProps}><path d="M4 4v16m4-16v16m4-16v16m4-16v16m4-16v16"/><path d="M2 8h20M2 16h20"/></svg>,
  paved: <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M12 3v18M3 12h18"/></svg>,
  // Wheelchair
  wheelchair: <svg {...svgProps}><circle cx="10" cy="5" r="2"/><path d="M4 22s2-4 6-4 4 4 9 4"/><path d="M10 7v5l5 3"/></svg>,
  // Pets
  pet: <svg {...svgProps}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="2" cy="16" r="2"/><path d="M15 19c-2-1-4-1-6 0"/></svg>,
};

function findIcon(name: string): ReactElement | null {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return null;
}

/* ── Default checkmark icon ── */
const CHECK_ICON = (
  <svg {...svgProps} stroke="var(--success, #10b981)">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function AmenityIcon({ name }: { name: string }) {
  return findIcon(name) ?? CHECK_ICON;
}
