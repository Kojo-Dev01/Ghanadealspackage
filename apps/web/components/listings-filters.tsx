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

/* Preset price suggestions shown in datalist */
const PRICE_PRESETS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];

/* Continuous logarithmic slider mapping */
const SLIDER_MAX = 1000;
const LOG_MIN = 10_000;
const LOG_MAX = 20_000_000;
const LOG_RATIO = Math.log(LOG_MAX / LOG_MIN);

/** Map slider position (0–1000) → price. 0 means "no limit". */
function sliderToPrice(step: number): number {
  if (step <= 0) return 0;
  if (step >= SLIDER_MAX) return LOG_MAX;
  const raw = LOG_MIN * Math.exp(LOG_RATIO * (step / SLIDER_MAX));
  if (raw >= 1_000_000) return Math.round(raw / 100_000) * 100_000;
  if (raw >= 100_000) return Math.round(raw / 10_000) * 10_000;
  if (raw >= 10_000) return Math.round(raw / 5_000) * 5_000;
  return Math.round(raw / 1_000) * 1_000;
}

/** Map price → slider position (0–1000). 0 means "no limit". */
function priceToSlider(price: number): number {
  if (price <= 0) return 0;
  const clamped = Math.max(LOG_MIN, Math.min(LOG_MAX, price));
  return Math.round(SLIDER_MAX * Math.log(clamped / LOG_MIN) / LOG_RATIO);
}

/** Compact label for the range summary below slider */
function fmtPrice(v: number): string {
  if (v >= 1_000_000) return `GH₵ ${(v / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  if (v >= 1_000) return `GH₵ ${(v / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`;
  if (v > 0) return `GH₵ ${v.toLocaleString()}`;
  return "Any";
}

/** Display price in the text input (full number with commas) */
function displayPrice(v: number): string {
  return v > 0 ? v.toLocaleString() : "";
}

/** Parse a price string (strips non-numeric chars) */
function parsePrice(s: string): number {
  const n = Number(s.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
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
  const [minPriceRaw, setMinPriceRaw] = useState(urlMinPrice || minPrice || "");
  const [maxPriceRaw, setMaxPriceRaw] = useState(urlMaxPrice || maxPrice || "");
  const [beds, setBeds] = useState(urlMinBeds);
  const [baths, setBaths] = useState(urlMinBaths);

  /* Re-sync everything when the URL changes (e.g. navigating from home page) */
  useEffect(() => {
    setSearch(urlQ);
    setSelectedListingType(urlListingType);
    setSelectedPropertyType(urlType);
    setMinPriceRaw(urlMinPrice);
    setMaxPriceRaw(urlMaxPrice);
    setBeds(urlMinBeds);
    setBaths(urlMinBaths);
  }, [urlQ, urlListingType, urlType, urlMinPrice, urlMaxPrice, urlMinBeds, urlMinBaths]);

  /* Track which price input is focused (show raw number while editing) */
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  /* Derived values */
  const minVal = parsePrice(minPriceRaw);
  const maxVal = parsePrice(maxPriceRaw);
  const minSlider = priceToSlider(minVal);
  const maxSlider = maxVal > 0 ? priceToSlider(maxVal) : SLIDER_MAX;

  /* Track fill position */
  const fillLeft = (minSlider / SLIDER_MAX) * 100;
  const fillRight = 100 - (maxSlider / SLIDER_MAX) * 100;

  /* Detect whether user changed anything from the current URL state */
  const dirty =
    search !== urlQ ||
    selectedListingType !== urlListingType ||
    selectedPropertyType !== urlType ||
    minPriceRaw !== urlMinPrice ||
    maxPriceRaw !== urlMaxPrice ||
    beds !== urlMinBeds ||
    baths !== urlMinBaths;

  const hideBedsBaths =
    selectedListingType === "new" ||
    selectedPropertyType === "Commercial" ||
    selectedPropertyType === "Land";

  return (
    <form className="listings-search-bar" action="/listings" method="get" style={{ marginBottom: 20 }}>
      {/* Hidden price inputs for form submission */}
      <input type="hidden" name="minPrice" value={minPriceRaw} />
      <input type="hidden" name="maxPrice" value={maxPriceRaw} />

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
          <option value="Penthouse">Penthouse</option>
          <option value="Compound">Compound</option>
          <option value="Duplex">Duplex</option>
          <option value="Bungalow">Bungalow</option>
          <option value="Full Floor">Full Floor</option>
          <option value="Half Floor">Half Floor</option>
          <option value="Whole Building">Whole Building</option>
          <option value="Land">Land</option>
          <option value="Commercial">Commercial</option>
          <option value="Office">Office</option>
          <option value="Bulk Sale Unit">Bulk Sale Unit</option>
          <option value="Hotel & Hotel Apartment">Hotel & Hotel Apartment</option>
        </select>
      </div>

      {/* Row 2: Price Range + Beds/Baths + Apply */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: "100%", marginTop: 10, alignItems: "flex-start" }}>
        {/* Price Range Widget — combo inputs + synced slider */}
        <div className="price-range-widget">
          <div className="price-range-selects">
            <input
              type="text"
              inputMode="numeric"
              list="gd-min-presets"
              className="filter-select"
              placeholder="Min Price"
              value={minFocused ? minPriceRaw : displayPrice(minVal)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setMinPriceRaw(raw);
              }}
              onFocus={() => setMinFocused(true)}
              onBlur={() => setMinFocused(false)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <datalist id="gd-min-presets">
              {PRICE_PRESETS.map((v) => (
                <option key={v} value={String(v)} />
              ))}
            </datalist>
            <span style={{ color: "var(--text-tertiary)", fontSize: 14, lineHeight: 1 }}>–</span>
            <input
              type="text"
              inputMode="numeric"
              list="gd-max-presets"
              className="filter-select"
              placeholder="Max Price"
              value={maxFocused ? maxPriceRaw : displayPrice(maxVal)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setMaxPriceRaw(raw);
              }}
              onFocus={() => setMaxFocused(true)}
              onBlur={() => setMaxFocused(false)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <datalist id="gd-max-presets">
              {PRICE_PRESETS.map((v) => (
                <option key={v} value={String(v)} />
              ))}
            </datalist>
          </div>
          <div className="price-range-track">
            <div className="track-bg" />
            <div className="track-fill" style={{ left: `${fillLeft}%`, right: `${fillRight}%` }} />
            <input
              type="range"
              min={0}
              max={SLIDER_MAX}
              value={minSlider}
              onChange={(e) => {
                const step = Math.min(Number(e.target.value), maxSlider);
                const price = sliderToPrice(step);
                setMinPriceRaw(price > 0 ? String(price) : "");
              }}
            />
            <input
              type="range"
              min={0}
              max={SLIDER_MAX}
              value={maxSlider}
              onChange={(e) => {
                const step = Math.max(Number(e.target.value), minSlider);
                const price = sliderToPrice(step);
                setMaxPriceRaw(step < SLIDER_MAX ? String(price) : "");
              }}
            />
          </div>
          {(minVal > 0 || maxVal > 0) && (
            <div className="price-range-label">
              {minVal > 0 ? fmtPrice(minVal) : "No Min"} – {maxVal > 0 ? fmtPrice(maxVal) : "No Max"}
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
