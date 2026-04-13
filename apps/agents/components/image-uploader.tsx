"use client";

import { useState, useRef, useCallback } from "react";
import { X, Loader2, ImageIcon } from "lucide-react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
};

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({ value, onChange, label = "Property Image", hint }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be under 50 MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "properties");

      const res = await fetch("/api/uploads/sign", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        throw new Error(msg?.message ?? "Upload failed");
      }

      const { url } = await res.json();
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    uploadFile(files[0]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleRemove() {
    onChange("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>

      {value ? (
        /* ── Preview ── */
        <div className="relative group w-full max-w-xs">
          <div className="rounded-lg overflow-hidden border border-border aspect-[4/3]">
            <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
            px-6 py-8 cursor-pointer transition-colors
            ${dragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/40 hover:bg-panel-alt"
            }
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={28} className="text-accent animate-spin" />
              <span className="text-sm text-muted">Uploading…</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <ImageIcon size={22} className="text-accent" />
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-foreground">
                  Drag & drop an image
                </span>
                <p className="text-xs text-muted mt-0.5">
                  or <span className="text-accent font-semibold">click to browse</span>
                </p>
              </div>
              <p className="text-[10px] text-muted/60">JPG, PNG or WebP · max 50 MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}

      {hint && <span className="text-[10px] text-muted/60">{hint}</span>}
    </div>
  );
}
