"use client";

import { useState, useRef, useCallback } from "react";
import { X, Loader2, ImageIcon, Star } from "lucide-react";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  hint?: string;
};

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX = 10;

export function GalleryUploader({ value, onChange, max = DEFAULT_MAX, label = "Property Photos", hint }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    if (!ACCEPTED.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are allowed.");
      return null;
    }
    if (file.size > MAX_SIZE) {
      setError("Each image must be under 50 MB.");
      return null;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("folder", "properties");

    const res = await fetch("/api/uploads/sign", { method: "POST", body });

    if (!res.ok) {
      const msg = await res.json().catch(() => null);
      throw new Error(msg?.message ?? "Upload failed");
    }

    const { url } = await res.json();
    return url;
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    const remaining = max - value.length;
    if (remaining <= 0) {
      setError(`Maximum ${max} photos allowed.`);
      return;
    }

    const batch = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(`Only ${remaining} more photo${remaining === 1 ? "" : "s"} can be added.`);
    } else {
      setError("");
    }

    setUploading(true);

    try {
      const results = await Promise.all(batch.map((f) => uploadFile(f)));
      const uploaded = results.filter((u): u is string => u !== null);
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [value, onChange, max, uploadFile]);

  function handleFileInput(fileList: FileList | null) {
    if (!fileList?.length) return;
    uploadFiles(Array.from(fileList));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!e.dataTransfer.files.length) return;
    uploadFiles(Array.from(e.dataTransfer.files));
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index));
    setError("");
  }

  function handleSetMain(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onChange(next);
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <span className="text-[10px] text-muted/60">{value.length} / {max}</span>
      </div>

      {/* Uploaded images grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((url, i) => (
            <div key={url} className="relative group">
              <div className="rounded-lg overflow-hidden border border-border aspect-[4/3]">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
              {/* Main badge */}
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Star size={10} fill="currentColor" /> Main
                </span>
              )}
              {/* Action buttons */}
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetMain(i)}
                    title="Set as main photo"
                    className="p-1 bg-black/60 text-white rounded hover:bg-black/80 cursor-pointer"
                  >
                    <Star size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="p-1 bg-black/60 text-white rounded hover:bg-black/80 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone (show when under max) */}
      {value.length < max && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
            px-6 py-6 cursor-pointer transition-colors
            ${dragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/40 hover:bg-panel-alt"
            }
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="text-accent animate-spin" />
              <span className="text-sm text-muted">Uploading…</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <ImageIcon size={18} className="text-accent" />
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-foreground">
                  {value.length === 0 ? "Drag & drop photos" : "Add more photos"}
                </span>
                <p className="text-xs text-muted mt-0.5">
                  or <span className="text-accent font-semibold">click to browse</span>
                </p>
              </div>
              <p className="text-[10px] text-muted/60">JPG, PNG or WebP · max 50 MB each · up to {max} photos</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        onChange={(e) => handleFileInput(e.target.files)}
        className="hidden"
      />

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && <span className="text-[10px] text-muted/60">{hint}</span>}
    </div>
  );
}
