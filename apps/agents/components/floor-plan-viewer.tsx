"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = { images: string[]; alt?: string };

export function FloorPlanViewer({ images, alt = "Floor plan" }: Props) {
  const [openIndex, setOpenIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (openIndex < 0) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenIndex(-1); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [openIndex]);

  if (images.length === 0) return null;

  const lightbox = openIndex >= 0 && mounted
    ? createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setOpenIndex(-1)}
        >
          <button onClick={() => setOpenIndex(-1)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Close">✕</button>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[openIndex]} alt={`${alt} ${openIndex + 1}`} style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8, background: "#fff" }} />
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(images.length, 2)}, 1fr)`, gap: 12 }}>
        {images.map((src, i) => (
          <button key={i} type="button" onClick={() => setOpenIndex(i)}
            style={{ display: "block", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "var(--color-panel-alt, #fafafa)", padding: 0, transition: "opacity 0.15s" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${alt} ${i + 1}`} style={{ width: "100%", height: "auto", display: "block" }} />
          </button>
        ))}
      </div>
      {lightbox}
    </>
  );
}
