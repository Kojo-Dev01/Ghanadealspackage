import { Suspense } from "react";
import Link from "next/link";
import { fetchProperties } from "../../lib/api";
import { PropertyCard } from "../../components/property-card";
import { SectionHeader } from "../../components/section-header";
import { ExtractedShell } from "../../components/extracted-shell";
import { ListingsFilters } from "../../components/listings-filters";

type ListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const sp = await searchParams;
  const listingType = firstParam(sp.listingType);
  const q = firstParam(sp.q);
  const type = firstParam(sp.type);
  const region = firstParam(sp.region);
  const minPrice = firstParam(sp.minPrice);
  const maxPrice = firstParam(sp.maxPrice);
  const minBeds = firstParam(sp.minBeds);
  const minBaths = firstParam(sp.minBaths);
  const page = Math.max(1, Number(firstParam(sp.page) ?? "1") || 1);
  const limit = 24;

  const result = await fetchProperties({
    listingType,
    q,
    type,
    region,
    minPrice,
    maxPrice,
    minBeds,
    minBaths,
    page,
    limit,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / limit));

  // Build base query string preserving current filters
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (listingType) params.set("listingType", listingType);
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (region) params.set("region", region);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minBeds) params.set("minBeds", minBeds);
    if (minBaths) params.set("minBaths", minBaths);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/listings${qs ? `?${qs}` : ""}`;
  }

  return (
    <ExtractedShell>
      <main>
        <section className="section" style={{ paddingTop: 48 }}>
          <div className="container">
            <SectionHeader
              title="Listings"
              subtitle={`${result.total} properties found`}
              action={<Link href="/" className="btn btn-outline">Home</Link>}
            />

            <Suspense>
              <ListingsFilters
                q={q}
                listingType={listingType}
                type={type}
                minPrice={minPrice}
                maxPrice={maxPrice}
                minBeds={minBeds}
                minBaths={minBaths}
              />
            </Suspense>

            <div className="property-grid">
              {result.items.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {result.items.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-secondary)" }}>
                <p style={{ fontSize: 16, marginBottom: 8 }}>No properties match your filters.</p>
                <Link href="/listings" className="btn btn-outline" style={{ marginTop: 12 }}>Clear Filters</Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 40, flexWrap: "wrap" }}>
                {page > 1 && (
                  <Link href={pageUrl(page - 1)} className="btn btn-outline" style={{ fontSize: 14 }}>← Previous</Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} style={{ padding: "8px 4px", color: "var(--text-secondary)" }}>…</span>
                    ) : (
                      <Link
                        key={p}
                        href={pageUrl(p)}
                        className={p === page ? "btn btn-primary" : "btn btn-outline"}
                        style={{ minWidth: 40, textAlign: "center", fontSize: 14 }}
                      >
                        {p}
                      </Link>
                    )
                  )}
                {page < totalPages && (
                  <Link href={pageUrl(page + 1)} className="btn btn-primary" style={{ fontSize: 14 }}>Next →</Link>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </ExtractedShell>
  );
}
