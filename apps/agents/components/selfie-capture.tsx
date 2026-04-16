"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, Loader2, X, CheckCircle2 } from "lucide-react";

type Props = {
  onCapture: (url: string) => void;
  existingUrl?: string;
  disabled?: boolean;
};

export function SelfieCaptureWidget({ onCapture, existingUrl, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"streaming" | "captured">("streaming");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(!!existingUrl);

  /* Clean up camera on unmount */
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* Start the live camera feed */
  const startCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMode("streaming");
    } catch {
      setError("Could not access camera. Please allow camera permissions and try again.");
    }
  }, []);

  /* Stop the camera */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /* Open modal and start camera */
  const openModal = useCallback(() => {
    setOpen(true);
    setCapturedBlob(null);
    setPreview("");
    setMode("streaming");
    setError("");
    // Small delay so the video element renders before we start
    setTimeout(startCamera, 150);
  }, [startCamera]);

  /* Close modal and stop camera */
  const closeModal = useCallback(() => {
    stopCamera();
    setOpen(false);
    setCapturedBlob(null);
    setPreview("");
  }, [stopCamera]);

  /* Capture a frame from the video to canvas → blob */
  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror horizontally for selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setPreview(URL.createObjectURL(blob));
        setMode("captured");
        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  }, [stopCamera]);

  /* Retake — clear captured, restart camera */
  const retake = useCallback(() => {
    setPreview("");
    setCapturedBlob(null);
    setTimeout(startCamera, 100);
  }, [startCamera]);

  /* Upload the captured selfie to S3 */
  const uploadSelfie = useCallback(async () => {
    if (!capturedBlob) return;
    setUploading(true);
    setError("");

    try {
      const file = new File([capturedBlob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "kyc");

      const res = await fetch("/api/uploads/sign", { method: "POST", body });
      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();
      onCapture(url);
      setDone(true);
      closeModal();
    } catch {
      setError("Failed to upload selfie. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [capturedBlob, onCapture, closeModal]);

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Camera size={16} className="text-accent" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Live Face Capture
        </span>
      </div>

      {/* Trigger button */}
      {!done ? (
        <button
          type="button"
          onClick={openModal}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl px-4 py-8 text-center hover:border-accent/40 hover:bg-accent/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
            <Camera size={28} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Take a Selfie</p>
            <p className="text-[11px] text-muted mt-0.5">
              Opens your camera for a live photo capture
            </p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 border-2 border-green-300 rounded-xl px-4 py-3 bg-green-50/40">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">Selfie captured</p>
            <p className="text-[11px] text-green-600">Your live photo has been saved</p>
          </div>
          <button
            type="button"
            onClick={openModal}
            disabled={disabled}
            className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            Retake
          </button>
        </div>
      )}

      <p className="text-[10px] text-muted/60">
        This live photo is used to verify your identity. No file picker is allowed — the photo must be taken live.
      </p>

      {/* ── Modal overlay ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative bg-panel border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Camera size={16} className="text-accent" /> Live Face Capture
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-muted hover:text-foreground hover:bg-panel-alt rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  {error}
                </p>
              )}

              {/* Camera feed */}
              {mode === "streaming" && (
                <div className="rounded-xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-[4/3] object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                </div>
              )}

              {/* Captured preview */}
              {mode === "captured" && preview && (
                <div className="rounded-xl overflow-hidden border border-green-300">
                  <img
                    src={preview}
                    alt="Selfie preview"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              )}

              {/* Hidden canvas */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-panel-alt">
              {mode === "streaming" ? (
                <>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capture}
                    className="inline-flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors cursor-pointer"
                  >
                    <Camera size={16} /> Capture
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={retake}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={uploadSelfie}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Uploading…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} /> Confirm Selfie
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
