"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

type Props = {
  q?: string;
  listingType?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  minBaths?: string;
};

/* Unified price stops: index 0 = "no limit", 1-8 = actual price values */
const PRICE_STOPS = [0, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];
const STOP_MAX = PRICE_STOPS.length - 1;

function fmtPrice(v: number): string {
  if (v >= 1_000_000) return `GH₵ ${v / 1_000_000}M`;
  if (v >= 1_000) return `GH₵ ${(v / 1_000).toLocaleString()}K`;
  if (v > 0) return `GH₵ ${v.toLocaleString()}`;
  return "Any";
}

/** Map a raw price string to the nearest stop index */
function valToIdx(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const n = Number(val);
  if (!n) return fallback;
  // Exact match
  const exact = PRICE_STOPS.indexOf(n);
  if (exact >= 0) return exact;
  // Snap to nearest stop
  let best = fallback;
  let bestDist = Infinity;
  for (let i = 0; i < PRICE_STOPS.length; i++) {
    const dist = Math.abs(PRICE_STOPS[i] - n);
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

export function ListingsFilters({ q, listingType, type, minPrice, maxPrice, minBeds, minBaths }: Props) {
  const searchParams = useSearchParams();

  /* Read all URL params as source of truth */
  const urlQ = searchParams.get("q") ?? "";
  const urlListingType = searchParams.get("listingType") ?? "";
  const urlType = searchParams.get("type") ?? "";
  const urlMinPrice = searchParams.get("minPrice") ?? "";
  const urlMaxPrice = searchParams.get("maxPrice") ?? "";
  const urlMinBeds = searchParams.get("minBeds") ?? "";
  const urlMinBaths = searchParams.get("minBaths") ?? "";

  /* All filters are controlled state, synced from URL */
  const [search, setSearch] = useState(urlQ);
  const [selectedListingType, setSelectedListingType] = useState(urlListingType);
  const [selectedPropertyType, setSelectedPropertyType] = useState(urlType);
  const [minIdx, setMinIdx] = useState(() => valToIdx(urlMinPrice || minPrice, 0));
  const [maxIdx, setMaxIdx] = useState(() => valToIdx(urlMaxPrice || maxPrice, STOP_MAX));
  const [beds, setBeds] = useState(urlMinBeds);
  const [baths, setBaths] = useState(urlMinBaths);

  /* Re-sync everything when the URL changes (e.g. navigating from home page) */
  useEffect(() => {
    setSearch(urlQ);
    setSelectedListingType(urlListingType);
    setSelectedPropertyType(urlType);
    setMinIdx(valToIdx(urlMinPrice || undefined, 0));
    setMaxIdx(valToIdx(urlMaxPrice || undefined, STOP_MAX));
    setBeds(urlMinBeds);
    setBaths(urlMinBaths);
  }, [urlQ, urlListingType, urlType, urlMinPrice, urlMaxPrice, urlMinBeds, urlMinBaths]);

  /* Form values derived from slider indices */
  const minPriceVal = minIdx === 0 ? "" : String(PRICE_STOPS[minIdx]);
  const maxPriceVal = maxIdx === STOP_MAX ? "" : String(PRICE_STOPS[maxIdx]);

  /* Track fill position */
  const fillLeft = (minIdx / STOP_MAX) * 100;
  const fillRight = 100 - (maxIdx / STOP_MAX) * 100;

  /* Detect whether user changed anything from the current URL state */
  const dirty =
    search !== urlQ ||
    selectedListingType !== urlListingType ||
    selectedPropertyType !== urlType ||
    minPriceVal !== urlMinPrice ||
    maxPriceVal !== urlMaxPrice ||
    beds !== urlMinBeds ||
    baths !== urlMinBaths;

  const hideBedsBaths =
    selectedListingType === "new" ||
    selectedPropertyType === "Commercial" ||
    selectedPropertyType === "Land";

  return (
    <form className="listings-search-bar" action="/listings" method="get" style={{ marginBottom: 20 }}>
      {/* Hidden price inputs for form submission */}
      <input type="hidden" name="minPrice" value={minPriceVal} />
      <input type="hidden" name="maxPrice" value={maxPriceVal} />

      {/* Row 1: Search + Category + Type */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: "100%" }}>
        <input
          className="form-input"
          type="text"
          name="q"
          placeholder="Search location or title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1 1 200px", minWidth: 0 }}
        />
        <select
          className="filter-select"
          name="listingType"
          value={selectedListingType}
          onChange={(e) => setSelectedListingType(e.target.value)}
          style={{ flex: "0 0 auto" }}
        >
          <option value="">All</option>
          <option value="sale">For Sale</option>
          <option value="rent">For Rent</option>
          <option value="new">New Development</option>
        </select>
        <select
          className="filter-select"
          name="type"
          value={selectedPropertyType}
          onChange={(e) => setSelectedPropertyType(e.target.value)}
          style={{ flex: "0 0 auto" }}
        >
          <option value="">Any Type</option>
          <option value="Apartment">Apartment</option>
          <option value="House">House</option>
          <option value="Villa">Villa</option>
          <option value="Townhouse">Townhouse</option>
          <option value="Commercial">Commercial</option>
          <option value="Land">Land</option>
        </select>
      </div>

      {/* Row 2: Price Range + Beds/Baths + Apply */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: "100%", marginTop: 10, alignItems: "flex-start" }}>
        {/* Price Range Widget — dropdowns + synced slider */}
        <div className="price-range-widget">
          <div className="price-range-selects">
            <select
              className="filter-select"
              value={minPriceVal}
              onChange={(e) => {
                const idx = valToIdx(e.target.value || undefined, 0);
                setMinIdx(Math.min(idx, maxIdx));
              }}
              style={{ flex: 1, minWidth: 0 }}
            >
              <option value="">Min Price</option>
              {PRICE_STOPS.slice(1).map((v) => (
                <option key={`min-${v}`} value={String(v)}>Min: {fmtPrice(v)}</option>
              ))}
            </select>
            <span style={{ color: "var(--text-tertiary)", fontSize: 14, lineHeight: 1 }}>–</span>
            <select
              className="filter-select"
              value={maxPriceVal}
              onChange={(e) => {
                const idx = valToIdx(e.target.value || undefined, STOP_MAX);
                setMaxIdx(Math.max(idx, minIdx));
              }}
              style={{ flex: 1, minWidth: 0 }}
            >
              <option value="">Max Price</option>
              {PRICE_STOPS.slice(1).map((v) => (
                <option key={`max-${v}`} value={String(v)}>Max: {fmtPrice(v)}</option>
              ))}
            </select>
          </div>
          <div className="price-range-track">
            <div className="track-bg" />
            <div className="track-fill" style={{ left: `${fillLeft}%`, right: `${fillRight}%` }} />
            <input
              type="range"
              min={0}
              max={STOP_MAX}
              value={minIdx}
              onChange={(e) => setMinIdx(Math.min(Number(e.target.value), maxIdx))}
            />
            <input
              type="range"
              min={0}
              max={STOP_MAX}
              value={maxIdx}
              onChange={(e) => setMaxIdx(Math.max(Number(e.target.value), minIdx))}
            />
          </div>
          {(minIdx > 0 || maxIdx < STOP_MAX) && (
            <div className="price-range-label">
              {minIdx === 0 ? "No Min" : fmtPrice(PRICE_STOPS[minIdx])} – {maxIdx === STOP_MAX ? "No Max" : fmtPrice(PRICE_STOPS[maxIdx])}
            </div>
          )}
        </div>

        {!hideBedsBaths && (
          <>
            <select
              className="filter-select"
              name="minBeds"
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
              style={{ flex: "0 0 auto" }}
            >
              <option value="">Beds</option>
              <option value="1">1+ Bed</option>
              <option value="2">2+ Beds</option>
              <option value="3">3+ Beds</option>
              <option value="4">4+ Beds</option>
              <option value="5">5+ Beds</option>
            </select>
            <select
              className="filter-select"
              name="minBaths"
              value={baths}
              onChange={(e) => setBaths(e.target.value)}
              style={{ flex: "0 0 auto" }}
            >
              <option value="">Baths</option>
              <option value="1">1+ Bath</option>
              <option value="2">2+ Baths</option>
              <option value="3">3+ Baths</option>
              <option value="4">4+ Baths</option>
            </select>
          </>
        )}

        <button
          className={`btn ${dirty ? "btn-primary" : "btn-outline"}`}
          type="submit"
          disabled={!dirty}
          style={{ flex: "0 0 auto", opacity: dirty ? 1 : 0.5, cursor: dirty ? "pointer" : "default" }}
        >
          Apply
        </button>
      </div>
    </form>
  );
}
