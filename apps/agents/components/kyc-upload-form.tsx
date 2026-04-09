"use client";

import { useState, useTransition } from "react";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CreditCard,
  CheckCircle2,
  Plus,
} from "lucide-react";

type DocumentEntry = {
  type: "ghana_card" | "passport";
  file: File | null;
  url: string;
  name: string;
};

const DOC_TYPES = [
  {
    value: "ghana_card" as const,
    label: "Ghana Card",
    description: "A clear photo or scan of your Ghana Card (front and back)",
    icon: CreditCard,
  },
  {
    value: "passport" as const,
    label: "Passport",
    description: "Bio-data page of your valid passport",
    icon: CreditCard,
  },
];

const inputCls =
  "border border-border rounded-lg bg-panel-alt px-3 py-2.5 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

type Props = {
  submitAction: (formData: FormData) => Promise<void>;
};

export function KycUploadForm({ submitAction }: Props) {
  const [documents, setDocuments] = useState<DocumentEntry[]>([
    { type: "ghana_card", file: null, url: "", name: "" },
  ]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function addDocument() {
    if (documents.length >= 2) return;
    const usedTypes = new Set(documents.map((d) => d.type));
    const nextType = DOC_TYPES.find((t) => !usedTypes.has(t.value))?.value ?? "ghana_card";
    setDocuments([...documents, { type: nextType, file: null, url: "", name: "" }]);
  }

  function removeDocument(index: number) {
    if (documents.length <= 1) return;
    setDocuments(documents.filter((_, i) => i !== index));
  }

  function updateDocType(index: number, type: DocumentEntry["type"]) {
    setDocuments(documents.map((d, i) => (i === index ? { ...d, type } : d)));
  }

  function updateDocFile(index: number, file: File | null) {
    setDocuments(
      documents.map((d, i) =>
        i === index ? { ...d, file, name: file?.name ?? "" } : d
      )
    );
  }

  async function uploadFile(file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    body.append("folder", "kyc");

    const res = await fetch("/api/uploads/sign", {
      method: "POST",
      body,
    });

    if (!res.ok) throw new Error("Failed to upload file");
    const { url } = await res.json();
    return url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const missing = documents.some((d) => !d.file);
    if (missing) {
      setError("Please select a file for each document.");
      return;
    }

    setUploading(true);
    try {
      // Upload all files
      const uploaded = await Promise.all(
        documents.map(async (doc) => {
          const url = await uploadFile(doc.file!);
          return { type: doc.type, url, name: doc.name };
        })
      );

      // Submit via server action
      const formData = new FormData();
      formData.set("documents", JSON.stringify(uploaded));

      startTransition(() => {
        submitAction(formData);
      });
    } catch {
      setError("Failed to upload documents. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || isPending;

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {error && (
        <p className="px-3 py-2 bg-red-500/10 text-red-600 text-sm font-medium rounded-md">
          {error}
        </p>
      )}

      {documents.map((doc, idx) => {
        const docMeta = DOC_TYPES.find((t) => t.value === doc.type) ?? DOC_TYPES[0];
        const DocIcon = docMeta.icon;

        return (
          <div
            key={idx}
            className={`relative border-2 rounded-xl p-5 grid gap-4 transition-colors ${
              doc.file
                ? "border-green-300 bg-green-50/40"
                : "border-border bg-panel-alt hover:border-accent/30"
            }`}
          >
            {/* Remove button */}
            {documents.length > 1 && (
              <button
                type="button"
                onClick={() => removeDocument(idx)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                disabled={busy}
              >
                <X size={14} />
              </button>
            )}

            {/* Document type selector with icon */}
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  doc.file ? "bg-green-100" : "bg-accent/10"
                }`}
              >
                {doc.file ? (
                  <CheckCircle2 size={20} className="text-green-600" />
                ) : (
                  <DocIcon size={20} className="text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <select
                  value={doc.type}
                  onChange={(e) =>
                    updateDocType(
                      idx,
                      e.target.value as DocumentEntry["type"]
                    )
                  }
                  className="bg-transparent text-sm font-bold text-foreground border-none outline-none cursor-pointer p-0 -ml-0.5"
                  disabled={busy}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-0.5">
                  {docMeta.description}
                </p>
              </div>
            </div>

            {/* File drop zone */}
            <label className="relative block cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  updateDocFile(idx, e.target.files?.[0] ?? null)
                }
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                disabled={busy}
              />
              <div
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-5 text-center transition-colors ${
                  doc.file
                    ? "border-green-300 bg-green-50"
                    : "border-slate-200 hover:border-accent/40 hover:bg-accent/5"
                }`}
              >
                {doc.file ? (
                  <>
                    <FileText size={24} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800 truncate max-w-full">
                      {doc.file.name}
                    </span>
                    <span className="text-[11px] text-green-600">
                      {(doc.file.size / 1024).toFixed(0)} KB · Click to
                      replace
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Upload size={20} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Click to upload
                    </span>
                    <span className="text-[11px] text-muted">
                      PDF, JPG, or PNG · Max 10 MB
                    </span>
                  </>
                )}
              </div>
            </label>
          </div>
        );
      })}

      {documents.length < 2 && (
        <button
          type="button"
          onClick={addDocument}
          className="flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover border-2 border-dashed border-accent/30 hover:border-accent/50 rounded-xl px-4 py-3 transition-colors cursor-pointer justify-self-stretch text-center justify-center"
          disabled={busy}
        >
          <Plus size={16} />
          Add another document
        </button>
      )}

      <div className="border-t border-border pt-5 mt-1">
        <button
          type="submit"
          disabled={busy}
          className="w-full sm:w-auto bg-accent text-white py-3 px-8 rounded-xl text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2 justify-center shadow-sm"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {uploading
            ? "Uploading documents…"
            : isPending
              ? "Submitting…"
              : "Submit for Verification"}
        </button>
        <p className="text-[11px] text-muted mt-2">
          Documents are securely uploaded and reviewed by our team within 1–2 business days.
        </p>
      </div>
    </form>
  );
}
