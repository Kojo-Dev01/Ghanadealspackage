"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Loader2, X } from "lucide-react";

type Props = {
  currentUrl?: string | null;
  agentName: string;
  agentColor: string;
  onSaved: (url: string | null) => void;
};

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploader({ currentUrl, agentName, agentColor, onSaved }: Props) {
  const [preview, setPreview] = useState(currentUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = agentName
    .split(" ")
    .map((p) => p[0])
    .join("");

  const upload = useCallback(async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be under 5 MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "avatars");

      const res = await fetch("/api/uploads/sign", { method: "POST", body });
      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        throw new Error(msg?.message ?? "Upload failed");
      }

      const { url } = await res.json();
      setPreview(url);
      onSaved(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onSaved]);

  function handleRemove() {
    setPreview("");
    setError("");
    onSaved(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar circle */}
      <div className="relative group">
        <div
          className="flex items-center justify-center rounded-full overflow-hidden"
          style={{
            width: 80,
            height: 80,
            background: preview ? undefined : agentColor,
            fontSize: 28,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {preview ? (
            <img src={preview} alt={agentName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Overlay camera button */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {uploading ? (
            <Loader2 size={22} className="text-white animate-spin" />
          ) : (
            <Camera size={22} className="text-white" />
          )}
        </button>

        {/* Remove button */}
        {preview && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Label text */}
      <div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer"
        >
          {uploading ? "Uploading…" : preview ? "Change Photo" : "Upload Photo"}
        </button>
        <p className="text-xs text-muted mt-0.5">JPG, PNG or WebP · max 5 MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
        className="hidden"
      />

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
