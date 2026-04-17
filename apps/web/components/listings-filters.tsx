"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type FiltersState = {
  q: string;
  listingType: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
};

type Props = {
  initialFilters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
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
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6+", label: "6+" },
];

const BATH_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6+", label: "6+" },
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

export function ListingsFilters({ initialFilters, onFiltersChange }: Props) {
  const [search, setSearch] = useState(initialFilters.q);
  const [selectedListingType, setSelectedListingType] = useState(initialFilters.listingType);
  const [selectedPropertyType, setSelectedPropertyType] = useState(initialFilters.type);
  const [minPriceRaw, setMinPriceRaw] = useState(initialFilters.minPrice);
  const [maxPriceRaw, setMaxPriceRaw] = useState(initialFilters.maxPrice);
  const [beds, setBeds] = useState(initialFilters.minBeds);
  const [baths, setBaths] = useState(initialFilters.minBaths);

  /** Parse comma-separated bed/bath string into a Set for easy toggle */
  const bedsSet = new Set(beds ? beds.split(",") : []);
  const bathsSet = new Set(baths ? baths.split(",") : []);

  /* Sync from parent when filters are cleared externally */
  const prevFiltersRef = useRef(initialFilters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const next = initialFilters;
    if (
      prev.q !== next.q || prev.listingType !== next.listingType ||
      prev.type !== next.type || prev.minPrice !== next.minPrice ||
      prev.maxPrice !== next.maxPrice || prev.minBeds !== next.minBeds ||
      prev.minBaths !== next.minBaths
    ) {
      if (!searchFocusedRef.current) setSearch(next.q);
      setSelectedListingType(next.listingType);
      setSelectedPropertyType(next.type);
      if (!priceFocusedRef.current && !sliderActiveRef.current) {
        setMinPriceRaw(next.minPrice);
        setMaxPriceRaw(next.maxPrice);
      }
      setBeds(next.minBeds);
      setBaths(next.minBaths);
      prevFiltersRef.current = next;
    }
  }, [initialFilters]);

  /* Track which text fields are focused so external sync doesn't fight typing */
  const searchFocusedRef = useRef(false);
  const priceFocusedRef = useRef(false);
  const sliderActiveRef = useRef(false);

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
  const barRef = useRef<HTMLDivElement>(null);

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

  /* ── Emit helper — builds filters object and calls parent ── */
  const buildFilters = useCallback(
    (overrides: Partial<FiltersState> = {}): FiltersState => ({
      q: overrides.q ?? search,
      listingType: overrides.listingType ?? selectedListingType,
      type: overrides.type ?? selectedPropertyType,
      minPrice: overrides.minPrice ?? minPriceRaw,
      maxPrice: overrides.maxPrice ?? maxPriceRaw,
      minBeds: overrides.minBeds ?? beds,
      minBaths: overrides.minBaths ?? baths,
    }),
    [search, selectedListingType, selectedPropertyType, minPriceRaw, maxPriceRaw, beds, baths],
  );

  /* Keep latest refs so setTimeout closures always read fresh values */
  const buildFiltersRef = useRef(buildFilters);
  const onFiltersChangeRef = useRef(onFiltersChange);
  useEffect(() => { buildFiltersRef.current = buildFilters; }, [buildFilters]);
  useEffect(() => { onFiltersChangeRef.current = onFiltersChange; }, [onFiltersChange]);

  /* Instant emit (discrete filters) */
  const emit = useCallback(
    (overrides: Partial<FiltersState>) => {
      onFiltersChangeRef.current(buildFiltersRef.current(overrides));
    },
    [],
  );

  /* ── Debounce timer for text / slider inputs ── */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedEmit = useCallback(
    (overrides: Partial<FiltersState>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onFiltersChangeRef.current(buildFiltersRef.current(overrides));
      }, 500);
    },
    [],
  );
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  /* ── Instant-apply setters for discrete filters ── */
  const applyListingType = (v: string) => {
    setSelectedListingType(v);
    setOpenDropdown(null);
    emit({ listingType: v });
  };
  const applyPropertyType = (v: string) => {
    setSelectedPropertyType(v);
    setOpenDropdown(null);
    emit({ type: v });
  };
  const applyBeds = (v: string) => {
    const next = new Set(bedsSet);
    if (next.has(v)) next.delete(v); else next.add(v);
    const val = [...next].join(",");
    setBeds(val);
    emit({ minBeds: val });
  };
  const applyBaths = (v: string) => {
    const next = new Set(bathsSet);
    if (next.has(v)) next.delete(v); else next.add(v);
    const val = [...next].join(",");
    setBaths(val);
    emit({ minBaths: val });
  };

  /* ── Clear all filters ── */
  const hasAnyFilter = search || selectedListingType || selectedPropertyType || minPriceRaw || maxPriceRaw || beds || baths;
  const clearFilters = () => {
    setSearch("");
    setSelectedListingType("");
    setSelectedPropertyType("");
    setMinPriceRaw("");
    setMaxPriceRaw("");
    setBeds("");
    setBaths("");
    setOpenDropdown(null);
    onFiltersChange({ q: "", listingType: "", type: "", minPrice: "", maxPrice: "", minBeds: "", minBaths: "" });
  };

  const hideBedsBaths =
    selectedListingType === "new" ||
    selectedPropertyType === "Commercial" ||
    selectedPropertyType === "Land";

  /* ── Pill labels that reflect current selection ── */
  const listingLabel = LISTING_TYPES.find((l) => l.value === selectedListingType)?.label ?? "All";
  const typeLabel = selectedPropertyType || "Property type";
  const bedsBathsLabel = (beds || baths)
    ? [beds ? `${beds} Bed${bedsSet.size > 1 ? "s" : ""}` : null, baths ? `${baths} Bath${bathsSet.size > 1 ? "s" : ""}` : null].filter(Boolean).join(", ")
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
    <div ref={barRef} className="filter-bar" style={{ marginBottom: 24 }}>
      {/* ── Search bar ── */}
      <div className="filter-search-row">
        <SearchIcon />
        <input
          className="filter-search-input"
          type="text"
          placeholder="Search by location, title, or keyword"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            debouncedEmit({ q: e.target.value });
          }}
          onFocus={() => { searchFocusedRef.current = true; }}
          onBlur={() => { searchFocusedRef.current = false; }}
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
                  onClick={() => applyListingType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
              {isListingActive && (
                <button type="button" className="filter-dropdown-clear" onClick={() => applyListingType("")}>
                  Clear
                </button>
              )}
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
                onClick={() => applyPropertyType("")}
              >
                Any Type
              </button>
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`filter-dropdown-item${selectedPropertyType === t ? " filter-dropdown-item--selected" : ""}`}
                  onClick={() => applyPropertyType(t)}
                >
                  {t}
                </button>
              ))}
              {isTypeActive && (
                <button type="button" className="filter-dropdown-clear" onClick={() => applyPropertyType("")}>
                  Clear
                </button>
              )}
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
                  <div className="filter-dropdown-section-header">
                    <span className="filter-dropdown-label">Bedrooms</span>
                    {beds && (
                      <button type="button" className="filter-dropdown-clear-inline" onClick={() => { setBeds(""); emit({ minBeds: "" }); }}>
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="filter-option-pills">
                    {BED_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`filter-option-chip${bedsSet.has(opt.value) ? " filter-option-chip--selected" : ""}`}
                        onClick={() => applyBeds(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-dropdown-section">
                  <div className="filter-dropdown-section-header">
                    <span className="filter-dropdown-label">Bathrooms</span>
                    {baths && (
                      <button type="button" className="filter-dropdown-clear-inline" onClick={() => { setBaths(""); emit({ minBaths: "" }); }}>
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="filter-option-pills">
                    {BATH_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`filter-option-chip${bathsSet.has(opt.value) ? " filter-option-chip--selected" : ""}`}
                        onClick={() => applyBaths(opt.value)}
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
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setMinPriceRaw(v);
                    debouncedEmit({ minPrice: v });
                  }}
                  onFocus={() => { setMinFocused(true); priceFocusedRef.current = true; }}
                  onBlur={() => { setMinFocused(false); priceFocusedRef.current = false; }}
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
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setMaxPriceRaw(v);
                    debouncedEmit({ maxPrice: v });
                  }}
                  onFocus={() => { setMaxFocused(true); priceFocusedRef.current = true; }}
                  onBlur={() => { setMaxFocused(false); priceFocusedRef.current = false; }}
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
                  onPointerDown={() => { sliderActiveRef.current = true; }}
                  onPointerUp={() => { sliderActiveRef.current = false; }}
                  onChange={(e) => {
                    const step = Math.min(Number(e.target.value), maxSlider);
                    const price = sliderToPrice(step);
                    const v = price > 0 ? String(price) : "";
                    setMinPriceRaw(v);
                    debouncedEmit({ minPrice: v });
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={SLIDER_MAX}
                  value={maxSlider}
                  onPointerDown={() => { sliderActiveRef.current = true; }}
                  onPointerUp={() => { sliderActiveRef.current = false; }}
                  onChange={(e) => {
                    const step = Math.max(Number(e.target.value), minSlider);
                    const price = sliderToPrice(step);
                    const v = step < SLIDER_MAX ? String(price) : "";
                    setMaxPriceRaw(v);
                    debouncedEmit({ maxPrice: v });
                  }}
                />
              </div>
              {(minVal > 0 || maxVal > 0) && (
                <div className="price-range-label">
                  {minVal > 0 ? fmtPrice(minVal) : "No Min"} – {maxVal > 0 ? fmtPrice(maxVal) : "No Max"}
                </div>
              )}
              {isPriceActive && (
                <button
                  type="button"
                  className="filter-dropdown-clear"
                  onClick={() => {
                    setMinPriceRaw("");
                    setMaxPriceRaw("");
                    emit({ minPrice: "", maxPrice: "" });
                  }}
                >
                  Clear
                </button>
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

        {/* Clear filters */}
        {hasAnyFilter && (
          <button className="filter-pill filter-pill--clear" type="button" onClick={clearFilters}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
