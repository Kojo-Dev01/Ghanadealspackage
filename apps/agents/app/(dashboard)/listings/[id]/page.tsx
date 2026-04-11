import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentShell } from "@/components/agent-shell";
import { fetchListingById } from "@/lib/api";
import { DetailGallery } from "@/components/detail-gallery";
import { FloorPlanViewer } from "@/components/floor-plan-viewer";
import {
  ArrowLeft,
  Bed,
  Bath,
  Ruler,
  MapPin,
  Tag,
  Hash,
  Car,
  Sofa,
  Map,
  Pencil,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

function resolveImg(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${WEB_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

const statusMeta: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending:  { label: "Pending Review", color: "var(--status-warning-text, #b45309)", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", icon: <Clock size={14} /> },
  approved: { label: "Approved",       color: "var(--status-success-text, #15803d)", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.25)",  icon: <CheckCircle2 size={14} /> },
  flagged:  { label: "Rejected",       color: "var(--status-danger-text, #dc2626)",  bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)",  icon: <AlertTriangle size={14} /> },
};

export default async function SellerListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await fetchListingById(id);
  if (!listing) notFound();

  const gallery = listing.gallery?.length
    ? listing.gallery.map(resolveImg)
    : listing.image
      ? [resolveImg(listing.image)]
      : [];

  const floorPlans = (listing.floorPlans ?? []).map(resolveImg);
  const amenities = listing.amenities ?? [];
  const s = statusMeta[listing.moderationStatus] ?? statusMeta.pending;

  return (
    <AgentShell
      eyebrow="Properties"
      title={listing.title}
      description={`Ref: ${listing.id.slice(0, 8)} · ${listing.region}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-panel-alt transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <Link
            href={`/listings/${listing.id}/edit`}
            style={{ background: "var(--color-accent)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
          >
            <Pencil size={14} /> Edit Listing
          </Link>
        </div>
      }
    >
      {/* ── Status Bar ── */}
      <section className="bg-panel border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: 9999,
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
              color: s.color, background: s.bg, border: `1px solid ${s.border}`,
            }}
          >
            {s.icon} {s.label}
          </span>

          {listing.featured && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--status-warning-text, #a16207)", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
              ★ Featured
            </span>
          )}

          <span className="text-xs text-muted">
            Added {new Date(listing.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Rejection reason */}
        {listing.moderationStatus === "flagged" && listing.moderationReason && (
          <div
            style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 8,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              fontSize: 13, color: "var(--status-danger-text, #991b1b)", lineHeight: 1.5,
            }}
          >
            <strong style={{ fontWeight: 700 }}>Rejection reason:</strong> {listing.moderationReason}
          </div>
        )}
      </section>

      {/* ── Image Gallery ── */}
      {gallery.length > 0 && (
        <section className="bg-panel border border-border rounded-xl shadow-sm p-4">
          <DetailGallery images={gallery} alt={listing.title} />
        </section>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Key Stats */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{listing.priceFormatted}</p>
                <p className="text-[11px] text-muted uppercase tracking-wide mt-0.5">{listing.priceLabel || "Price"}</p>
              </div>
              {listing.beds > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1.5"><Bed size={18} className="text-muted" /> {listing.beds}</p>
                  <p className="text-[11px] text-muted uppercase tracking-wide mt-0.5">Bedrooms</p>
                </div>
              )}
              {listing.baths > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1.5"><Bath size={18} className="text-muted" /> {listing.baths}</p>
                  <p className="text-[11px] text-muted uppercase tracking-wide mt-0.5">Bathrooms</p>
                </div>
              )}
              {listing.area > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1.5"><Ruler size={18} className="text-muted" /> {listing.area}</p>
                  <p className="text-[11px] text-muted uppercase tracking-wide mt-0.5">Sq Ft</p>
                </div>
              )}
            </div>
          </section>

          {/* Description */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-foreground mb-3">Description</h2>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {listing.description || <span className="italic">No description provided.</span>}
            </div>
          </section>

          {/* Amenities */}
          {amenities.length > 0 && (
            <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">Amenities ({amenities.length})</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((item, i) => (
                  <span key={i} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: "var(--color-accent-light)", color: "var(--color-accent)", border: "1px solid rgba(230,57,70,0.15)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Floor Plans */}
          {floorPlans.length > 0 && (
            <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">
                Floor Plans ({floorPlans.length})
              </h2>
              <FloorPlanViewer images={floorPlans} alt={`${listing.title} floor plan`} />
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
                  height="280"
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
            <h2 className="text-sm font-bold text-foreground mb-4">Property Specifications</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center gap-2 py-2 border-b border-border">
                <Tag size={14} className="text-muted shrink-0" />
                <dt className="text-muted">Property Type</dt>
                <dd className="ml-auto font-medium text-foreground">{listing.type}</dd>
              </div>
              <div className="flex items-center gap-2 py-2 border-b border-border">
                <MapPin size={14} className="text-muted shrink-0" />
                <dt className="text-muted">Location</dt>
                <dd className="ml-auto font-medium text-foreground truncate max-w-[200px]">{listing.location}</dd>
              </div>
              <div className="flex items-center gap-2 py-2 border-b border-border">
                <MapPin size={14} className="text-muted shrink-0" />
                <dt className="text-muted">Region</dt>
                <dd className="ml-auto font-medium text-foreground">{listing.region}</dd>
              </div>
              <div className="flex items-center gap-2 py-2 border-b border-border">
                <Hash size={14} className="text-muted shrink-0" />
                <dt className="text-muted">Listing Type</dt>
                <dd className="ml-auto font-medium text-foreground capitalize">{listing.listingType === "new" ? "New Development" : `For ${listing.listingType}`}</dd>
              </div>
              {listing.furnishing && (
                <div className="flex items-center gap-2 py-2 border-b border-border">
                  <Sofa size={14} className="text-muted shrink-0" />
                  <dt className="text-muted">Furnishing</dt>
                  <dd className="ml-auto font-medium text-foreground">{listing.furnishing}</dd>
                </div>
              )}
              {listing.parking && (
                <div className="flex items-center gap-2 py-2 border-b border-border">
                  <Car size={14} className="text-muted shrink-0" />
                  <dt className="text-muted">Parking</dt>
                  <dd className="ml-auto font-medium text-foreground">{listing.parking}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {/* Quick Actions */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Actions</h2>
            <div className="flex flex-col gap-2">
              <Link
                href={`/listings/${listing.id}/edit`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-panel-alt transition-colors"
              >
                <Pencil size={12} /> Edit this listing
              </Link>
              <Link
                href={`${WEB_URL}/property/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-panel-alt transition-colors"
              >
                ↗ View on website
              </Link>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Summary</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted">Photos</dt>
                <dd className="font-medium text-foreground">{gallery.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Floor Plans</dt>
                <dd className="font-medium text-foreground">{floorPlans.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Amenities</dt>
                <dd className="font-medium text-foreground">{amenities.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Has Coordinates</dt>
                <dd className="font-medium text-foreground">{listing.latitude != null ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </AgentShell>
  );
}
