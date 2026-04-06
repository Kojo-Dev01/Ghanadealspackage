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
              <nav style={{ marginTop: 40, marginBottom: 20 }}>
                <div style={{
                  display: "flex", justifyContent: "center", alignItems: "center",
                  gap: 6, flexWrap: "wrap",
                }}>
                  {/* Previous */}
                  {page > 1 ? (
                    <Link
                      href={pageUrl(page - 1)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "8px 16px", fontSize: 14, fontWeight: 600,
                        borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)",
                        color: "var(--text-primary)", background: "var(--bg-card)",
                        textDecoration: "none", transition: "var(--transition-fast)",
                      }}
                    >
                      ← Prev
                    </Link>
                  ) : (
                    <span style={{
                      padding: "8px 16px", fontSize: 14, fontWeight: 600,
                      borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)",
                      color: "var(--text-tertiary)", background: "var(--bg-secondary)",
                      opacity: 0.5, cursor: "not-allowed",
                    }}>
                      ← Prev
                    </span>
                  )}

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`e-${i}`} style={{ padding: "8px 4px", color: "var(--text-tertiary)", fontSize: 14 }}>…</span>
                      ) : (
                        <Link
                          key={p}
                          href={pageUrl(p)}
                          style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            minWidth: 40, padding: "8px 12px", fontSize: 14, fontWeight: 600,
                            borderRadius: "var(--radius-md)", textDecoration: "none",
                            transition: "var(--transition-fast)",
                            ...(p === page
                              ? { background: "var(--red)", color: "#fff", border: "1px solid var(--red)" }
                              : { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }
                            ),
                          }}
                        >
                          {p}
                        </Link>
                      )
                    )}

                  {/* Next */}
                  {page < totalPages ? (
                    <Link
                      href={pageUrl(page + 1)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "8px 16px", fontSize: 14, fontWeight: 600,
                        borderRadius: "var(--radius-md)",
                        background: "var(--red)", color: "#fff", border: "1px solid var(--red)",
                        textDecoration: "none", transition: "var(--transition-fast)",
                      }}
                    >
                      Next →
                    </Link>
                  ) : (
                    <span style={{
                      padding: "8px 16px", fontSize: 14, fontWeight: 600,
                      borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)",
                      color: "var(--text-tertiary)", background: "var(--bg-secondary)",
                      opacity: 0.5, cursor: "not-allowed",
                    }}>
                      Next →
                    </span>
                  )}
                </div>

                {/* Page info */}
                <div style={{
                  textAlign: "center", marginTop: 12,
                  fontSize: 13, color: "var(--text-tertiary)",
                }}>
                  Page {page} of {totalPages} · Showing {(page - 1) * limit + 1}–{Math.min(page * limit, result.total)} of {result.total} properties
                </div>
              </nav>
            )}
          </div>
        </section>
      </main>
    </ExtractedShell>
  );
}
