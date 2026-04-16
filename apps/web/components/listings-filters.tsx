"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

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

function sliderToPrice(step: number): number {
  if (step <= 0) return 0;
  if (step >= SLIDER_MAX) return LOG_MAX;
  const raw = LOG_MIN * Math.exp(LOG_RATIO * (step / SLIDER_MAX));
  if (raw >= 1_000_000) return Math.round(raw / 100_000) * 100_000;
  if (raw >= 100_000) return Math.round(raw / 10_000) * 10_000;
  if (raw >= 10_000) return Math.round(raw / 5_000) * 5_000;
  return Math.round(raw / 1_000) * 1_000;
}

function priceToSlider(price: number): number {
  if (price <= 0) return 0;
  const clamped = Math.max(LOG_MIN, Math.min(LOG_MAX, price));
  return Math.round(SLIDER_MAX * Math.log(clamped / LOG_MIN) / LOG_RATIO);
}

function fmtPrice(v: number): string {
  if (v >= 1_000_000) return `GH₵ ${(v / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  if (v >= 1_000) return `GH₵ ${(v / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`;
  if (v > 0) return `GH₵ ${v.toLocaleString()}`;
  return "Any";
}

function displayPrice(v: number): string {
  return v > 0 ? v.toLocaleString() : "";
}

function parsePrice(s: string): number {
  const n = Number(s.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const LISTING_TYPES = [
  { value: "", label: "All" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "new", label: "New Development" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
];

const PROPERTY_TYPES = [
  "Apartment", "House", "Villa", "Townhouse", "Penthouse", "Compound",
  "Duplex", "Bungalow", "Full Floor", "Half Floor", "Whole Building",
  "Land", "Commercial", "Office", "Bulk Sale Unit", "Hotel & Hotel Apartment",
];

const BED_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

const BATH_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

/* Chevron SVG for pill buttons */
function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4, flexShrink: 0 }}>
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Search icon */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--text-tertiary)" }}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function ListingsFilters({ q, listingType, type, minPrice, maxPrice, minBeds, minBaths }: Props) {
  const searchParams = useSearchParams();

  const urlQ = searchParams.get("q") ?? "";
  const urlListingType = searchParams.get("listingType") ?? "";
  const urlType = searchParams.get("type") ?? "";
  const urlMinPrice = searchParams.get("minPrice") ?? "";
  const urlMaxPrice = searchParams.get("maxPrice") ?? "";
  const urlMinBeds = searchParams.get("minBeds") ?? "";
  const urlMinBaths = searchParams.get("minBaths") ?? "";

  const [search, setSearch] = useState(urlQ);
  const [selectedListingType, setSelectedListingType] = useState(urlListingType);
  const [selectedPropertyType, setSelectedPropertyType] = useState(urlType);
  const [minPriceRaw, setMinPriceRaw] = useState(urlMinPrice || minPrice || "");
  const [maxPriceRaw, setMaxPriceRaw] = useState(urlMaxPrice || maxPrice || "");
  const [beds, setBeds] = useState(urlMinBeds);
  const [baths, setBaths] = useState(urlMinBaths);

  useEffect(() => {
    setSearch(urlQ);
    setSelectedListingType(urlListingType);
    setSelectedPropertyType(urlType);
    setMinPriceRaw(urlMinPrice);
    setMaxPriceRaw(urlMaxPrice);
    setBeds(urlMinBeds);
    setBaths(urlMinBaths);
  }, [urlQ, urlListingType, urlType, urlMinPrice, urlMaxPrice, urlMinBeds, urlMinBaths]);

  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  const minVal = parsePrice(minPriceRaw);
  const maxVal = parsePrice(maxPriceRaw);
  const minSlider = priceToSlider(minVal);
  const maxSlider = maxVal > 0 ? priceToSlider(maxVal) : SLIDER_MAX;
  const fillLeft = (minSlider / SLIDER_MAX) * 100;
  const fillRight = 100 - (maxSlider / SLIDER_MAX) * 100;

  /* ── Dropdown state ── */
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const barRef = useRef<HTMLFormElement>(null);

  const toggle = useCallback((key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, []);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const hideBedsBaths =
    selectedListingType === "new" ||
    selectedPropertyType === "Commercial" ||
    selectedPropertyType === "Land";

  /* ── Pill labels that reflect current selection ── */
  const listingLabel = LISTING_TYPES.find((l) => l.value === selectedListingType)?.label ?? "All";
  const typeLabel = selectedPropertyType || "Property type";
  const bedsBathsLabel = (beds || baths)
    ? [beds ? `${beds}+ Beds` : null, baths ? `${baths}+ Baths` : null].filter(Boolean).join(", ")
    : "Beds & Baths";
  const priceLabel = (minVal > 0 || maxVal > 0)
    ? `${minVal > 0 ? fmtPrice(minVal) : "Any"} – ${maxVal > 0 ? fmtPrice(maxVal) : "Any"}`
    : "Price";

  /* Active state for pills */
  const isListingActive = selectedListingType !== "";
  const isTypeActive = selectedPropertyType !== "";
  const isBedsBathsActive = beds !== "" || baths !== "";
  const isPriceActive = minVal > 0 || maxVal > 0;

  return (
    <form ref={barRef} className="filter-bar" action="/listings" method="get" style={{ marginBottom: 24 }}>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="minPrice" value={minPriceRaw} />
      <input type="hidden" name="maxPrice" value={maxPriceRaw} />
      <input type="hidden" name="listingType" value={selectedListingType} />
      <input type="hidden" name="type" value={selectedPropertyType} />
      <input type="hidden" name="minBeds" value={beds} />
      <input type="hidden" name="minBaths" value={baths} />

      {/* ── Search bar ── */}
      <div className="filter-search-row">
        <SearchIcon />
        <input
          className="filter-search-input"
          type="text"
          name="q"
          placeholder="Search by location, title, or keyword"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Pills row ── */}
      <div className="filter-pills-row">
        {/* Listing Type */}
        <div className="filter-pill-wrapper">
          <button
            type="button"
            className={`filter-pill${isListingActive ? " filter-pill--active" : ""}${openDropdown === "listing" ? " filter-pill--open" : ""}`}
            onClick={() => toggle("listing")}
          >
            {listingLabel}
            <ChevronDown />
          </button>
          {openDropdown === "listing" && (
            <div className="filter-dropdown">
              {LISTING_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`filter-dropdown-item${selectedListingType === opt.value ? " filter-dropdown-item--selected" : ""}`}
                  onClick={() => { setSelectedListingType(opt.value); setOpenDropdown(null); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Property Type */}
        <div className="filter-pill-wrapper">
          <button
            type="button"
            className={`filter-pill${isTypeActive ? " filter-pill--active" : ""}${openDropdown === "type" ? " filter-pill--open" : ""}`}
            onClick={() => toggle("type")}
          >
            {typeLabel}
            <ChevronDown />
          </button>
          {openDropdown === "type" && (
            <div className="filter-dropdown filter-dropdown--scroll">
              <button
                type="button"
                className={`filter-dropdown-item${selectedPropertyType === "" ? " filter-dropdown-item--selected" : ""}`}
                onClick={() => { setSelectedPropertyType(""); setOpenDropdown(null); }}
              >
                Any Type
              </button>
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`filter-dropdown-item${selectedPropertyType === t ? " filter-dropdown-item--selected" : ""}`}
                  onClick={() => { setSelectedPropertyType(t); setOpenDropdown(null); }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Beds & Baths (combined pill) */}
        {!hideBedsBaths && (
          <div className="filter-pill-wrapper">
            <button
              type="button"
              className={`filter-pill${isBedsBathsActive ? " filter-pill--active" : ""}${openDropdown === "bedsbaths" ? " filter-pill--open" : ""}`}
              onClick={() => toggle("bedsbaths")}
            >
              {bedsBathsLabel}
              <ChevronDown />
            </button>
            {openDropdown === "bedsbaths" && (
              <div className="filter-dropdown filter-dropdown--bedsbaths">
                <div className="filter-dropdown-section">
                  <span className="filter-dropdown-label">Bedrooms</span>
                  <div className="filter-option-pills">
                    {BED_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`filter-option-chip${beds === opt.value ? " filter-option-chip--selected" : ""}`}
                        onClick={() => setBeds(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-dropdown-section">
                  <span className="filter-dropdown-label">Bathrooms</span>
                  <div className="filter-option-pills">
                    {BATH_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`filter-option-chip${baths === opt.value ? " filter-option-chip--selected" : ""}`}
                        onClick={() => setBaths(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="filter-dropdown-done"
                  onClick={() => setOpenDropdown(null)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div className="filter-pill-wrapper">
          <button
            type="button"
            className={`filter-pill${isPriceActive ? " filter-pill--active" : ""}${openDropdown === "price" ? " filter-pill--open" : ""}`}
            onClick={() => toggle("price")}
          >
            {priceLabel}
            <ChevronDown />
          </button>
          {openDropdown === "price" && (
            <div className="filter-dropdown filter-dropdown--price">
              <div className="price-range-selects">
                <input
                  type="text"
                  inputMode="numeric"
                  list="gd-min-presets"
                  className="price-range-input"
                  placeholder="Min Price"
                  value={minFocused ? minPriceRaw : displayPrice(minVal)}
                  onChange={(e) => setMinPriceRaw(e.target.value.replace(/[^0-9]/g, ""))}
                  onFocus={() => setMinFocused(true)}
                  onBlur={() => setMinFocused(false)}
                />
                <datalist id="gd-min-presets">
                  {PRICE_PRESETS.map((v) => (
                    <option key={v} value={String(v)} />
                  ))}
                </datalist>
                <span className="price-range-sep">–</span>
                <input
                  type="text"
                  inputMode="numeric"
                  list="gd-max-presets"
                  className="price-range-input"
                  placeholder="Max Price"
                  value={maxFocused ? maxPriceRaw : displayPrice(maxVal)}
                  onChange={(e) => setMaxPriceRaw(e.target.value.replace(/[^0-9]/g, ""))}
                  onFocus={() => setMaxFocused(true)}
                  onBlur={() => setMaxFocused(false)}
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
                    setMinPriceRaw(sliderToPrice(step) > 0 ? String(sliderToPrice(step)) : "");
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
              <button
                type="button"
                className="filter-dropdown-done"
                onClick={() => setOpenDropdown(null)}
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Apply / Search button */}
        <button className="filter-pill filter-pill--search" type="submit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Search
        </button>
      </div>
    </form>
  );
}
