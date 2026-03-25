import Link from "next/link";
import { AgentShell } from "@/components/agent-shell";
import { fetchAgentListings } from "@/lib/api";

type ListingsPageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function AgentListingsPage({
  searchParams,
}: ListingsPageProps) {
  const params = await searchParams;
  const status = params.status || undefined;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const data = await fetchAgentListings({ status, page });
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <AgentShell
      activeNav="listings"
      eyebrow="Properties"
      title="My Listings"
      description="View and track the status of your property submissions."
      actions={
        <div className="flex items-center gap-2">
          <Link
            className="inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-accent-hover transition-colors"
            href="/listings/new"
          >
            + Add Listing
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 bg-panel border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-panel-alt hover:border-slate-300 transition-colors"
            href="/"
          >
            ← Overview
          </Link>
        </div>
      }
    >
      {/* Filters */}
      <section className="bg-panel border border-border rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[15px] font-bold">Filter</h2>
          <div className="text-right">
            <strong className="text-xl font-extrabold block">
              {data.total}
            </strong>
            <span className="text-xs text-muted">
              {status ? `${status} listings` : "total listings"}
            </span>
          </div>
        </div>

        <form
          className="grid grid-cols-[1fr_auto] gap-3 items-end max-sm:grid-cols-1"
          action="/listings"
          method="get"
        >
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Status
            <select
              name="status"
              defaultValue={status ?? ""}
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
            </select>
          </label>
          <button
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
            type="submit"
          >
            Apply
          </button>
        </form>
      </section>

      {/* Listing cards */}
      <section className="grid gap-3">
        {data.items.map((listing) => (
          <article
            key={listing.id}
            className="bg-panel border border-border rounded-xl p-5 shadow-sm hover:border-slate-300 hover:shadow transition-all"
          >
            <div className="flex justify-between items-start gap-4 max-sm:flex-col">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-0.5">
                  {listing.listingType === "sale" ? "For Sale" : "For Rent"}
                </p>
                <h2 className="text-[15px] font-bold tracking-tight">
                  {listing.title}
                </h2>
              </div>
              <StatusPill status={listing.moderationStatus} />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <Tag>{listing.region}</Tag>
              <Tag>{listing.type}</Tag>
              <Tag>{listing.priceFormatted}</Tag>
              {listing.beds > 0 && (
                <Tag>
                  {listing.beds} bed{listing.beds > 1 ? "s" : ""}
                </Tag>
              )}
              {listing.baths > 0 && (
                <Tag>
                  {listing.baths} bath{listing.baths > 1 ? "s" : ""}
                </Tag>
              )}
              {listing.area > 0 && <Tag>{listing.area} sq ft</Tag>}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Link
                href={`/listings/${listing.id}/edit`}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Edit
              </Link>
              <span className="text-xs text-muted">
                Added {new Date(listing.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </article>
        ))}

        {data.items.length === 0 && (
          <div className="bg-panel border border-border rounded-xl p-8 shadow-sm text-center">
            <p className="text-sm text-muted mb-3">
              No listings match the current filter.
            </p>
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              + Add Your First Listing
            </Link>
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="bg-panel border border-border rounded-xl p-5 shadow-sm flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold">
            Page {data.page} of {totalPages}
          </h2>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                className="inline-flex items-center gap-1.5 bg-panel border border-border px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-panel-alt transition-colors"
                href={`/listings?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page - 1) })}`}
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                className="inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
                href={`/listings?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page + 1) })}`}
              >
                Next →
              </Link>
            )}
          </div>
        </section>
      )}
    </AgentShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    approved: "bg-green-500/10 text-green-600",
    flagged: "bg-red-500/10 text-red-600",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-bold shrink-0 ${styles[status] ?? "bg-slate-100 text-slate-500"}`}
    >
      {status}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-panel-alt border border-border text-xs text-muted">
      {children}
    </span>
  );
}
