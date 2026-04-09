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
  Phone,
  Building2,
  Hash,
  Car,
  Sofa,
  Map,
  ExternalLink,
} from "lucide-react";
import { ClickableGallery } from "@/components/clickable-gallery";
import { AdminGallery } from "@/components/admin-gallery";
import { ModerationBar } from "@/components/moderation-bar";

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

export default async function AdminListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await fetchAdminListingById(id);
  if (!listing) notFound();

  async function moderateAction(formData: FormData) {
    "use server";

    const listingId = String(formData.get("listingId") ?? "").trim();
    const nextStatus = String(formData.get("moderationStatus") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();

    if (
      listingId &&
      moderationOptions.includes(nextStatus as AdminListingStatus)
    ) {
      await moderateAdminListing(
        listingId,
        nextStatus as AdminListingStatus,
        nextStatus === "flagged" ? reason : undefined
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
      {/* ── Moderation Bar ── */}
      <ModerationBar
        listingId={listing.id}
        status={listing.moderationStatus}
        listingType={listing.listingType}
        featured={listing.featured}
        moderatedAt={listing.moderatedAt}
        moderationReason={listing.moderationReason}
        moderateAction={moderateAction}
        toggleFeaturedAction={toggleFeaturedAction}
      />

      {/* ── Image Gallery ── */}
      {gallery.length > 0 && (
        <section className="bg-panel border border-border rounded-xl shadow-sm p-4">
          <AdminGallery images={gallery.map(resolveImg)} alt={listing.title} />
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

          {/* Floor Plans */}
          {listing.floorPlans && listing.floorPlans.length > 0 && (
            <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">
                Floor Plans ({listing.floorPlans.length})
              </h2>
              <ClickableGallery
                images={listing.floorPlans.map(resolveImg)}
                alt={`${listing.title} floor plan`}
                columns={2}
              />
            </section>
          )}

          {/* Map Location */}
          {listing.latitude != null && listing.longitude != null && (
            <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Map size={14} /> Location on Map
              </h2>
              <div className="rounded-lg overflow-hidden border border-border">
                <iframe
                  title="Property location"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - 0.005}%2C${listing.latitude - 0.005}%2C${listing.longitude + 0.005}%2C${listing.latitude + 0.005}&layer=mapnik&marker=${listing.latitude}%2C${listing.longitude}`}
                />
              </div>
              <p className="text-[11px] text-muted mt-2">
                Coordinates: {listing.latitude.toFixed(6)}, {listing.longitude.toFixed(6)}
              </p>
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
                    style={{
                      position: "absolute",
                      left: -21,
                      top: 4,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      border: "2px solid #fff",
                      background:
                        listing.moderationStatus === "approved"
                          ? "#22c55e"
                          : listing.moderationStatus === "flagged"
                            ? "#ef4444"
                            : "#f59e0b",
                    }}
                  />
                  <p className="text-xs font-bold text-foreground">
                    {listing.moderationStatus === "approved"
                      ? "Approved"
                      : listing.moderationStatus === "flagged"
                        ? "Rejected"
                        : "Set to Pending"}
                  </p>
                  <p className="text-xs text-muted">{listing.moderatedAt}</p>
                  {listing.moderationStatus === "flagged" &&
                    listing.moderationReason && (
                      <p
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: "#991b1b",
                          lineHeight: 1.4,
                        }}
                      >
                        &ldquo;{listing.moderationReason}&rdquo;
                      </p>
                    )}
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
