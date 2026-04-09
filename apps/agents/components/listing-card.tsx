"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Bed, Bath, Ruler, Pencil, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { DashboardListing } from "@/lib/api";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

function resolveImg(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${WEB_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

const statusStyles: Record<string, { bg: string; color: string; border: string; label: string; icon: React.ReactNode }> = {
  pending:  { bg: "rgba(245,158,11,0.1)", color: "#d97706", border: "#fde68a", label: "Pending Review", icon: <Clock size={12} /> },
  approved: { bg: "rgba(34,197,94,0.1)",  color: "#16a34a", border: "#bbf7d0", label: "Approved",       icon: <CheckCircle2 size={12} /> },
  flagged:  { bg: "rgba(239,68,68,0.1)",  color: "#dc2626", border: "#fecaca", label: "Rejected",       icon: <AlertTriangle size={12} /> },
};

const typeColors: Record<string, string> = {
  sale: "rgba(59,130,246,0.9)",
  rent: "rgba(139,92,246,0.9)",
  land: "rgba(16,185,129,0.9)",
  new: "rgba(59,130,246,0.9)",
  commercial: "rgba(16,185,129,0.9)",
};

export function ListingCard({ listing }: { listing: DashboardListing }) {
  const router = useRouter();
  const imgSrc = resolveImg(listing.image);
  const status = statusStyles[listing.moderationStatus] ?? statusStyles.pending;
  const photoCount = listing.gallery?.length ?? 0;
  const typeBg = typeColors[listing.listingType] ?? "rgba(16,185,129,0.9)";

  return (
    <article
      className="bg-panel border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer"
      onClick={() => router.push(`/listings/${listing.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-panel-alt" style={{ aspectRatio: "16/10" }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">No image</div>
        )}
        {/* Status badge */}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 9999,
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
              background: status.bg, color: status.color, border: `1px solid ${status.border}`,
              backdropFilter: "blur(4px)",
            }}
          >
            {status.icon} {status.label}
          </span>
        </div>
        {/* Photo count */}
        {photoCount > 0 && (
          <div
            style={{
              position: "absolute", bottom: 10, left: 10,
              padding: "4px 10px", borderRadius: 9999,
              background: "rgba(0,0,0,0.6)", color: "#fff",
              fontSize: 12, fontWeight: 500, backdropFilter: "blur(4px)",
            }}
          >
            {photoCount} photos
          </div>
        )}
        {/* Listing type */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <span
            style={{
              padding: "4px 10px", borderRadius: 9999,
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
              background: typeBg, color: "#fff", backdropFilter: "blur(4px)",
            }}
          >
            For {listing.listingType === "new" ? "Sale" : listing.listingType}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-xs text-muted font-medium uppercase tracking-wide mb-1">
          {listing.type} · {listing.region}
        </div>
        <div className="text-lg font-bold text-foreground mb-0.5">
          {listing.priceFormatted}
          {listing.priceLabel && <span className="text-sm font-normal text-muted ml-1">{listing.priceLabel}</span>}
        </div>
        <h3 className="text-sm font-semibold text-foreground truncate mb-1.5">{listing.title}</h3>
        {listing.location && (
          <div className="flex items-center gap-1 text-xs text-muted mb-3">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>
        )}

        {/* Specs */}
        <div className="flex gap-4 pt-3 border-t border-border">
          {listing.beds > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Bed size={13} /> {listing.beds} Beds
            </span>
          )}
          {listing.baths > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Bath size={13} /> {listing.baths} Baths
            </span>
          )}
          {listing.area > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Ruler size={13} /> {listing.area} sqm
            </span>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {listing.moderationStatus === "flagged" && listing.moderationReason && (
        <div className="mx-4 mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          <strong className="font-semibold">Rejection reason:</strong> {listing.moderationReason}
        </div>
      )}

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <span className="text-[11px] text-muted">
          Added {new Date(listing.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <Link
          href={`/listings/${listing.id}/edit`}
          style={{ color: "var(--color-accent)" }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
        >
          <Pencil size={12} /> Edit
        </Link>
      </div>
    </article>
  );
}
