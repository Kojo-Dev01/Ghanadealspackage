import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  fetchAdminListings,
  moderateAdminListing,
  type AdminListingStatus,
} from "@/lib/api";
import { Search } from "lucide-react";
import { AdminListingCard } from "@/components/admin-listing-card";
import { RejectModal } from "@/components/reject-modal";
import { Pagination } from "@/components/pagination";

type ListingsPageProps = {
  searchParams: Promise<{ tab?: string; type?: string; q?: string; page?: string }>;
};

const moderationOptions: AdminListingStatus[] = ["pending", "approved", "flagged"];

function normalizeStatus(value?: string): AdminListingStatus | undefined {
  if (!value) return undefined;
  return moderationOptions.includes(value as AdminListingStatus)
    ? (value as AdminListingStatus)
    : undefined;
}

export default async function AdminListingsPage({
  searchParams,
}: ListingsPageProps) {
  const params = await searchParams;
  const tab = params.tab === "approved" ? "approved" : "pending";
  const listingType = params.type ?? "";
  const query = String(params.q ?? "").trim();
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const listingsResponse = await fetchAdminListings({
    status: tab,
    listingType: listingType || undefined,
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
    const reason = String(formData.get("reason") ?? "").trim() || undefined;
    const currentTab = String(formData.get("currentStatus") ?? "pending");
    const currentQuery = String(formData.get("currentQuery") ?? "").trim();
    const currentPage = Math.max(
      1,
      Number(formData.get("currentPage") ?? "1") || 1
    );

    if (listingId && nextStatus) {
      await moderateAdminListing(listingId, nextStatus, reason);
    }

    revalidatePath("/");
    revalidatePath("/listings");

    const sp = new URLSearchParams();
    sp.set("tab", currentTab);
    if (currentQuery) sp.set("q", currentQuery);
    if (currentPage > 1) sp.set("page", String(currentPage));
    const currentType = String(formData.get("currentType") ?? "").trim();
    if (currentType) sp.set("type", currentType);
    const dest = sp.toString();
    redirect(`/listings?${dest}`);
  }

  const listings = listingsResponse ?? {
    items: [],
    total: 0,
    limit: 12,
    page: 1,
  };
  const totalPages = Math.max(1, Math.ceil(listings.total / listings.limit));

  function buildHref(overrides: { tab?: string; type?: string; q?: string; page?: number } = {}) {
    const sp = new URLSearchParams();
    sp.set("tab", overrides.tab ?? tab);
    const t = overrides.type !== undefined ? overrides.type : listingType;
    if (t) sp.set("type", t);
    const qv = overrides.q !== undefined ? overrides.q : query;
    if (qv) sp.set("q", qv);
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
    <AdminShell
      eyebrow="Moderation"
      title="Listings"
      description="Review, search, and moderate property submissions."
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
                ? { background: 'var(--color-accent, #dc2626)', color: '#fff', borderColor: 'var(--color-accent, #dc2626)' }
                : { background: 'var(--color-panel, #fff)', color: 'var(--color-muted, #64748b)', borderColor: 'var(--color-border, #e2e8f0)' }
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form
        className="flex items-end gap-3"
        action="/listings"
        method="get"
      >
        <input type="hidden" name="tab" value={tab} />
        {listingType && <input type="hidden" name="type" value={listingType} />}
        <label className="grid gap-1 text-xs font-semibold text-muted flex-1 max-w-md">
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
        <button
          type="submit"
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Count */}
      <p className="text-sm text-muted">
        <strong className="text-foreground">{listings.total}</strong> {tab} listing{listings.total !== 1 ? "s" : ""}
        {query && <> matching &ldquo;{query}&rdquo;</>}
      </p>

      {/* Listings Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {listings.items.map((listing) => (
          <AdminListingCard
            key={listing.id}
            listing={listing}
            moderateAction={moderateAction}
            status={tab}
            query={query}
            page={page}
            currentType={listingType}
          />
        ))}

        {listings.items.length === 0 && (
          <div className="col-span-full bg-panel border border-border rounded-xl p-10 text-center">
            <p className="text-sm text-muted">
              {tab === "pending"
                ? "No listings waiting for review."
                : "No approved listings found."}
            </p>
          </div>
        )}
      </section>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={listings.total}
        limit={listings.limit}
        buildHref={(p) => buildHref({ page: p })}
        noun="listings"
      />

      {/* Reject Modal */}
      <RejectModal
        moderateAction={moderateAction}
        currentStatus={tab}
        currentQuery={query}
        currentPage={page}
        currentType={listingType}
      />
    </AdminShell>
  );
}
