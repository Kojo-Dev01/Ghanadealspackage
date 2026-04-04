"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type Props = {
  images: string[];
  alt?: string;
  /** Index of the image to open the lightbox at (controlled externally). Set to -1 or undefined to close. */
  openAt?: number;
  onClose?: () => void;
};

export function ImageLightbox({ images, alt = "Image", openAt, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const open = openAt != null && openAt >= 0;

  useEffect(() => { setMounted(true); }, []);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (openAt != null && openAt >= 0) setIndex(openAt);
  }, [openAt]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, prev, next, onClose]);

  if (!open || !mounted || images.length === 0) return null;

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      onClick={() => onClose?.()}
    >
      {/* Close */}
      <button
        onClick={() => onClose?.()}
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

      {/* Thumbnail strip */}
      {images.length > 1 && (
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
                flexShrink: 0, width: 72, height: 52, borderRadius: 6, objectFit: "cover", cursor: "pointer",
                border: i === index ? "2px solid #fff" : "2px solid transparent",
                opacity: i === index ? 1 : 0.5,
                transition: "opacity 0.2s, border-color 0.2s",
              }}
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
