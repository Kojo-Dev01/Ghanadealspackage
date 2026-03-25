import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  fetchAdminListingById,
  moderateAdminListing,
  toggleAdminListingFeatured,
  type AdminListingStatus,
} from "@/lib/api";
import {
  ArrowLeft,
  Bed,
  Bath,
  Ruler,
  MapPin,
  Tag,
  DollarSign,
  User,
  Phone,
  Building2,
  Calendar,
  Hash,
  Car,
  Sofa,
  Star,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

/** Resolve a relative image path to an absolute URL so the admin app can display it. */
function resolveImg(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${WEB_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

const moderationOptions: AdminListingStatus[] = [
  "pending",
  "approved",
  "flagged",
];

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; icon: React.ReactNode }> = {
    pending: {
      bg: "bg-amber-100 text-amber-700",
      icon: <Clock size={12} />,
    },
    approved: {
      bg: "bg-green-100 text-green-700",
      icon: <CheckCircle2 size={12} />,
    },
    flagged: {
      bg: "bg-red-100 text-red-700",
      icon: <AlertTriangle size={12} />,
    },
  };
  const entry = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${entry?.bg ?? "bg-slate-100 text-slate-600"}`}
    >
      {entry?.icon} {status}
    </span>
  );
}

function ListingTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
        type === "sale"
          ? "bg-blue-50 text-blue-600"
          : type === "rent"
            ? "bg-violet-50 text-violet-600"
            : "bg-emerald-50 text-emerald-600"
      }`}
    >
      {type === "new" ? "New Development" : `For ${type}`}
    </span>
  );
}

export default async function AdminListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await fetchAdminListingById(id);
  if (!listing) notFound();

  async function moderateAction(formData: FormData) {
    "use server";

    const listingId = String(formData.get("listingId") ?? "").trim();
    const nextStatus = String(formData.get("moderationStatus") ?? "").trim();

    if (
      listingId &&
      moderationOptions.includes(nextStatus as AdminListingStatus)
    ) {
      await moderateAdminListing(
        listingId,
        nextStatus as AdminListingStatus
      );
    }

    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath(`/listings/${listingId}`);
    redirect(`/listings/${listingId}`);
  }

  async function toggleFeaturedAction() {
    "use server";
    await toggleAdminListingFeatured(id);
    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath(`/listings/${id}`);
    redirect(`/listings/${id}`);
  }

  const gallery = listing.gallery ?? [];
  const amenities = listing.amenities ?? [];
  const mainImage = resolveImg(listing.imageLg ?? listing.image);

  return (
    <AdminShell
      activeNav="listings"
      eyebrow="Moderation"
      title={listing.title}
      description={`Ref: ${listing.ref} · Submitted ${listing.submittedAt}`}
      actions={
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-panel-alt transition-colors"
        >
          <ArrowLeft size={14} /> Back to Listings
        </Link>
      }
    >
      {/* ── Moderation Action Bar ── */}
      <section
        className={`rounded-xl shadow-sm p-5 border ${
          listing.moderationStatus === "pending"
            ? "bg-amber-50/60 border-amber-200"
            : listing.moderationStatus === "flagged"
              ? "bg-red-50/60 border-red-200"
              : "bg-green-50/60 border-green-200"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusPill status={listing.moderationStatus} />
            <ListingTypeBadge type={listing.listingType} />
            {listing.featured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-yellow-50 text-yellow-700 border border-yellow-200">
                <Star size={10} /> Featured
              </span>
            )}
            <form action={toggleFeaturedAction} className="inline">
              <button
                type="submit"
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  listing.featured
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300"
                    : "bg-slate-100 text-slate-600 hover:bg-yellow-100 hover:text-yellow-800 border border-slate-200 hover:border-yellow-300"
                }`}
              >
                <Star size={12} fill={listing.featured ? "currentColor" : "none"} />
                {listing.featured ? "Remove from Featured" : "Mark as Featured"}
              </button>
            </form>
            {listing.moderatedAt && (
              <span className="text-xs text-muted">
                Last moderated {listing.moderatedAt}
              </span>
            )}
          </div>

          <form className="flex gap-3" action={moderateAction}>
            <input type="hidden" name="listingId" value={listing.id} />
            <button
              name="moderationStatus"
              type="submit"
              value="approved"
              disabled={listing.moderationStatus === "approved"}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
                listing.moderationStatus === "approved"
                  ? "bg-green-600 text-white ring-2 ring-green-300 cursor-default"
                  : "bg-green-100 text-green-800 hover:bg-green-600 hover:text-white cursor-pointer"
              }`}
            >
              <CheckCircle2 size={16} /> Approve
            </button>
            <button
              name="moderationStatus"
              type="submit"
              value="flagged"
              disabled={listing.moderationStatus === "flagged"}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
                listing.moderationStatus === "flagged"
                  ? "bg-red-600 text-white ring-2 ring-red-300 cursor-default"
                  : "bg-red-100 text-red-800 hover:bg-red-600 hover:text-white cursor-pointer"
              }`}
            >
              <AlertTriangle size={16} /> Flag
            </button>
            <button
              name="moderationStatus"
              type="submit"
              value="pending"
              disabled={listing.moderationStatus === "pending"}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
                listing.moderationStatus === "pending"
                  ? "bg-amber-500 text-white ring-2 ring-amber-300 cursor-default"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white cursor-pointer"
              }`}
            >
              <Clock size={16} /> Set Pending
            </button>
          </form>
        </div>
      </section>

      {/* ── Image Hero ── */}
      {mainImage && (
        <section className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainImage}
              alt={listing.title}
              className="w-full h-72 md:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h2 className="text-white text-xl md:text-2xl font-bold drop-shadow-lg">
                {listing.title}
              </h2>
              <p className="text-white/80 text-sm mt-1 flex items-center gap-1.5 drop-shadow">
                <MapPin size={14} /> {listing.location}, {listing.region}
              </p>
            </div>
          </div>

          {/* Gallery thumbnails strip */}
          {gallery.length > 0 && (
            <div className="border-t border-border bg-panel-alt p-3">
              <div className="flex gap-2 overflow-x-auto">
                {gallery.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={resolveImg(url)}
                    alt={`Photo ${i + 1}`}
                    className="w-20 h-14 md:w-28 md:h-20 object-cover rounded-lg border border-border shrink-0 hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted mt-2 flex items-center gap-1">
                <ImageIcon size={10} /> {gallery.length} photo{gallery.length !== 1 ? "s" : ""} in gallery
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column — Details */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Key Stats Bar */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {listing.priceFormatted}
                </p>
                <p className="text-[11px] text-muted uppercase tracking-wide mt-0.5">
                  {listing.priceLabel || "Price"}
                </p>
              </div>
              {listing.beds > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1.5">
                    <Bed size={18} className="text-muted" /> {listing.beds}
                  </p>
                  <p className="text-[11px] text-muted uppercase tracking-wide mt-0.5">
                    Bedrooms
                  </p>
                </div>
              )}
              {listing.baths > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1.5">
                    <Bath size={18} className="text-muted" /> {listing.baths}
                  </p>
                  <p className="text-[11px] text-muted uppercase tracking-wide mt-0.5">
                    Bathrooms
                  </p>
                </div>
              )}
              {listing.area > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1.5">
                    <Ruler size={18} className="text-muted" /> {listing.area}
                  </p>
                  <p className="text-[11px] text-muted uppercase tracking-wide mt-0.5">
                    Sq Ft
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Description */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-foreground mb-3">
              Description
            </h2>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {listing.description || (
                <span className="italic">No description provided.</span>
              )}
            </div>
          </section>

          {/* Amenities */}
          {amenities.length > 0 && (
            <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">
                Amenities ({amenities.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium border border-accent/15"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Property Specs */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-foreground mb-4">
              Property Specifications
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center gap-2 py-2 border-b border-border/50">
                <Tag size={14} className="text-muted shrink-0" />
                <dt className="text-muted">Property Type</dt>
                <dd className="ml-auto font-medium text-foreground">
                  {listing.type}
                </dd>
              </div>
              <div className="flex items-center gap-2 py-2 border-b border-border/50">
                <MapPin size={14} className="text-muted shrink-0" />
                <dt className="text-muted">Location</dt>
                <dd className="ml-auto font-medium text-foreground truncate max-w-[200px]">
                  {listing.location}
                </dd>
              </div>
              <div className="flex items-center gap-2 py-2 border-b border-border/50">
                <MapPin size={14} className="text-muted shrink-0" />
                <dt className="text-muted">Region</dt>
                <dd className="ml-auto font-medium text-foreground">
                  {listing.region}
                </dd>
              </div>
              <div className="flex items-center gap-2 py-2 border-b border-border/50">
                <Hash size={14} className="text-muted shrink-0" />
                <dt className="text-muted">Reference</dt>
                <dd className="ml-auto font-medium text-foreground">
                  {listing.ref}
                </dd>
              </div>
              {listing.furnishing && (
                <div className="flex items-center gap-2 py-2 border-b border-border/50">
                  <Sofa size={14} className="text-muted shrink-0" />
                  <dt className="text-muted">Furnishing</dt>
                  <dd className="ml-auto font-medium text-foreground">
                    {listing.furnishing}
                  </dd>
                </div>
              )}
              {listing.parking && (
                <div className="flex items-center gap-2 py-2 border-b border-border/50">
                  <Car size={14} className="text-muted shrink-0" />
                  <dt className="text-muted">Parking</dt>
                  <dd className="ml-auto font-medium text-foreground">
                    {listing.parking}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* Right Column — Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Agent Card */}
          <section className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden">
            <div
              className="h-2"
              style={{ backgroundColor: listing.agent.color || "#6366f1" }}
            />
            <div className="p-5">
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
                Submitted by
              </h2>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm"
                  style={{
                    backgroundColor: listing.agent.color || "#6366f1",
                  }}
                >
                  {listing.agent.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {listing.agent.name}
                  </p>
                  {listing.agent.company && (
                    <p className="text-xs text-muted flex items-center gap-1 truncate mt-0.5">
                      <Building2 size={10} /> {listing.agent.company}
                    </p>
                  )}
                </div>
              </div>
              {listing.agent.phone && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted flex items-center gap-1.5">
                    <Phone size={12} /> {listing.agent.phone}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
              Timeline
            </h2>
            <div className="relative pl-5 border-l-2 border-border space-y-4">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white" />
                <p className="text-xs font-bold text-foreground">Submitted</p>
                <p className="text-xs text-muted">{listing.submittedAt}</p>
              </div>
              {listing.moderatedAt && (
                <div className="relative">
                  <div
                    className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      listing.moderationStatus === "approved"
                        ? "bg-green-500"
                        : listing.moderationStatus === "flagged"
                          ? "bg-red-500"
                          : "bg-amber-500"
                    }`}
                  />
                  <p className="text-xs font-bold text-foreground">
                    {listing.moderationStatus === "approved"
                      ? "Approved"
                      : listing.moderationStatus === "flagged"
                        ? "Flagged"
                        : "Set to Pending"}
                  </p>
                  <p className="text-xs text-muted">{listing.moderatedAt}</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
              Quick Actions
            </h2>
            <div className="flex flex-col gap-2">
              <Link
                href={`${WEB_URL}/property/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-panel-alt transition-colors"
              >
                <ExternalLink size={12} /> View on website
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
