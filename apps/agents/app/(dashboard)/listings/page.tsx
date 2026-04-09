import Link from "next/link";
import { AgentShell } from "@/components/agent-shell";
import { fetchAgentListings } from "@/lib/api";
import { ListingCard } from "@/components/listing-card";

type ListingsPageProps = {
  searchParams: Promise<{ tab?: string; type?: string; page?: string }>;
};

export default async function AgentListingsPage({
  searchParams,
}: ListingsPageProps) {
  const params = await searchParams;
  const tab = params.tab === "approved" ? "approved" : "pending";
  const listingType = params.type ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const data = await fetchAgentListings({ status: tab, listingType: listingType || undefined, page });
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  function buildHref(overrides: { tab?: string; type?: string; page?: number } = {}) {
    const sp = new URLSearchParams();
    sp.set("tab", overrides.tab ?? tab);
    const t = overrides.type !== undefined ? overrides.type : listingType;
    if (t) sp.set("type", t);
    const p = overrides.page ?? 1;
    if (p > 1) sp.set("page", String(p));
    return `/listings?${sp}`;
  }

  const typeFilters = [
    { value: "", label: "All" },
    { value: "sale", label: "Buy" },
    { value: "rent", label: "Rent" },
    { value: "land", label: "Land" },
    { value: "new", label: "New Projects" },
    { value: "commercial", label: "Commercial" },
  ];

  return (
    <AgentShell
      eyebrow="Properties"
      title="My Listings"
      description="View and track the status of your property submissions."
      actions={
        <Link
          className="inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-accent-hover transition-colors"
          href="/listings/new"
        >
          + Add Listing
        </Link>
      }
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-panel-alt border border-border rounded-lg w-fit">
        <Link
          href={buildHref({ tab: "pending" })}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            tab === "pending"
              ? "bg-panel text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Pending Review
        </Link>
        <Link
          href={buildHref({ tab: "approved" })}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            tab === "approved"
              ? "bg-panel text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Approved
        </Link>
      </div>

      {/* Listing type filters */}
      <div className="flex flex-wrap items-center gap-2">
        {typeFilters.map((f) => (
          <Link
            key={f.value}
            href={buildHref({ type: f.value })}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            style={
              listingType === f.value
                ? { background: 'var(--color-accent, #E63946)', color: '#fff', borderColor: 'var(--color-accent, #E63946)' }
                : { background: 'var(--color-panel, #fff)', color: 'var(--color-muted, #64748b)', borderColor: 'var(--color-border, #e2e8f0)' }
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Count */}
      <p className="text-sm text-muted">
        <strong className="text-foreground">{data.total}</strong> {tab} listing{data.total !== 1 ? "s" : ""}
      </p>

      {/* Listing cards grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {data.items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </section>

      {data.items.length === 0 && (
        <div className="bg-panel border border-border rounded-xl p-10 text-center">
          <p className="text-sm text-muted mb-3">
            {tab === "pending"
              ? "No listings waiting for review."
              : "No approved listings yet."}
          </p>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            + Add a Listing
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            Page <strong className="text-foreground">{data.page}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                className="inline-flex items-center gap-1.5 bg-panel border border-border px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-panel-alt transition-colors"
                href={buildHref({ page: page - 1 })}
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                className="inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
                href={buildHref({ page: page + 1 })}
              >
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </AgentShell>
  );
}
