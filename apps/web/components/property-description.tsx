"use client";

import { useRef, useState, useEffect } from "react";

/* ── Lightweight markdown-ish formatter ──
   Supports: **bold**, *italic*, __underline__, \n line breaks,
   blank-line paragraphs, and lines starting with # / ## / ### as headings.
   Returns sanitised HTML (no raw user HTML allowed). */
function formatDescription(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped.split(/\n\s*\n/);

  return paragraphs
    .map((para) => {
      const lines = para.split("\n").map((line) => {
        let l = line.trim();

        // Headings
        if (/^###\s+(.+)/.test(l)) return `<h5 style="font-size:15px;font-weight:700;margin:12px 0 4px">${l.replace(/^###\s+/, "")}</h5>`;
        if (/^##\s+(.+)/.test(l)) return `<h4 style="font-size:16px;font-weight:700;margin:14px 0 4px">${l.replace(/^##\s+/, "")}</h4>`;
        if (/^#\s+(.+)/.test(l)) return `<h3 style="font-size:17px;font-weight:700;margin:16px 0 6px">${l.replace(/^#\s+/, "")}</h3>`;

        // Bullet points
        if (/^[-•]\s+/.test(l)) {
          l = l.replace(/^[-•]\s+/, "");
          l = inlineFormat(l);
          return `<li style="margin-left:18px;list-style:disc;padding-left:4px">${l}</li>`;
        }

        return inlineFormat(l);
      });

      const joined = lines.join("<br/>");
      // Wrap non-heading/list content in <p>
      if (/^<h[345]/.test(joined) || /^<li/.test(joined)) return joined;
      return `<p style="margin-bottom:10px">${joined}</p>`;
    })
    .join("");
}

function inlineFormat(text: string): string {
  return (
    text
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      // Italic: *text* or _text_
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>")
  );
}

const COLLAPSED_HEIGHT = 160; // px before truncation kicks in

export function PropertyDescription({ text }: { text: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const html = formatDescription(text);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsTruncation(contentRef.current.scrollHeight > COLLAPSED_HEIGHT + 40);
    }
  }, [text]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (!modalOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

  return (
    <>
      {/* Collapsed view */}
      <div
        ref={contentRef}
        className="detail-description"
        style={
          needsTruncation
            ? {
                maxHeight: COLLAPSED_HEIGHT,
                overflow: "hidden",
                position: "relative",
                maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
              }
            : undefined
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {needsTruncation && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            color: "var(--red, #dc2626)",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            marginTop: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          Read full description
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17l9.2-9.2M17 17V7.8H7.8" />
          </svg>
        </button>
      )}

      {/* Full Description Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "descModalFadeIn 0.2s ease-out",
          }}
          onClick={() => setModalOpen(false)}
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-primary, #fff)",
              borderRadius: 20,
              maxWidth: 680,
              width: "100%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
              animation: "descModalSlideUp 0.25s ease-out",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px solid var(--border, #e2e8f0)",
                flexShrink: 0,
              }}
            >
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                Full Description
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "var(--bg-secondary, #f1f5f9)",
                  border: "none",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary, #64748b)",
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div
              className="detail-description"
              style={{
                padding: "20px 24px 28px",
                overflowY: "auto",
                lineHeight: 1.85,
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
          {/* Animation keyframes */}
          <style>{`
            @keyframes descModalFadeIn {
              from { opacity: 0 }
              to { opacity: 1 }
            }
            @keyframes descModalSlideUp {
              from { opacity: 0; transform: translateY(24px) scale(0.97) }
              to { opacity: 1; transform: translateY(0) scale(1) }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
