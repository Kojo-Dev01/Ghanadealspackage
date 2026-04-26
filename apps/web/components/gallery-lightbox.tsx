"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type GalleryLightboxProps = {
  images: string[];
  alt: string;
};

/** Image that stays invisible until loaded, revealing over a shimmer parent */
function GalleryImage(props: React.ComponentProps<typeof Image>) {
  const [loaded, setLoaded] = useState(false);
  const { style, ...rest } = props;

  return (
    <Image
      {...rest}
      loading="eager"
      style={{ ...style, opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease" }}
      onLoadingComplete={() => setLoaded(true)}
    />
  );
}

export function GalleryLightbox({ images, alt }: GalleryLightboxProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

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

  return (
    <>
      {/* Gallery grid */}
      <div className="gallery-grid" style={{ marginTop: 20, cursor: "pointer" }}>
        <div className="gallery-main gd-shimmer-bg" onClick={() => openAt(0)}>
          <GalleryImage src={images[0]} alt={alt} width={1200} height={700} priority sizes="(max-width: 768px) 100vw, 65vw" quality={80} />
          <div className="card-photo-count" style={{ position: "absolute", bottom: 12, left: 12 }}>{images.length} Photos</div>
        </div>
        <div className="gallery-side">
          <div className="gallery-side-img gd-shimmer-bg" onClick={() => openAt(1)}>
            <GalleryImage src={images[1] ?? images[0]} alt="Interior" width={500} height={320} sizes="(max-width: 768px) 0px, 35vw" quality={75} />
          </div>
          <div className="gallery-side-img gd-shimmer-bg" style={{ position: "relative" }} onClick={() => openAt(2)}>
            <GalleryImage src={images[2] ?? images[0]} alt="View" width={500} height={320} sizes="(max-width: 768px) 0px, 35vw" quality={75} />
            {images.length > 3 && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, borderRadius: "inherit" }}>
                +{images.length - 3} more
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 3 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginTop: 12 }}>
          {images.map((src, i) => (
            <div key={i} onClick={() => openAt(i)} className="gd-shimmer-bg" style={{ flexShrink: 0, width: 140, height: 95, borderRadius: 8, overflow: "hidden", border: "2px solid var(--border, #eee)", cursor: "pointer" }}>
              <GalleryImage src={src} alt={`Photo ${i + 1}`} width={140} height={95} style={{ width: "100%", height: "100%", objectFit: "cover" }} sizes="140px" quality={70} />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setOpen(false)}
        >
          {/* Close button */}
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
            <Image
              src={images[index]}
              alt={`${alt} - Photo ${index + 1}`}
              width={1400}
              height={900}
              style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }}
              priority
              unoptimized
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
              <div
                key={i}
                onClick={() => setIndex(i)}
                style={{
                  flexShrink: 0, width: 72, height: 52, borderRadius: 6, overflow: "hidden", cursor: "pointer",
                  border: i === index ? "2px solid #fff" : "2px solid transparent",
                  opacity: i === index ? 1 : 0.5,
                  transition: "opacity 0.2s, border-color 0.2s",
                }}
              >
                <Image src={src} alt={`Thumb ${i + 1}`} width={72} height={52} style={{ width: "100%", height: "100%", objectFit: "cover" }} sizes="72px" quality={65} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
