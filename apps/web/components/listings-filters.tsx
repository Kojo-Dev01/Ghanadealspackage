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

const PRICE_OPTIONS = [
  { label: "No Min", value: "" },
  { label: "GH₵ 50,000", value: "50000" },
  { label: "GH₵ 100,000", value: "100000" },
  { label: "GH₵ 200,000", value: "200000" },
  { label: "GH₵ 500,000", value: "500000" },
  { label: "GH₵ 1,000,000", value: "1000000" },
  { label: "GH₵ 2,000,000", value: "2000000" },
  { label: "GH₵ 5,000,000", value: "5000000" },
];

const MAX_PRICE_OPTIONS = [
  { label: "No Max", value: "" },
  { label: "GH₵ 100,000", value: "100000" },
  { label: "GH₵ 200,000", value: "200000" },
  { label: "GH₵ 500,000", value: "500000" },
  { label: "GH₵ 1,000,000", value: "1000000" },
  { label: "GH₵ 2,000,000", value: "2000000" },
  { label: "GH₵ 5,000,000", value: "5000000" },
  { label: "GH₵ 10,000,000", value: "10000000" },
];

export function ListingsFilters({ q, listingType, type, minPrice, maxPrice, minBeds, minBaths }: Props) {
  const searchParams = useSearchParams();
  const urlListingType = searchParams.get("listingType") ?? "";
  const urlType = searchParams.get("type") ?? "";

  const [selectedListingType, setSelectedListingType] = useState(urlListingType);
  const [selectedPropertyType, setSelectedPropertyType] = useState(urlType);

  // Sync state when URL changes (e.g. navbar click)
  useEffect(() => {
    setSelectedListingType(urlListingType);
    setSelectedPropertyType(urlType);
  }, [urlListingType, urlType]);

  // Hide beds & baths for New Development, Commercial, and Land
  const hideBedsBaths =
    selectedListingType === "new" ||
    selectedPropertyType === "Commercial" ||
    selectedPropertyType === "Land";

  return (
    <form className="listings-search-bar" action="/listings" method="get" style={{ marginBottom: 20 }}>
      {/* Row 1: Search + Category + Type */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: "100%" }}>
        <input
          className="form-input"
          type="text"
          name="q"
          placeholder="Search location or title"
          defaultValue={q}
          key={`q-${q ?? ""}`}
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

      {/* Row 2: Price + Beds/Baths + Submit */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: "100%", marginTop: 10 }}>
        <select
          className="filter-select"
          name="minPrice"
          defaultValue={minPrice ?? ""}
          key={`minP-${minPrice ?? ""}`}
          style={{ flex: "0 0 auto" }}
        >
          {PRICE_OPTIONS.map((opt) => (
            <option key={`min-${opt.value}`} value={opt.value}>{opt.value ? `Min: ${opt.label}` : "Min Price"}</option>
          ))}
        </select>
        <select
          className="filter-select"
          name="maxPrice"
          defaultValue={maxPrice ?? ""}
          key={`maxP-${maxPrice ?? ""}`}
          style={{ flex: "0 0 auto" }}
        >
          {MAX_PRICE_OPTIONS.map((opt) => (
            <option key={`max-${opt.value}`} value={opt.value}>{opt.value ? `Max: ${opt.label}` : "Max Price"}</option>
          ))}
        </select>

        {!hideBedsBaths && (
          <>
            <select
              className="filter-select"
              name="minBeds"
              defaultValue={minBeds ?? ""}
              key={`beds-${minBeds ?? ""}`}
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
              defaultValue={minBaths ?? ""}
              key={`baths-${minBaths ?? ""}`}
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

        <button className="btn btn-primary" type="submit" style={{ flex: "0 0 auto" }}>Apply</button>
      </div>
    </form>
  );
}
