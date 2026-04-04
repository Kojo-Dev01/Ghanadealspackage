"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type Props = {
  images: string[];
  alt: string;
};

export function AdminGallery({ images, alt }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, prev, next]);

  const openAt = (i: number) => { setIndex(i); setOpen(true); };

  if (images.length === 0) return null;

  const lightbox = open && mounted
    ? createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}
            aria-label="Close"
          >
            ✕
          </button>

          {/* Counter */}
          <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, zIndex: 2 }}>
            {index + 1} / {images.length}
          </div>

          {/* Main image */}
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[index]}
              alt={`${alt} - ${index + 1}`}
              style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }}
            />
          </div>

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 48, height: 48, borderRadius: "50%", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 48, height: 48, borderRadius: "50%", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}

          {/* Thumbnail strip in lightbox */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 16, padding: "0 20px", maxWidth: "90vw" }}
          >
            {images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`Thumb ${i + 1}`}
                onClick={() => setIndex(i)}
                style={{
                  flexShrink: 0, width: 72, height: 52, borderRadius: 6, overflow: "hidden", cursor: "pointer", objectFit: "cover",
                  border: i === index ? "2px solid #fff" : "2px solid transparent",
                  opacity: i === index ? 1 : 0.5,
                  transition: "opacity 0.2s, border-color 0.2s",
                }}
              />
            ))}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {/* Gallery Grid: 1 large + 2 stacked side */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 6, borderRadius: 12, overflow: "hidden", height: 340, cursor: "pointer" }}>
        {/* Main image */}
        <div style={{ position: "relative", overflow: "hidden" }} onClick={() => openAt(0)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, backdropFilter: "blur(4px)" }}>
            {images.length} Photos
          </div>
        </div>

        {/* Side stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }} onClick={() => openAt(1)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[1] ?? images[0]} alt="Interior" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }} onClick={() => openAt(2)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[2] ?? images[0]} alt="View" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {images.length > 3 && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>
                +{images.length - 3} more
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 3 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 10, paddingBottom: 4 }}>
          {images.map((src, i) => (
            <div
              key={i}
              onClick={() => openAt(i)}
              style={{ flexShrink: 0, width: 120, height: 80, borderRadius: 8, overflow: "hidden", border: "2px solid var(--color-border, #e2e8f0)", cursor: "pointer", transition: "border-color 0.2s" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      )}

      {lightbox}
    </>
  );
}
