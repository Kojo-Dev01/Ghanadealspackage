"use client";

import { useState, useRef } from "react";

type HeroSectionProps = {
  totalProperties?: number;
  totalAgents?: number;
};

export function HeroSection({ totalProperties = 0, totalAgents = 0 }: HeroSectionProps) {
  const [activeTab, setActiveTab] = useState("buy");
  const locationRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const priceRef = useRef<HTMLSelectElement>(null);
  const bedsRef = useRef<HTMLSelectElement>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (activeTab === "buy") params.set("listingType", "sale");
    else if (activeTab === "rent") params.set("listingType", "rent");
    else if (activeTab === "new") params.set("listingType", "new");
    else if (activeTab === "commercial") params.set("type", "Commercial");
    else if (activeTab === "land") params.set("type", "Land");

    const q = locationRef.current?.value.trim();
    if (q) params.set("q", q);

    const type = typeRef.current?.value;
    if (type && type !== "Type") params.set("type", type);

    const price = priceRef.current?.value;
    if (price && price !== "Price") {
      if (price === "Under ₵100K") params.set("maxPrice", "100000");
      else if (price === "₵100K - ₵500K") { params.set("minPrice", "100000"); params.set("maxPrice", "500000"); }
      else if (price === "₵500K - ₵1M") { params.set("minPrice", "500000"); params.set("maxPrice", "1000000"); }
      else if (price === "₵1M - ₵5M") { params.set("minPrice", "1000000"); params.set("maxPrice", "5000000"); }
      else if (price === "₵5M+") params.set("minPrice", "5000000");
    }

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

  return (
    <section className="hero">
      <div className="hero-bg" style={{ backgroundImage: "url('/legacy/assets/properties/large_property-villa-1.jpg')" }} />
      <div className="hero-content">
        <h1>Find Your Dream Property in Ghana</h1>
        <p>Ghana&apos;s Premier Property Marketplace</p>
        <div className="hero-stats">
          <div className="stat"><strong>{fmt(totalProperties)}</strong> Properties</div>
          <div className="stat"><strong>{fmt(totalAgents)}</strong> Verified Agents</div>
          <div className="stat"><strong>16</strong> Regions</div>
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
            <div className="search-field" style={{ flex: 2 }}>
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input ref={locationRef} type="text" placeholder="Location, community, landmark..." />
            </div>
            <div className="search-field">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <select ref={typeRef}>
                <option>Type</option>
                <option>Apartment</option>
                <option>House</option>
                <option>Villa</option>
                <option>Townhouse</option>
                <option>Commercial</option>
                <option>Land</option>
              </select>
            </div>
            <div className="search-field">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              <select ref={priceRef}>
                <option>Price</option>
                <option>Under ₵100K</option>
                <option>₵100K - ₵500K</option>
                <option>₵500K - ₵1M</option>
                <option>₵1M - ₵5M</option>
                <option>₵5M+</option>
              </select>
            </div>
            <div className="search-field">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4v16h20V8H12L8 4z"/></svg>
              <select ref={bedsRef}>
                <option>Beds</option>
                <option value="1">1+ Bed</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
                <option value="5">5+ Beds</option>
              </select>
            </div>
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
