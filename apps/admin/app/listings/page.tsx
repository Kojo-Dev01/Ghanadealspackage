import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  fetchAdminListings,
  moderateAdminListing,
  type AdminListingStatus,
} from "@/lib/api";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  DollarSign,
  User,
  Calendar,
} from "lucide-react";

type ListingsPageProps = {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
};

const moderationOptions: AdminListingStatus[] = [
  "pending",
  "approved",
  "flagged",
];

function normalizeStatus(value?: string): AdminListingStatus | undefined {
  if (!value) return undefined;
  return moderationOptions.includes(value as AdminListingStatus)
    ? (value as AdminListingStatus)
    : undefined;
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    flagged: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${colors[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

function ListingTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
        type === "sale"
          ? "bg-blue-50 text-blue-600"
          : "bg-violet-50 text-violet-600"
      }`}
    >
      For {type}
    </span>
  );
}

export default async function AdminListingsPage({
  searchParams,
}: ListingsPageProps) {
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const query = String(params.q ?? "").trim();
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const listingsResponse = await fetchAdminListings({
    status,
    q: query || undefined,
    page,
    limit: 12,
  });

  async function moderateAction(formData: FormData) {
    "use server";

    const listingId = String(formData.get("listingId") ?? "").trim();
    const nextStatus = normalizeStatus(
      String(formData.get("moderationStatus") ?? "")
    );
    const currentStatus = normalizeStatus(
      String(formData.get("currentStatus") ?? "")
    );
    const currentQuery = String(formData.get("currentQuery") ?? "").trim();
    const currentPage = Math.max(
      1,
      Number(formData.get("currentPage") ?? "1") || 1
    );

    if (listingId && nextStatus) {
      await moderateAdminListing(listingId, nextStatus);
    }

    revalidatePath("/");
    revalidatePath("/listings");

    const sp = new URLSearchParams();
    if (currentStatus) sp.set("status", currentStatus);
    if (currentQuery) sp.set("q", currentQuery);
    if (currentPage > 1) sp.set("page", String(currentPage));
    const dest = sp.toString();
    redirect(dest ? `/listings?${dest}` : "/listings");
  }

  const listings = listingsResponse ?? {
    items: [],
    total: 0,
    limit: 12,
    page: 1,
  };
  const totalPages = Math.max(1, Math.ceil(listings.total / listings.limit));

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (query) sp.set("q", query);
    if (p > 1) sp.set("page", String(p));
    const str = sp.toString();
    return str ? `/listings?${str}` : "/listings";
  }

  return (
    <AdminShell
      activeNav="listings"
      eyebrow="Moderation"
      title="Listings"
      description="Review, search, and moderate property submissions."
    >
      {/* Filters */}
      <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
        <form
          className="flex flex-wrap items-end gap-4"
          action="/listings"
          method="get"
        >
          <label className="grid gap-1 text-xs font-semibold text-muted flex-1 min-w-[180px]">
            <span className="flex items-center gap-1">
              <Search size={12} /> Search
            </span>
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Title, region, or seller…"
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted min-w-[140px]">
            <span className="flex items-center gap-1">
              <SlidersHorizontal size={12} /> Status
            </span>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
            </select>
          </label>
          <button
            type="submit"
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Apply
          </button>
        </form>
        <div className="mt-3 text-xs text-muted">
          <strong className="text-foreground">{listings.total}</strong>{" "}
          {status ? `${status} listings` : "total listings"}
        </div>
      </section>

      {/* Listings Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {listings.items.map((listing) => (
          <article
            key={listing.id}
            className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden flex flex-col"
          >
            <div className="p-4 flex items-start justify-between gap-2 border-b border-border">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ListingTypeBadge type={listing.listingType} />
                  <StatusPill status={listing.moderationStatus} />
                </div>
                <Link
                  href={`/listings/${listing.id}`}
                  className="text-sm font-bold text-foreground truncate block hover:text-accent transition-colors"
                >
                  {listing.title}
                </Link>
              </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-2 text-xs text-muted flex-1">
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {listing.region}
              </span>
              <span className="flex items-center gap-1">
                <Tag size={12} /> {listing.type}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign size={12} /> {listing.priceFormatted}
              </span>
              <span className="flex items-center gap-1">
                <User size={12} /> {listing.agentName}
              </span>
              <span className="flex items-center gap-1 col-span-2">
                <Calendar size={12} /> Submitted {listing.submittedAt}
              </span>
            </div>

            <div className="border-t border-border p-3 flex gap-2">
              <Link
                href={`/listings/${listing.id}`}
                className="px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                Review
              </Link>
              <form className="flex gap-2 flex-1" action={moderateAction}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input
                  type="hidden"
                  name="currentStatus"
                  value={status ?? ""}
                />
                <input type="hidden" name="currentQuery" value={query} />
                <input
                  type="hidden"
                  name="currentPage"
                  value={String(page)}
                />
                {moderationOptions.map((option) => (
                  <button
                    key={option}
                    name="moderationStatus"
                    type="submit"
                    value={option}
                    disabled={option === listing.moderationStatus}
                    className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all ${
                      option === listing.moderationStatus
                        ? option === "approved"
                          ? "bg-green-600 text-white ring-2 ring-green-300 cursor-default"
                          : option === "flagged"
                            ? "bg-red-600 text-white ring-2 ring-red-300 cursor-default"
                            : "bg-amber-500 text-white ring-2 ring-amber-300 cursor-default"
                        : option === "approved"
                          ? "bg-green-100 text-green-800 hover:bg-green-600 hover:text-white cursor-pointer"
                          : option === "flagged"
                            ? "bg-red-100 text-red-800 hover:bg-red-600 hover:text-white cursor-pointer"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white cursor-pointer"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </form>
            </div>
          </article>
        ))}

        {listings.items.length === 0 && (
          <div className="col-span-full bg-panel border border-border rounded-xl p-10 text-center">
            <p className="text-sm text-muted">
              No listings match the current filters.
            </p>
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="bg-panel border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <p className="text-sm text-muted">
            Page <strong className="text-foreground">{listings.page}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-panel-alt transition-colors"
              >
                <ChevronLeft size={14} /> Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-panel-alt transition-colors"
              >
                Next <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </section>
      )}
    </AdminShell>
  );
}
