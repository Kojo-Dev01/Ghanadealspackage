import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AgentShell } from "@/components/agent-shell";
import { fetchVerificationStatus, submitVerification } from "@/lib/api";
import { KycUploadForm } from "@/components/kyc-upload-form";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";

export default async function VerificationPage() {
  const verification = await fetchVerificationStatus();

  if (!verification) {
    redirect("/login?next=%2Fverification");
  }

  const { verificationStatus, kycDocuments, selfieUrl, submittedAt, verifiedAt, rejectionReason } = verification;

  async function submitKycAction(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const token = cookieStore.get("gd_agent_session")?.value;
    if (!token) redirect("/login?next=%2Fverification");

    const docsRaw = formData.get("documents");
    if (!docsRaw) redirect("/verification?error=missing");

    let documents: Array<{ type: string; url: string; name: string }>;
    try {
      documents = JSON.parse(String(docsRaw));
    } catch {
      redirect("/verification?error=invalid");
    }

    const selfieUrl = String(formData.get("selfieUrl") ?? "").trim();

    const result = await submitVerification(documents, selfieUrl || undefined);

    if (result.ok) {
      redirect("/verification?success=1");
    } else {
      redirect("/verification?error=1");
    }
  }

  return (
    <AgentShell
      eyebrow="Account"
      title="Verification"
      description="Get verified to build trust with buyers and access premium features."
    >
      {/* Status Banner */}
      {verificationStatus === "approved" && (
        <section className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle2 size={24} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-green-800">
              Verified Seller
            </h2>
            <p className="text-sm text-green-700 mt-0.5">
              Your identity has been verified. A verification badge is displayed
              on your profile and listings.
            </p>
            {verifiedAt && (
              <p className="text-xs text-green-600 mt-1">
                Verified on{" "}
                {new Date(verifiedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </section>
      )}

      {verificationStatus === "pending" && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <Clock size={24} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-amber-800">
              Verification Pending
            </h2>
            <p className="text-sm text-amber-700 mt-0.5">
              Your documents have been submitted and are being reviewed by our
              team. This usually takes 1–2 business days.
            </p>
            {submittedAt && (
              <p className="text-xs text-amber-600 mt-1">
                Submitted on{" "}
                {new Date(submittedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </section>
      )}

      {verificationStatus === "rejected" && (
        <section className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <XCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-red-800">
              Verification Rejected
            </h2>
            <p className="text-sm text-red-700 mt-0.5">
              Your verification was not approved. Please review the reason below
              and submit again with updated documents.
            </p>
            {rejectionReason && (
              <p className="text-sm text-red-600 mt-2 bg-red-100 rounded-md px-3 py-2">
                <strong>Reason:</strong> {rejectionReason}
              </p>
            )}
          </div>
        </section>
      )}

      {verificationStatus === "unverified" && (
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
          <ShieldCheck size={24} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-blue-800">
              Get Verified
            </h2>
            <p className="text-sm text-blue-700 mt-0.5">
              Upload your identification documents to become a verified seller.
              Verified sellers receive a badge and higher visibility in search
              results.
            </p>
          </div>
        </section>
      )}

      {/* Requirements info */}
      <section className="bg-panel border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-3">
          Verification Requirements
        </h3>
        <ul className="grid gap-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">Step 1.</span>
            <span>
              <strong>Ghana Card or Passport</strong> — A clear photo or scan
              of your Ghana Card (front and back) or the bio-data page of your valid passport.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">Step 2.</span>
            <span>
              <strong>Live Face Capture</strong> — A live selfie taken
              using your device camera. No uploaded photos allowed.
            </span>
          </li>
        </ul>
      </section>

      {/* Submitted Documents (when pending or approved) */}
      {(verificationStatus === "pending" || verificationStatus === "approved") &&
        kycDocuments.length > 0 && (
          <section className="bg-panel border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3">
              Submitted Documents
            </h3>
            <div className="grid gap-2">
              {kycDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm text-muted bg-panel-alt rounded-lg px-3 py-2"
                >
                  <FileText size={16} className="text-accent shrink-0" />
                  <span className="flex-1 truncate">{doc.name}</span>
                  <span className="text-xs capitalize bg-slate-100 px-2 py-0.5 rounded">
                    {doc.type.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Submitted Selfie (when pending or approved) */}
      {(verificationStatus === "pending" || verificationStatus === "approved") &&
        selfieUrl && (
          <section className="bg-panel border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3">
              Live Selfie
            </h3>
            <div className="rounded-xl border border-border overflow-hidden max-w-[200px]">
              <img
                src={selfieUrl}
                alt="Verification selfie"
                className="w-full object-cover"
                style={{ aspectRatio: "3/4" }}
              />
            </div>
          </section>
        )}

      {/* Upload Form (when unverified or rejected) */}
      {(verificationStatus === "unverified" ||
        verificationStatus === "rejected") && (
        <section className="bg-panel border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-1">
            Upload Documents
          </h3>
          <p className="text-xs text-muted mb-4">
            Please provide at least one document. Accepted formats: PDF, JPG,
            PNG. Maximum 2 documents.
          </p>
          <KycUploadForm
            submitAction={submitKycAction}
          />
        </section>
      )}
    </AgentShell>
  );
}
