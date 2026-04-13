"use client";

import { useState, useRef } from "react";

type HeroSectionProps = {
  totalProperties?: number;
  totalAgents?: number;
  totalRegions?: number;
};

/* ── SVG icon helpers ── */
const SearchIcon = () => (
  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
);
const HomeIcon = () => (
  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const PriceIcon = () => (
  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);
const BedIcon = () => (
  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4v16h20V8H12L8 4z"/></svg>
);
const RulerIcon = () => (
  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v4M10 4v4M14 4v4M18 4v4"/></svg>
);
const StatusIcon = () => (
  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

export function HeroSection({ totalProperties = 0, totalAgents = 0, totalRegions = 0 }: HeroSectionProps) {
  const [activeTab, setActiveTab] = useState("buy");
  const locationRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const priceRef = useRef<HTMLSelectElement>(null);
  const bedsRef = useRef<HTMLSelectElement>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();

    // Tab → listing/property type
    if (activeTab === "buy") params.set("listingType", "sale");
    else if (activeTab === "rent") params.set("listingType", "rent");
    else if (activeTab === "new") params.set("listingType", "new");
    else if (activeTab === "commercial") params.set("type", "Commercial");
    else if (activeTab === "land") params.set("type", "Land");

    // Location (all tabs)
    const q = locationRef.current?.value.trim();
    if (q) params.set("q", q);

    // Property type (buy, rent, new only — commercial/land already set type above)
    if (activeTab !== "commercial" && activeTab !== "land") {
      const type = typeRef.current?.value;
      if (type && type !== "Type") params.set("type", type);
    }

    // Price
    const price = priceRef.current?.value;
    if (price && price !== "Price" && price !== "Price/mo") {
      const map: Record<string, [string?, string?]> = {
        "Under ₵100K":     [undefined, "100000"],
        "₵100K - ₵500K":   ["100000", "500000"],
        "₵500K - ₵1M":     ["500000", "1000000"],
        "₵1M - ₵5M":       ["1000000", "5000000"],
        "₵5M+":            ["5000000"],
        "Under ₵500/mo":   [undefined, "500"],
        "₵500 - ₵2K/mo":   ["500", "2000"],
        "₵2K - ₵5K/mo":    ["2000", "5000"],
        "₵5K - ₵15K/mo":   ["5000", "15000"],
        "₵15K+/mo":        ["15000"],
        "Under ₵50K":      [undefined, "50000"],
        "₵50K - ₵200K":    ["50000", "200000"],
        "₵200K - ₵500K":   ["200000", "500000"],
        "₵500K - ₵2M":     ["500000", "2000000"],
        "₵2M+":            ["2000000"],
      };
      const [min, max] = map[price] ?? [];
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }

    // Beds (buy, rent only)
    const beds = bedsRef.current?.value;
    if (beds && beds !== "Beds") {
      const minBeds = parseInt(beds);
      if (minBeds) params.set("minBeds", String(minBeds));
    }

    window.location.href = `/listings?${params.toString()}`;
  };

  function fmt(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`;
    return String(n);
  }

  /* ── Tab-specific filter fields ── */
  const renderFilters = () => {
    switch (activeTab) {
      /* ───── BUY ───── */
      case "buy":
        return (
          <>
            <div className="search-field">
              <HomeIcon />
              <select ref={typeRef} key="buy-type">
                <option>Type</option>
                <option>Apartment</option>
                <option>House</option>
                <option>Villa</option>
                <option>Townhouse</option>
              </select>
            </div>
            <div className="search-field">
              <PriceIcon />
              <select ref={priceRef} key="buy-price">
                <option>Price</option>
                <option>Under ₵100K</option>
                <option>₵100K - ₵500K</option>
                <option>₵500K - ₵1M</option>
                <option>₵1M - ₵5M</option>
                <option>₵5M+</option>
              </select>
            </div>
            <div className="search-field">
              <BedIcon />
              <select ref={bedsRef} key="buy-beds">
                <option>Beds</option>
                <option value="1">1+ Bed</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
                <option value="5">5+ Beds</option>
              </select>
            </div>
          </>
        );

      /* ───── RENT ───── */
      case "rent":
        return (
          <>
            <div className="search-field">
              <HomeIcon />
              <select ref={typeRef} key="rent-type">
                <option>Type</option>
                <option>Apartment</option>
                <option>House</option>
                <option>Villa</option>
                <option>Townhouse</option>
              </select>
            </div>
            <div className="search-field">
              <PriceIcon />
              <select ref={priceRef} key="rent-price">
                <option>Price/mo</option>
                <option>Under ₵500/mo</option>
                <option>₵500 - ₵2K/mo</option>
                <option>₵2K - ₵5K/mo</option>
                <option>₵5K - ₵15K/mo</option>
                <option>₵15K+/mo</option>
              </select>
            </div>
            <div className="search-field">
              <BedIcon />
              <select ref={bedsRef} key="rent-beds">
                <option>Beds</option>
                <option value="1">1+ Bed</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
                <option value="5">5+ Beds</option>
              </select>
            </div>
          </>
        );

      /* ───── NEW PROJECTS ───── */
      case "new":
        return (
          <>
            <div className="search-field">
              <HomeIcon />
              <select ref={typeRef} key="new-type">
                <option>Type</option>
                <option>Apartment</option>
                <option>House</option>
                <option>Villa</option>
                <option>Townhouse</option>
              </select>
            </div>
            <div className="search-field">
              <PriceIcon />
              <select ref={priceRef} key="new-price">
                <option>Price</option>
                <option>Under ₵100K</option>
                <option>₵100K - ₵500K</option>
                <option>₵500K - ₵1M</option>
                <option>₵1M - ₵5M</option>
                <option>₵5M+</option>
              </select>
            </div>
            <div className="search-field">
              <StatusIcon />
              <select key="new-status">
                <option>Status</option>
                <option>Pre-selling</option>
                <option>Under Construction</option>
                <option>Ready for Occupancy</option>
              </select>
            </div>
          </>
        );

      /* ───── COMMERCIAL ───── */
      case "commercial":
        return (
          <>
            <div className="search-field">
              <HomeIcon />
              <select ref={typeRef} key="comm-type">
                <option>Type</option>
                <option>Office Space</option>
                <option>Retail / Shop</option>
                <option>Warehouse</option>
                <option>Hotel / Hospitality</option>
                <option>Mixed-Use</option>
              </select>
            </div>
            <div className="search-field">
              <PriceIcon />
              <select ref={priceRef} key="comm-price">
                <option>Price</option>
                <option>Under ₵100K</option>
                <option>₵100K - ₵500K</option>
                <option>₵500K - ₵1M</option>
                <option>₵1M - ₵5M</option>
                <option>₵5M+</option>
              </select>
            </div>
            <div className="search-field">
              <RulerIcon />
              <select key="comm-size">
                <option>Size</option>
                <option>Under 500 sqft</option>
                <option>500 - 2,000 sqft</option>
                <option>2,000 - 5,000 sqft</option>
                <option>5,000+ sqft</option>
              </select>
            </div>
          </>
        );

      /* ───── LAND ───── */
      case "land":
        return (
          <>
            <div className="search-field">
              <PriceIcon />
              <select ref={priceRef} key="land-price">
                <option>Price</option>
                <option>Under ₵50K</option>
                <option>₵50K - ₵200K</option>
                <option>₵200K - ₵500K</option>
                <option>₵500K - ₵2M</option>
                <option>₵2M+</option>
              </select>
            </div>
            <div className="search-field">
              <RulerIcon />
              <select key="land-size">
                <option>Plot Size</option>
                <option>Up to ¼ Acre</option>
                <option>¼ – ½ Acre</option>
                <option>½ – 1 Acre</option>
                <option>1 – 2 Acres</option>
                <option>2+ Acres</option>
              </select>
            </div>
          </>
        );
    }
  };

  return (
    <section className="hero">
      <div className="hero-bg" style={{ backgroundImage: "url('/legacy/assets/properties/dominik-mCQ-ykj6tQk-unsplash.jpg')" }} />
      <div className="hero-content">
        <h1>Find Your Dream Property in Ghana</h1>
        <p>Ghana&apos;s Premier Property Marketplace</p>
        <div className="hero-stats">
          <div className="stat"><strong>{fmt(totalProperties)}</strong> Properties</div>
          <div className="stat"><strong>{fmt(totalAgents)}</strong> Verified Sellers</div>
          <div className="stat"><strong>{fmt(totalRegions)}</strong> Regions</div>
        </div>

        <div className="search-bar-wrap">
          <div className="search-tabs">
            <button className={`search-tab ${activeTab === "buy" ? "active" : ""}`} onClick={() => setActiveTab("buy")}>Buy</button>
            <button className={`search-tab ${activeTab === "rent" ? "active" : ""}`} onClick={() => setActiveTab("rent")}>Rent</button>
            <button className={`search-tab ${activeTab === "new" ? "active" : ""}`} onClick={() => setActiveTab("new")}>New Projects</button>
            <button className={`search-tab ${activeTab === "commercial" ? "active" : ""}`} onClick={() => setActiveTab("commercial")}>Commercial</button>
            <button className={`search-tab ${activeTab === "land" ? "active" : ""}`} onClick={() => setActiveTab("land")}>Land</button>
          </div>
          <div className="search-bar">
            <div className="search-field" style={{ flex: "2 1 200px" }}>
              <SearchIcon />
              <input ref={locationRef} type="text" placeholder="Location, community, landmark..." />
            </div>
            {renderFilters()}
            <button className="btn btn-primary" onClick={handleSearch}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
