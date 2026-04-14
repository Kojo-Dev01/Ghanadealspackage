"use client";

import { useRouter } from "next/navigation";
import { MapPin, Bed, Bath, Ruler, User, Trash2 } from "lucide-react";
import { FormButton } from "@/components/form-button";
import type { AdminListing } from "@/lib/api";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

function resolveImg(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${WEB_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

export function AdminListingCard({
  listing,
  moderateAction,
  deleteAction,
  status,
  query,
  page,
  currentType,
}: {
  listing: AdminListing;
  moderateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  status: string;
  query: string;
  page: number;
  currentType: string;
}) {
  const imgSrc = resolveImg(listing.image);
  const router = useRouter();

  return (
    <article
      className="bg-panel border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer"
      onClick={() => router.push(`/listings/${listing.id}`)}
      onDoubleClick={(e) => {
        e.preventDefault();
        const el = document.querySelector(`[data-moderate-id="${listing.id}"]`) as HTMLElement | null;
        el?.click();
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-panel-alt" style={{ aspectRatio: '16/10' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">
            No image
          </div>
        )}
        {/* Listing type badge — top left */}
        <div className="absolute" style={{ top: 10, left: 10 }}>
          <span
            className="text-white text-[11px] font-bold uppercase tracking-wide rounded-full"
            style={{
              padding: '4px 10px',
              backdropFilter: 'blur(4px)',
              background: listing.listingType === "sale" ? 'rgba(59,130,246,0.9)' : 'rgba(139,92,246,0.9)',
            }}
          >
            For {listing.listingType}
          </span>
        </div>
        {/* Agent name — bottom left */}
        <div
          className="absolute flex items-center gap-1 text-white text-xs font-medium rounded-full"
          style={{ bottom: 10, left: 10, padding: '4px 10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <User size={11} /> {listing.agentName}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-xs text-muted font-medium uppercase tracking-wide mb-1">
          {listing.type} · {listing.region}
        </div>
        <div className="text-lg font-bold text-foreground mb-0.5">
          {listing.priceFormatted}
        </div>
        <h3 className="text-sm font-semibold text-foreground truncate mb-1.5">
          {listing.title}
        </h3>
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

      {/* Rejection reason if flagged */}
      {listing.moderationStatus === "flagged" && listing.moderationReason && (
        <div className="mx-4 mb-3 p-2.5 rounded-lg text-xs" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          <strong className="font-semibold">Rejection reason:</strong>{" "}
          {listing.moderationReason}
        </div>
      )}

      {/* Footer — date + actions */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <span className="text-[11px] text-muted">
          {new Date(listing.submittedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <div className="flex gap-2">
          {listing.moderationStatus !== "approved" && (
            <form action={moderateAction}>
              <input type="hidden" name="listingId" value={listing.id} />
              <input type="hidden" name="currentStatus" value={status} />
              <input type="hidden" name="currentQuery" value={query} />
              <input type="hidden" name="currentPage" value={String(page)} />
              <input type="hidden" name="currentType" value={currentType} />
              <FormButton
                name="moderationStatus"
                type="submit"
                value="approved"
                pendingText="Approving…"
                className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                style={{ background: '#dcfce7', color: '#166534' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.color = '#166534'; }}
              >
                Approve
              </FormButton>
            </form>
          )}
          {listing.moderationStatus !== "flagged" && (
            <button
              type="button"
              data-reject-id={listing.id}
              data-reject-title={listing.title}
              className="reject-trigger px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
              style={{ background: '#fee2e2', color: '#991b1b' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#991b1b'; }}
            >
              Reject
            </button>
          )}
          <form action={deleteAction} onSubmit={(e) => { if (!confirm(`Permanently delete "${listing.title}"?`)) e.preventDefault(); }}>
            <input type="hidden" name="listingId" value={listing.id} />
            <input type="hidden" name="currentStatus" value={status} />
            <input type="hidden" name="currentQuery" value={query} />
            <input type="hidden" name="currentPage" value={String(page)} />
            <input type="hidden" name="currentType" value={currentType} />
            <FormButton
              type="submit"
              pendingText="Deleting…"
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
              style={{ background: '#fce4ec', color: '#7f1d1d' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#991b1b'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fce4ec'; e.currentTarget.style.color = '#7f1d1d'; }}
            >
              <Trash2 size={12} /> Delete
            </FormButton>
          </form>
        </div>
      </div>

      {/* Hidden trigger for double-click moderate modal */}
      <button
        type="button"
        data-moderate-id={listing.id}
        data-reject-id={listing.id}
        data-reject-title={listing.title}
        className="moderate-trigger reject-trigger hidden"
        onClick={(e) => e.stopPropagation()}
      />
    </article>
  );
}
