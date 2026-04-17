"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type HeroSectionProps = {
  totalProperties?: number;
  totalAgents?: number;
  totalRegions?: number;
};

/* ── Shared price slider logic (same as listings-filters) ── */
const PRICE_PRESETS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];
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

/* ── Constants ── */
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

/* ── SVG helpers ── */
function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4, flexShrink: 0 }}>
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeroSection({ totalProperties = 0, totalAgents = 0, totalRegions = 0 }: HeroSectionProps) {
  const [activeTab, setActiveTab] = useState("buy");
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [minPriceRaw, setMinPriceRaw] = useState("");
  const [maxPriceRaw, setMaxPriceRaw] = useState("");
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback((key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  /* Price slider derived values */
  const minVal = parsePrice(minPriceRaw);
  const maxVal = parsePrice(maxPriceRaw);
  const minSlider = priceToSlider(minVal);
  const maxSlider = maxVal > 0 ? priceToSlider(maxVal) : SLIDER_MAX;
  const fillLeft = (minSlider / SLIDER_MAX) * 100;
  const fillRight = 100 - (maxSlider / SLIDER_MAX) * 100;

  /* Pill labels */
  const typeLabel = selectedType || "Property Type";
  const bedsBathsLabel = (beds || baths)
    ? [beds ? `${beds}+ Beds` : null, baths ? `${baths}+ Baths` : null].filter(Boolean).join(", ")
    : "Beds & Baths";
  const priceLabel = (minVal > 0 || maxVal > 0)
    ? `${minVal > 0 ? fmtPrice(minVal) : "Any"} – ${maxVal > 0 ? fmtPrice(maxVal) : "Any"}`
    : "Price";

  /* Active states */
  const isTypeActive = selectedType !== "";
  const isBedsBathsActive = beds !== "" || baths !== "";
  const isPriceActive = minVal > 0 || maxVal > 0;

  /* Hide beds & baths for certain tabs/types */
  const hideBedsBaths =
    activeTab === "land" ||
    activeTab === "commercial" ||
    selectedType === "Commercial" ||
    selectedType === "Land";

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (activeTab === "buy") params.set("listingType", "sale");
    else if (activeTab === "rent") params.set("listingType", "rent");
    else if (activeTab === "new") params.set("listingType", "new");
    else if (activeTab === "commercial") params.set("type", "Commercial");
    else if (activeTab === "land") params.set("type", "Land");

    if (query.trim()) params.set("q", query.trim());
    if (selectedType && activeTab !== "commercial" && activeTab !== "land") params.set("type", selectedType);
    if (minVal > 0) params.set("minPrice", String(minVal));
    if (maxVal > 0) params.set("maxPrice", String(maxVal));
    if (beds) params.set("minBeds", beds);
    if (baths) params.set("minBaths", baths);

    window.location.href = `/listings?${params.toString()}`;
  };

  function fmt(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`;
    return String(n);
  }

  return (
    <section className="hero">
      <div className="hero-bg" style={{ backgroundImage: "url('/legacy/assets/properties/dominik-mCQ-ykj6tQk-unsplash.jpg')" }} />
      <div className="hero-content">
        <h1>Find Your Dream Property in Ghana</h1>
        <p>Ghana&apos;s Premier Property Marketplace</p>
        <div className="hero-stats">
          <div className="stat"><strong>{fmt(totalProperties)}</strong> Properties</div>
          <div className="stat"><strong>{fmt(totalAgents)}</strong> Verified Agents</div>
          <div className="stat"><strong>{fmt(totalRegions)}</strong> Regions</div>
        </div>

        <div className="hero-search-panel" ref={panelRef}>
          {/* Tabs */}
          <div className="hero-search-tabs">
            {(
              [
                ["buy", "Buy"],
                ["rent", "Rent"],
                ["new", "New Projects"],
                ["commercial", "Commercial"],
                ["land", "Land"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                className={`hero-search-tab${activeTab === key ? " hero-search-tab--active" : ""}`}
                onClick={() => { setActiveTab(key); setSelectedType(""); }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="hero-search-input-row">
            <svg className="hero-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="hero-search-input"
              type="text"
              placeholder="Search by location, community, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            />
          </div>

          {/* Filter pills row */}
          <div className="hero-filter-row">
            {/* Property Type (not shown for commercial/land tabs) */}
            {activeTab !== "commercial" && activeTab !== "land" && (
              <div className="filter-pill-wrapper">
                <button
                  type="button"
                  className={`hero-pill${isTypeActive ? " hero-pill--active" : ""}${openDropdown === "type" ? " hero-pill--open" : ""}`}
                  onClick={() => toggle("type")}
                >
                  {typeLabel}
                  <ChevronDown />
                </button>
                {openDropdown === "type" && (
                  <div className="hero-dropdown hero-dropdown--scroll">
                    <button
                      type="button"
                      className={`hero-dropdown-item${selectedType === "" ? " hero-dropdown-item--selected" : ""}`}
                      onClick={() => { setSelectedType(""); setOpenDropdown(null); }}
                    >
                      Any Type
                    </button>
                    {PROPERTY_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`hero-dropdown-item${selectedType === t ? " hero-dropdown-item--selected" : ""}`}
                        onClick={() => { setSelectedType(t); setOpenDropdown(null); }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Beds & Baths */}
            {!hideBedsBaths && (
              <div className="filter-pill-wrapper">
                <button
                  type="button"
                  className={`hero-pill${isBedsBathsActive ? " hero-pill--active" : ""}${openDropdown === "bedsbaths" ? " hero-pill--open" : ""}`}
                  onClick={() => toggle("bedsbaths")}
                >
                  {bedsBathsLabel}
                  <ChevronDown />
                </button>
                {openDropdown === "bedsbaths" && (
                  <div className="hero-dropdown hero-dropdown--bedsbaths">
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
                    <button type="button" className="filter-dropdown-done" onClick={() => setOpenDropdown(null)}>Done</button>
                  </div>
                )}
              </div>
            )}

            {/* Price */}
            <div className="filter-pill-wrapper">
              <button
                type="button"
                className={`hero-pill${isPriceActive ? " hero-pill--active" : ""}${openDropdown === "price" ? " hero-pill--open" : ""}`}
                onClick={() => toggle("price")}
              >
                {priceLabel}
                <ChevronDown />
              </button>
              {openDropdown === "price" && (
                <div className="hero-dropdown hero-dropdown--price">
                  <div className="price-range-selects">
                    <input
                      type="text"
                      inputMode="numeric"
                      list="hero-min-presets"
                      className="price-range-input"
                      placeholder="Min Price"
                      value={minFocused ? minPriceRaw : displayPrice(minVal)}
                      onChange={(e) => setMinPriceRaw(e.target.value.replace(/[^0-9]/g, ""))}
                      onFocus={() => setMinFocused(true)}
                      onBlur={() => setMinFocused(false)}
                    />
                    <datalist id="hero-min-presets">
                      {PRICE_PRESETS.map((v) => <option key={v} value={String(v)} />)}
                    </datalist>
                    <span className="price-range-sep">–</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      list="hero-max-presets"
                      className="price-range-input"
                      placeholder="Max Price"
                      value={maxFocused ? maxPriceRaw : displayPrice(maxVal)}
                      onChange={(e) => setMaxPriceRaw(e.target.value.replace(/[^0-9]/g, ""))}
                      onFocus={() => setMaxFocused(true)}
                      onBlur={() => setMaxFocused(false)}
                    />
                    <datalist id="hero-max-presets">
                      {PRICE_PRESETS.map((v) => <option key={v} value={String(v)} />)}
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
                  <button type="button" className="filter-dropdown-done" onClick={() => setOpenDropdown(null)}>Done</button>
                </div>
              )}
            </div>

            {/* Search button */}
            <button className="hero-search-btn" type="button" onClick={handleSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
