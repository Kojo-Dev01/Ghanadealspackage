"use client";

import { useState } from "react";
import { ImageLightbox } from "./image-lightbox";

type Props = {
  images: string[];
  alt?: string;
  /** "grid" shows a multi-column grid; "strip" shows a horizontal scroll row of small thumbs */
  layout?: "grid" | "strip";
  columns?: number;
  /** Extra CSS class for the image */
  imgClassName?: string;
};

export function ClickableGallery({ images, alt = "Image", layout = "grid", columns = 2, imgClassName }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  if (images.length === 0) return null;

  const containerClass =
    layout === "strip"
      ? "flex gap-2 overflow-x-auto"
      : "grid gap-3";

  const containerStyle =
    layout === "strip"
      ? undefined
      : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };

  const defaultImgClass =
    layout === "strip"
      ? "w-24 h-16 md:w-28 md:h-20 object-cover"
      : "w-full h-auto";

  return (
    <>
      <div className={containerClass} style={containerStyle}>
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className={`${layout === "strip" ? "shrink-0" : "block"} border border-border rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${alt} ${i + 1}`}
              className={imgClassName ?? defaultImgClass}
            />
          </button>
        ))}
      </div>
      <ImageLightbox
        images={images}
        alt={alt}
        openAt={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
      />
    </>
  );
}
