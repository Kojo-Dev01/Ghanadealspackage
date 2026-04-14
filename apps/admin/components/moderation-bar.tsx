"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Star,
  XCircle,
  Trash2,
} from "lucide-react";
import { FormButton } from "@/components/form-button";

type Props = {
  listingId: string;
  listingTitle?: string;
  status: string;
  listingType: string;
  featured: boolean;
  moderatedAt: string | null;
  moderationReason: string | null;
  moderateAction: (formData: FormData) => Promise<void>;
  toggleFeaturedAction: () => Promise<void>;
  deleteAction?: () => Promise<void>;
};

const statusMeta: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#fde68a",
    icon: <Clock size={14} />,
  },
  approved: {
    label: "Approved",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#bbf7d0",
    icon: <CheckCircle2 size={14} />,
  },
  flagged: {
    label: "Rejected",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fecaca",
    icon: <AlertTriangle size={14} />,
  },
};

const typeMeta: Record<string, { label: string; color: string; bg: string }> = {
  sale: { label: "For Sale", color: "#2563eb", bg: "#eff6ff" },
  rent: { label: "For Rent", color: "#7c3aed", bg: "#f5f3ff" },
  land: { label: "Land", color: "#059669", bg: "#ecfdf5" },
  new: { label: "New Development", color: "#2563eb", bg: "#eff6ff" },
  commercial: { label: "Commercial", color: "#059669", bg: "#ecfdf5" },
};

export function ModerationBar({
  listingId,
  listingTitle,
  status,
  listingType,
  featured,
  moderatedAt,
  moderationReason,
  moderateAction,
  toggleFeaturedAction,
  deleteAction,
}: Props) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reason, setReason] = useState(moderationReason ?? "");
  const [pending, startTransition] = useTransition();

  const s = statusMeta[status] ?? statusMeta.pending;
  const t = typeMeta[listingType] ?? typeMeta.sale;

  const submit = (nextStatus: string, extraReason?: string) => {
    const fd = new FormData();
    fd.set("listingId", listingId);
    fd.set("moderationStatus", nextStatus);
    if (extraReason) fd.set("reason", extraReason);
    startTransition(() => { moderateAction(fd); });
  };

  const handleReject = () => {
    submit("flagged", reason);
    setShowRejectModal(false);
  };

  return (
    <>
      <section className="bg-panel border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: status + type + featured badge + meta */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: s.color,
                background: s.bg,
                border: `1px solid ${s.border}`,
              }}
            >
              {s.icon} {s.label}
            </span>

            {/* Type pill */}
            <span
              style={{
                display: "inline-block",
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: t.color,
                background: t.bg,
              }}
            >
              {t.label}
            </span>

            {/* Featured badge */}
            {featured && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#a16207",
                  background: "#fefce8",
                  border: "1px solid #fde68a",
                }}
              >
                <Star size={10} fill="currentColor" /> Featured
              </span>
            )}

            {/* Separator */}
            <span
              style={{
                width: 1,
                height: 16,
                background: "var(--color-border)",
              }}
            />

            {/* Featured toggle */}
            <form action={toggleFeaturedAction} style={{ display: "inline" }}>
              <FormButton
                type="submit"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: featured ? "#a16207" : "var(--color-muted)",
                  transition: "all 0.15s",
                }}
              >
                <Star size={12} fill={featured ? "currentColor" : "none"} />
                {featured ? "Unfeature" : "Feature"}
              </FormButton>
            </form>

            {moderatedAt && (
              <span className="text-xs text-muted">
                Moderated {moderatedAt}
              </span>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            {status !== "approved" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => submit("approved")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: "#16a34a",
                  color: "#fff",
                  transition: "opacity 0.15s",
                  opacity: pending ? 0.5 : 1,
                }}
              >
                <CheckCircle2 size={14} /> {pending ? "Approving…" : "Approve"}
              </button>
            )}

            {status !== "flagged" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => setShowRejectModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid #fecaca",
                  background: "#fff",
                  color: "#dc2626",
                  transition: "all 0.15s",
                  opacity: pending ? 0.5 : 1,
                }}
              >
                <XCircle size={14} /> Reject
              </button>
            )}

            {status !== "pending" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => submit("pending")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-foreground)",
                  transition: "all 0.15s",
                  opacity: pending ? 0.5 : 1,
                }}
              >
                <Clock size={14} /> {pending ? "Updating…" : "Set Pending"}
              </button>
            )}

            {deleteAction && (
              <form
                action={deleteAction}
                onSubmit={(e) => {
                  if (!confirm(`Permanently delete "${listingTitle || "this listing"}"? This cannot be undone.`)) e.preventDefault();
                }}
                style={{ display: "inline" }}
              >
                <FormButton
                  type="submit"
                  pendingText="Deleting…"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid #fecaca",
                    background: "#fce4ec",
                    color: "#7f1d1d",
                    transition: "all 0.15s",
                  }}
                >
                  <Trash2 size={14} /> Delete
                </FormButton>
              </form>
            )}
          </div>
        </div>

        {/* Rejection reason inline display */}
        {status === "flagged" && moderationReason && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              fontSize: 13,
              color: "#991b1b",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ fontWeight: 700 }}>Rejection reason:</strong>{" "}
            {moderationReason}
          </div>
        )}
      </section>

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowRejectModal(false)}
          />
          {/* Dialog */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 440,
              margin: "0 16px",
              background: "var(--color-panel, #fff)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-foreground)",
                margin: "0 0 4px",
              }}
            >
              Reject Listing
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-muted)",
                margin: "0 0 16px",
              }}
            >
              Provide a reason so the seller knows what to fix.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Images are low quality, description is misleading…"
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                fontSize: 13,
                lineHeight: 1.5,
                resize: "vertical",
                fontFamily: "inherit",
                background: "var(--color-panel-alt, #fafafa)",
                color: "var(--color-foreground)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-foreground)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleReject}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  opacity: pending ? 0.5 : 1,
                }}
              >
                {pending ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
