"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function RejectModal({
  moderateAction,
  currentStatus,
  currentQuery,
  currentPage,
  currentType,
}: {
  moderateAction: (formData: FormData) => Promise<void>;
  currentStatus: string;
  currentQuery: string;
  currentPage: number;
  currentType: string;
}) {
  const [open, setOpen] = useState(false);
  const [listingId, setListingId] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest(".reject-trigger") as HTMLElement | null;
      if (!target) return;
      const id = target.dataset.rejectId ?? "";
      const title = target.dataset.rejectTitle ?? "";
      setListingId(id);
      setListingTitle(title);
      setReason("");
      setOpen(true);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={() => setOpen(false)}
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        style={{
          position: 'relative',
          background: 'var(--color-panel, #fff)',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: 448,
          margin: '0 16px',
          padding: 24,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted hover:text-foreground transition-colors cursor-pointer"
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-foreground" style={{ marginBottom: 4 }}>Reject Listing</h2>
        <p className="text-sm text-muted truncate" style={{ marginBottom: 16 }}>
          {listingTitle}
        </p>

        <form
          action={async (formData: FormData) => {
            setSubmitting(true);
            await moderateAction(formData);
            setOpen(false);
            setSubmitting(false);
          }}
        >
          <input type="hidden" name="listingId" value={listingId} />
          <input type="hidden" name="moderationStatus" value="flagged" />
          <input type="hidden" name="currentStatus" value={currentStatus} />
          <input type="hidden" name="currentQuery" value={currentQuery} />
          <input type="hidden" name="currentPage" value={String(currentPage)} />
          <input type="hidden" name="currentType" value={currentType} />

          <label className="block text-sm font-semibold text-foreground" style={{ marginBottom: 6 }}>
            Reason for rejection <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            name="reason"
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this listing is being rejected…"
            style={{
              width: '100%',
              border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: 8,
              background: 'var(--color-panel-alt, #f8fafc)',
              padding: '8px 12px',
              fontSize: 14,
              color: 'var(--color-foreground, #0f172a)',
              resize: 'none',
              outline: 'none',
              marginBottom: 16,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-foreground cursor-pointer"
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'transparent', border: 'none' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || submitting}
              className="cursor-pointer"
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                opacity: (!reason.trim() || submitting) ? 0.5 : 1,
                cursor: (!reason.trim() || submitting) ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? "Rejecting…" : "Reject Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
