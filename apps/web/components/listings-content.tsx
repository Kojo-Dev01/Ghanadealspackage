"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { PropertyCard } from "./property-card";
import { ListingsFilters, type FiltersState } from "./listings-filters";
import type { PropertyRecord } from "../lib/api";

/* Lazy-load the map so it doesn't block initial paint */
const ListingsMap = dynamic(
  () => import("./listings-map").then((m) => ({ default: m.ListingsMap })),
  { ssr: false },
);

type Props = {
  initialItems: PropertyRecord[];
  initialTotal: number;
  initialPage: number;
  initialFilters: FiltersState;
  limit: number;
};

/* Client-side fetches go directly to API (CORS is configured for localhost:3000) */
const CLIENT_API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

function buildQueryString(filters: FiltersState, page: number, limit: number) {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.listingType) p.set("listingType", filters.listingType);
  if (filters.type) p.set("type", filters.type);
  if (filters.minPrice) p.set("minPrice", filters.minPrice);
  if (filters.maxPrice) p.set("maxPrice", filters.maxPrice);
  if (filters.minBeds) p.set("minBeds", filters.minBeds);
  if (filters.minBaths) p.set("minBaths", filters.minBaths);
  if (page > 1) p.set("page", String(page));
  p.set("limit", String(limit));
  return p.toString();
}

function buildPathname(filters: FiltersState, page: number) {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.listingType) p.set("listingType", filters.listingType);
  if (filters.type) p.set("type", filters.type);
  if (filters.minPrice) p.set("minPrice", filters.minPrice);
  if (filters.maxPrice) p.set("maxPrice", filters.maxPrice);
  if (filters.minBeds) p.set("minBeds", filters.minBeds);
  if (filters.minBaths) p.set("minBaths", filters.minBaths);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return `/listings${qs ? `?${qs}` : ""}`;
}

export function ListingsContent({
  initialItems,
  initialTotal,
  initialPage,
  initialFilters,
  limit,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [view, setViewRaw] = useState<"grid" | "map">("grid");
  /* Restore view=map from URL after hydration */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "map") setViewRaw("map");
  }, []);
  const setView = useCallback((v: "grid" | "map") => {
    setViewRaw(v);
    const url = new URL(window.location.href);
    if (v === "map") url.searchParams.set("view", "map");
    else url.searchParams.delete("view");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  /* ── Fetch from API and update URL ── */
  const fetchResults = useCallback(
    async (newFilters: FiltersState, newPage: number) => {
      // Abort any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      // Only show visual loading indicator after 150ms (avoids flicker on fast responses)
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setShowLoading(true);
      }, 150);

      // Update URL without navigation
      const url = buildPathname(newFilters, newPage);
      window.history.replaceState(null, "", url);

      try {
        const qs = buildQueryString(newFilters, newPage, limit);
        const res = await fetch(`${CLIENT_API}/properties?${qs}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        if (!mountedRef.current) return;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? newPage);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!mountedRef.current) return;
        console.error("[GhanaDeals] Filter fetch failed:", err);
        // Keep stale data visible on error
      } finally {
        if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
        if (mountedRef.current) {
          setLoading(false);
          setShowLoading(false);
        }
      }
    },
    [limit],
  );

  /* ── Callbacks passed to ListingsFilters ── */
  const onFiltersChange = useCallback(
    (newFilters: FiltersState) => {
      setFilters(newFilters);
      setPage(1);
      fetchResults(newFilters, 1);
    },
    [fetchResults],
  );

  const goToPage = useCallback(
    (p: number) => {
      setPage(p);
      fetchResults(filters, p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [fetchResults, filters],
  );

  const mappableCount = items.filter(
    (p) => p.latitude != null && p.longitude != null,
  ).length;

  /* ── Grid + Pagination ── */
  const gridBlock = (
    <>
      <div style={{ position: "relative", minHeight: 200 }}>
        <div
          className="property-grid"
          style={{
            opacity: showLoading ? 0.55 : 1,
            transition: "opacity 0.2s ease",
            pointerEvents: loading ? "none" : undefined,
          }}
        >
          {items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {items.length === 0 && !loading && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "var(--text-secondary)",
            }}
          >
            <p style={{ fontSize: 16, marginBottom: 8 }}>
              No properties match your filters.
            </p>
            <button
              className="btn btn-outline"
              style={{ marginTop: 12 }}
              onClick={() =>
                onFiltersChange({
                  q: "",
                  listingType: "",
                  type: "",
                  minPrice: "",
                  maxPrice: "",
                  minBeds: "",
                  minBaths: "",
                })
              }
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav style={{ marginTop: 40, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {page > 1 ? (
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                className="listings-page-btn"
              >
                ← Prev
              </button>
            ) : (
              <span className="listings-page-btn listings-page-btn--disabled">← Prev</span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - page) <= 2,
              )
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e-${i}`}
                    style={{
                      padding: "8px 4px",
                      color: "var(--text-tertiary)",
                      fontSize: 14,
                    }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    className={`listings-page-btn${p === page ? " listings-page-btn--active" : ""}`}
                    style={{ minWidth: 40 }}
                  >
                    {p}
                  </button>
                ),
              )}

            {page < totalPages ? (
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                className="listings-page-btn listings-page-btn--next"
              >
                Next →
              </button>
            ) : (
              <span className="listings-page-btn listings-page-btn--disabled">Next →</span>
            )}
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: 12,
              fontSize: 13,
              color: "var(--text-tertiary)",
            }}
          >
            Page {page} of {totalPages} · Showing{" "}
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
            {total} properties
          </div>
        </nav>
      )}
    </>
  );

  /* ── MAP FULLSCREEN VIEW (PropertyFinder style) ── */
  if (view === "map") {
    return (
      <div className="listings-fullmap">
        {/* Filters bar stays visible above the map */}
        <div className="listings-fullmap-filters">
          <ListingsFilters
            initialFilters={initialFilters}
            onFiltersChange={onFiltersChange}
          />
          {showLoading && (
            <div className="listings-progress-track">
              <div className="listings-progress-bar" />
            </div>
          )}
        </div>

        {/* Map fills remaining space */}
        <div className="listings-fullmap-body">
          {/* Exit Map button */}
          <button
            type="button"
            className="listings-exit-map"
            onClick={() => setView("grid")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
            </svg>
            Exit Map
          </button>
          <ListingsMap
            properties={items}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />
        </div>
      </div>
    );
  }

  /* ── GRID VIEW ── */
  return (
    <>
      <ListingsFilters
        initialFilters={initialFilters}
        onFiltersChange={onFiltersChange}
      />

      {/* Thin progress bar — right below filters */}
      <div className="listings-progress-track">
        {showLoading && <div className="listings-progress-bar" />}
      </div>

      {/* Header row: title + map button */}
      <div className="listings-header-row">
        <h1 className="listings-title">
          Properties in Ghana
          <span className="listings-count">{total.toLocaleString()} listed</span>
        </h1>
        <button
          type="button"
          className="listings-map-btn"
          onClick={() => setView("map")}
          disabled={mappableCount === 0}
          title={mappableCount === 0 ? "No properties have map coordinates" : `View ${mappableCount} properties on map`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Map
          {mappableCount > 0 && (
            <span className="listings-map-btn-count">{mappableCount}</span>
          )}
        </button>
      </div>

      {gridBlock}
    </>
  );
}
