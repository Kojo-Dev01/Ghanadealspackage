"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../components/auth-provider";

const REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central", "Northern",
  "Volta", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
  "Savannah", "North East", "Oti", "Western North",
];

const DOC_TYPES = [
  { value: "ghana_card" as const, label: "Ghana Card", description: "Front and back scan of your Ghana Card" },
  { value: "passport" as const, label: "Passport", description: "Bio-data page of your valid passport" },
];

type DocEntry = {
  type: "ghana_card" | "passport";
  file: File | null;
  url: string;
  name: string;
};

/* ─── Shell for not-logged-in / already-seller states ─── */
function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", padding: 20 }}>
      <div style={{ maxWidth: 480, width: "100%", background: "var(--bg-card)", borderRadius: 16, padding: "48px 36px", textAlign: "center", border: "1px solid var(--border-primary)" }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Step indicator ────────────────────────────────────── */
function StepIndicator({ current }: { current: 1 | 2 }) {
  const steps = [
    { num: 1, label: "Account Info" },
    { num: 2, label: "Verification" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={s.num} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
              background: s.num <= current ? "var(--red)" : "var(--bg-secondary)",
              color: s.num <= current ? "#fff" : "var(--text-tertiary)",
              border: s.num <= current ? "none" : "1px solid var(--border-primary)",
            }}>
              {s.num < current ? "✓" : s.num}
            </div>
            <span style={{ fontSize: 13, fontWeight: s.num === current ? 600 : 400, color: s.num === current ? "var(--text-primary)" : "var(--text-tertiary)" }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 40, height: 1, background: current > 1 ? "var(--red)" : "var(--border-primary)", margin: "0 12px" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SellerRegisterPage() {
  const { user, agent, upgrade } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // KYC state
  const [documents, setDocuments] = useState<DocEntry[]>([
    { type: "ghana_card", file: null, url: "", name: "" },
  ]);
  const [uploading, setUploading] = useState(false);
  const [kycError, setKycError] = useState("");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Already a seller
  if (user?.role === "agent" || agent) {
    return (
      <CenteredCard>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
          You&apos;re already a seller
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
          Your account has seller access. Go to your seller dashboard to manage listings.
        </p>
        <Link href="/sellers" style={{ display: "inline-block", padding: "10px 28px", borderRadius: 8, background: "var(--red)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Go to Seller Dashboard
        </Link>
      </CenteredCard>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <CenteredCard>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
          List Your Property
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
          Sign in or create an account first, then you can upgrade to a seller account.
        </p>
        <Link href="/" style={{ display: "inline-block", padding: "10px 28px", borderRadius: 8, background: "var(--red)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Go to Homepage
        </Link>
      </CenteredCard>
    );
  }

  const toggleArea = (region: string) => {
    setSelectedAreas((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  /* ── Step 1: upgrade account ──────────────────────────── */
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (selectedAreas.length === 0) {
      setError("Please select at least one region you operate in.");
      setSubmitting(false);
      return;
    }

    const result = await upgrade({
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      areas: selectedAreas,
    });

    if (!result.ok) {
      setError(result.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setStep(2);
  };

  /* ── Step 2 helpers: KYC docs ─────────────────────────── */
  const addDocument = () => {
    if (documents.length >= 2) return;
    const used = new Set(documents.map((d) => d.type));
    const next = DOC_TYPES.find((t) => !used.has(t.value))?.value ?? "ghana_card";
    setDocuments([...documents, { type: next, file: null, url: "", name: "" }]);
  };

  const removeDocument = (idx: number) => {
    if (documents.length <= 1) return;
    setDocuments(documents.filter((_, i) => i !== idx));
  };

  const updateDocType = (idx: number, type: DocEntry["type"]) => {
    setDocuments(documents.map((d, i) => (i === idx ? { ...d, type } : d)));
  };

  const updateDocFile = (idx: number, file: File | null) => {
    setDocuments(documents.map((d, i) => (i === idx ? { ...d, file, name: file?.name ?? "" } : d)));
  };

  async function uploadFile(file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    body.append("folder", "kyc");
    const res = await fetch("/api/uploads/sign", { method: "POST", body });
    if (!res.ok) throw new Error("Upload failed");
    const { url } = await res.json();
    return url;
  }

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError("");

    const missing = documents.some((d) => !d.file);
    if (missing) {
      setKycError("Please select a file for each document.");
      return;
    }

    setUploading(true);
    try {
      // Upload files to S3
      const uploaded = await Promise.all(
        documents.map(async (doc) => {
          const url = await uploadFile(doc.file!);
          return { type: doc.type, url, name: doc.name };
        })
      );

      // Submit verification
      const res = await fetch("/api/v1/agent/verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documents: uploaded }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message ?? "Verification submission failed");
      }

      // Done — go to seller dashboard
      router.push("/sellers");
    } catch (err: unknown) {
      setKycError(err instanceof Error ? err.message : "Failed to submit documents. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSkipKyc = () => {
    router.push("/sellers");
  };

  const busy = submitting || uploading;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 560, width: "100%", background: "var(--bg-card)", borderRadius: 16, padding: "40px 36px", border: "1px solid var(--border-primary)" }}>

        <StepIndicator current={step} />

        {/* ─────── STEP 1: Account Info ─────── */}
        {step === 1 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(230,57,70,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>Become a Seller</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Upgrade your account to list properties on GhanaDeals. You&apos;ll keep all your buyer features.
              </p>
            </div>

            {error && (
              <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.2)", color: "var(--red)", fontSize: 13, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleStep1}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Company / Business Name <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(optional)</span>
                </label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Accra Realty Ltd." disabled={busy}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Phone Number <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(optional — uses your current number if blank)</span>
                </label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 024 123 4567" disabled={busy}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Areas You Operate In <span style={{ color: "var(--red)", fontWeight: 400 }}>*</span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {REGIONS.map((region) => {
                    const active = selectedAreas.includes(region);
                    return (
                      <button key={region} type="button" onClick={() => toggleArea(region)} disabled={busy}
                        style={{ padding: "6px 14px", borderRadius: 999, border: active ? "1px solid var(--red)" : "1px solid var(--border-primary)", background: active ? "rgba(230,57,70,0.1)" : "var(--bg-secondary)", color: active ? "var(--red)" : "var(--text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s ease" }}>
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 20 }}>You can update your regions later from your seller profile.</p>

              <button type="submit" disabled={busy}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: busy ? "var(--text-tertiary)" : "var(--red)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>
                {submitting ? "Upgrading…" : "Continue"}
              </button>
            </form>

            <div style={{ borderTop: "1px solid var(--border-primary)", marginTop: 24, paddingTop: 20, textAlign: "center" }}>
              <Link href="/account" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>← Back to My Dashboard</Link>
            </div>
          </>
        )}

        {/* ─────── STEP 2: KYC Verification ─────── */}
        {step === 2 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(16,185,129,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4" /><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>Account Upgraded!</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Now submit your verification documents to get a verified badge and build trust with buyers.
              </p>
            </div>

            {/* Info banner */}
            <div style={{ display: "flex", gap: 10, padding: 14, borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", marginBottom: 24 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Upload a clear photo or scan of your <strong>Ghana Card</strong> or <strong>Passport</strong>. Accepted formats: JPG, PNG, PDF.
              </p>
            </div>

            {kycError && (
              <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.2)", color: "var(--red)", fontSize: 13, marginBottom: 20 }}>
                {kycError}
              </div>
            )}

            <form onSubmit={handleSubmitKyc}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {documents.map((doc, idx) => {
                  const meta = DOC_TYPES.find((t) => t.value === doc.type) ?? DOC_TYPES[0];
                  return (
                    <div key={idx} style={{
                      position: "relative",
                      border: doc.file ? "2px solid rgba(16,185,129,0.4)" : "2px solid var(--border-primary)",
                      borderRadius: 12,
                      padding: 20,
                      background: doc.file ? "rgba(16,185,129,0.04)" : "var(--bg-secondary)",
                      transition: "border-color 0.2s",
                    }}>
                      {documents.length > 1 && (
                        <button type="button" onClick={() => removeDocument(idx)} disabled={busy}
                          style={{ position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: 6, border: "none", background: "rgba(230,57,70,0.08)", color: "var(--red)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          ✕
                        </button>
                      )}

                      {/* Doc type */}
                      <div style={{ marginBottom: 12 }}>
                        <select value={doc.type} onChange={(e) => updateDocType(idx, e.target.value as DocEntry["type"])} disabled={busy}
                          style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", background: "transparent", border: "none", outline: "none", cursor: "pointer", padding: 0 }}>
                          {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>{meta.description}</p>
                      </div>

                      {/* File zone */}
                      <label style={{ display: "block", cursor: "pointer", position: "relative" }}>
                        <input
                          ref={(el) => { fileRefs.current[idx] = el; }}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => updateDocFile(idx, e.target.files?.[0] ?? null)}
                          disabled={busy}
                          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 10 }}
                        />
                        <div style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                          padding: "20px 16px",
                          border: "2px dashed",
                          borderColor: doc.file ? "rgba(16,185,129,0.3)" : "var(--border-primary)",
                          borderRadius: 8,
                          textAlign: "center",
                          transition: "border-color 0.2s",
                        }}>
                          {doc.file ? (
                            <>
                              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                              </svg>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>{doc.file.name}</span>
                              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Click to change</span>
                            </>
                          ) : (
                            <>
                              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Click to upload or drag &amp; drop</span>
                              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>JPG, PNG, or PDF</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Add another doc */}
              {documents.length < 2 && (
                <button type="button" onClick={addDocument} disabled={busy}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px dashed var(--border-primary)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", marginBottom: 20, transition: "border-color 0.15s" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  Add another document
                </button>
              )}

              {/* Submit */}
              <button type="submit" disabled={busy}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: busy ? "var(--text-tertiary)" : "var(--red)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>
                {uploading ? "Uploading…" : "Submit for Verification"}
              </button>

              {/* Skip */}
              <button type="button" onClick={handleSkipKyc} disabled={busy}
                style={{ width: "100%", padding: "10px 0", marginTop: 10, borderRadius: 10, border: "1px solid var(--border-primary)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Skip for now — I&apos;ll do this later
              </button>

              <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
                You can always submit verification documents from your seller dashboard.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
