"use client";

import { useState } from "react";
import { ImageLightbox } from "./image-lightbox";

export function AvatarPreview({
  src,
  alt,
  fallback,
  fallbackBg,
  className = "",
}: {
  src?: string | null;
  alt: string;
  fallback: string;
  fallbackBg?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center text-white text-lg font-bold shrink-0 ${className}`}
        style={{ background: fallbackBg || "#64748b" }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`overflow-hidden shrink-0 bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </button>
      <ImageLightbox
        images={[src]}
        alt={alt}
        openAt={open ? 0 : -1}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
