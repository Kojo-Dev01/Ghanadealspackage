import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/admin-shell";
import { FormButton } from "@/components/form-button";
import {
  fetchAdminAgentById,
  verifyAgent,
  type VerificationStatus,
} from "@/lib/api";
import {
  ArrowLeft,
  Star,
  MapPin,
  Building2,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ExternalLink,
  Calendar,
  User,
  Briefcase,
  Bed,
  Bath,
  Ruler,
  AlertTriangle,
  Download,
} from "lucide-react";
import { AvatarPreview } from "@/components/avatar-preview";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

const STATUS_STYLE: Record<
  VerificationStatus,
  { label: string; pill: string }
> = {
  unverified: { label: "Unverified", pill: "bg-slate-100 text-slate-600 border border-slate-200" },
  pending: { label: "Pending Review", pill: "bg-amber-50 text-amber-700 border border-amber-200" },
  approved: { label: "Verified", pill: "bg-green-50 text-green-700 border border-green-200" },
  rejected: { label: "Rejected", pill: "bg-red-50 text-red-700 border border-red-200" },
};

function ModerationPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-green-50 text-green-700",
    flagged: "bg-red-50 text-red-700",
    archived: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${map[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

export default async function AdminAgentDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const agent = await fetchAdminAgentById(id);
  if (!agent) notFound();

  const vs = STATUS_STYLE[agent.verificationStatus] ?? STATUS_STYLE.unverified;
  const canReview =
    agent.verificationStatus === "pending" ||
    agent.verificationStatus === "unverified" ||
    agent.verificationStatus === "rejected";

  const hasPhoto = !!agent.avatarUrl;
  const hasDocs = agent.kycDocuments.length > 0;
  const hasPhone = !!agent.phone;
  const canApprove = hasPhoto && hasDocs && hasPhone;

  const checks = [
    { ok: hasPhoto, label: "Profile photo" },
    { ok: hasDocs, label: "KYC documents" },
    { ok: hasPhone, label: "Phone number" },
  ];

  async function approveAction() {
    "use server";
    const cookieStore = await cookies();
    if (!cookieStore.get("gd_admin_session")?.value) redirect("/login");
    const ok = await verifyAgent(id, "approve");
    revalidatePath(`/agents/${id}`);
    redirect(ok ? `/agents/${id}?success=approved` : `/agents/${id}?error=1`);
  }

  async function rejectAction(formData: FormData) {
    "use server";
    const cookieStore = await cookies();
    if (!cookieStore.get("gd_admin_session")?.value) redirect("/login");
    const reason = String(formData.get("reason") ?? "").trim();
    const ok = await verifyAgent(id, "reject", reason || undefined);
    revalidatePath(`/agents/${id}`);
    redirect(ok ? `/agents/${id}?success=rejected` : `/agents/${id}?error=1`);
  }

  return (
    <AdminShell
      eyebrow="Seller Details"
      title=""
      description=""
      actions={
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-panel-alt transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      }
    >
      {/* Flash messages */}
      {sp.success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm font-medium text-green-700">
          {sp.success === "approved" ? "Seller verified successfully." : sp.success === "rejected" ? "Verification rejected." : "Done."}
        </div>
      )}
      {sp.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm font-medium text-red-700">
          Something went wrong. Please try again.
        </div>
      )}

      {/* ─── Profile Header ─── */}
      <section className="bg-panel border border-border rounded-2xl p-6">
        <div className="flex items-start gap-5 max-sm:flex-col max-sm:items-center max-sm:text-center">
          {/* Avatar */}
          <AvatarPreview
            src={agent.avatarUrl}
            alt={agent.name}
            fallback={agent.name[0]?.toUpperCase() ?? "?"}
            fallbackBg={agent.color || "#64748b"}
            className="w-12 h-12 rounded-xl"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {agent.name}
              </h1>
              {agent.verified && <CheckCircle2 size={18} className="text-green-500" />}
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${vs.pill}`}>
                {vs.label}
              </span>
            </div>
            {agent.company && (
              <p className="text-sm text-muted mb-2">{agent.company}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-muted">
              {agent.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={13} className="shrink-0" /> {agent.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={13} className="shrink-0" /> {agent.years} yrs
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={13} className="shrink-0" /> {agent.listings.length} listings
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" /> {agent.rating.toFixed(1)}
              </span>
              {agent.areas.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0" /> {agent.areas.join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="shrink-0" />
                Joined {new Date(agent.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Rejection reason (visible on rejected) */}
        {agent.rejectionReason && agent.verificationStatus === "rejected" && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
            <span className="font-semibold">Rejection reason:</span> {agent.rejectionReason}
          </div>
        )}
      </section>

      {/* ─── Verification Actions ─── */}
      {canReview && (
        <section className="bg-panel border border-border rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-foreground mb-5 flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" /> Verification Review
          </h2>

          {/* Readiness checklist — vertical list */}
          <div className="grid gap-3 mb-6">
            {checks.map((c) => (
              <div
                key={c.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  c.ok
                    ? "bg-green-50/60 text-green-700 border border-green-200"
                    : "bg-slate-50 text-slate-500 border border-slate-200"
                }`}
              >
                {c.ok ? <CheckCircle2 size={16} className="shrink-0 text-green-500" /> : <XCircle size={16} className="shrink-0 text-slate-400" />}
                {c.label}
                {c.ok && <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-green-600">Provided</span>}
                {!c.ok && <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-slate-400">Missing</span>}
              </div>
            ))}
          </div>

          {!canApprove && (
            <div className="flex items-center gap-2.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
              <AlertTriangle size={15} className="shrink-0" />
              Seller must complete all requirements above before approval.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            <form action={approveAction} className="pt-4">
              <FormButton
                type="submit"
                pendingText="Approving…"
                disabled={!canApprove}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  canApprove
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 size={15} /> Approve
              </FormButton>
            </form>

            <form action={rejectAction} className="flex items-center gap-2 pt-4">
              <input
                name="reason"
                type="text"
                placeholder="Reason (optional)…"
                className="border border-border rounded-lg bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all w-52"
              />
              <FormButton
                type="submit"
                pendingText="Rejecting…"
                className="inline-flex items-center gap-1.5 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
              >
                <XCircle size={15} /> Reject
              </FormButton>
            </form>
          </div>
        </section>
      )}

      {/* ─── KYC Documents ─── */}
      <section className="bg-panel border border-border rounded-2xl p-6">
        <h2 className="text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
          <FileText size={16} className="text-accent" />
          Verification Documents
          {hasDocs && <span className="text-xs font-normal text-muted ml-0.5">({agent.kycDocuments.length})</span>}
        </h2>

        {hasDocs ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {agent.kycDocuments.map((doc, idx) => {
              const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.url);
              return (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block border border-border rounded-xl overflow-hidden hover:ring-2 hover:ring-accent/20 transition-all"
                >
                  {/* Preview */}
                  <div className="relative bg-slate-50" style={{ aspectRatio: "4/3" }}>
                    {isImg ? (
                      <img
                        src={doc.url}
                        alt={doc.name || doc.type.replace(/_/g, " ")}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <FileText size={36} />
                        <span className="text-xs font-medium">PDF Document</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-foreground px-2 py-1 rounded-md shadow-sm">
                        <ExternalLink size={10} /> Open
                      </span>
                    </div>
                  </div>
                  {/* Caption */}
                  <div className="px-3 py-2.5 border-t border-border flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground capitalize truncate">
                        {doc.type.replace(/_/g, " ")}
                      </p>
                      {doc.uploadedAt && (
                        <p className="text-[11px] text-muted">
                          {new Date(doc.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <Download size={13} className="text-muted shrink-0" />
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-slate-50 border border-border rounded-xl px-4 py-4 text-sm text-muted">
            <ShieldAlert size={18} className="shrink-0 text-slate-400" />
            No documents uploaded yet.
          </div>
        )}
      </section>

      {/* ─── Verification Timeline ─── */}
      <section className="bg-panel border border-border rounded-2xl p-6">
        <h2 className="text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock size={16} className="text-accent" /> Timeline
        </h2>
        <div className="relative pl-5 grid gap-4">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />

          <TimelineItem label="Account created" date={agent.createdAt} done />
          <TimelineItem
            label="Documents submitted"
            date={agent.verificationSubmittedAt}
            done={!!agent.verificationSubmittedAt}
          />
          <TimelineItem
            label={
              agent.verificationStatus === "approved"
                ? "Verified"
                : agent.verificationStatus === "rejected"
                  ? "Rejected"
                  : "Awaiting review"
            }
            date={agent.verifiedAt}
            done={agent.verificationStatus === "approved" || agent.verificationStatus === "rejected"}
            variant={
              agent.verificationStatus === "rejected"
                ? "error"
                : agent.verificationStatus === "approved"
                  ? "success"
                  : "default"
            }
          />
        </div>
      </section>

      {/* ─── Listings ─── */}
      <section className="bg-panel border border-border rounded-2xl p-6">
        <h2 className="text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-accent" />
          Listings
          <span className="text-xs font-normal text-muted">({agent.listings.length})</span>
        </h2>

        {agent.listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agent.listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group border border-border rounded-xl overflow-hidden hover:ring-2 hover:ring-accent/20 transition-all"
              >
                <div className="relative bg-slate-100" style={{ aspectRatio: "16/10" }}>
                  {listing.image ? (
                    <img
                      src={
                        listing.image.startsWith("http")
                          ? listing.image
                          : `${process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"}${listing.image.startsWith("/") ? "" : "/"}${listing.image}`
                      }
                      alt={listing.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                      No image
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span
                      className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{
                        backdropFilter: "blur(4px)",
                        background: listing.listingType === "rent" ? "rgba(139,92,246,.85)" : "rgba(59,130,246,.85)",
                      }}
                    >
                      {listing.listingType === "sale" ? "Buy" : listing.listingType}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <ModerationPill status={listing.moderationStatus} />
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted mb-0.5">
                    {listing.type}{listing.region ? ` · ${listing.region}` : ""}
                  </p>
                  <p className="text-[15px] font-bold text-foreground leading-snug">{listing.priceFormatted}</p>
                  <p className="text-[13px] font-medium text-foreground truncate">{listing.title}</p>
                  {listing.location && (
                    <p className="flex items-center gap-1 text-[11px] text-muted mt-1 truncate">
                      <MapPin size={10} /> {listing.location}
                    </p>
                  )}
                  {(listing.beds > 0 || listing.baths > 0 || listing.area > 0) && (
                    <div className="flex gap-3 pt-2 mt-2 border-t border-border text-[11px] text-muted">
                      {listing.beds > 0 && <span className="inline-flex items-center gap-1"><Bed size={11} /> {listing.beds}</span>}
                      {listing.baths > 0 && <span className="inline-flex items-center gap-1"><Bath size={11} /> {listing.baths}</span>}
                      {listing.area > 0 && <span className="inline-flex items-center gap-1"><Ruler size={11} /> {listing.area} sqm</span>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No listings yet.</p>
        )}
      </section>
    </AdminShell>
  );
}

/* ── Timeline ── */
function TimelineItem({
  label,
  date,
  done,
  variant = "default",
}: {
  label: string;
  date: string | null;
  done: boolean;
  variant?: "default" | "success" | "error";
}) {
  const dot = !done
    ? "bg-slate-200"
    : variant === "error"
      ? "bg-red-400"
      : variant === "success"
        ? "bg-green-400"
        : "bg-accent";

  return (
    <div className="relative flex items-start gap-3">
      <div className={`w-[14px] h-[14px] rounded-full ${dot} shrink-0 -ml-5 mt-0.5 ring-2 ring-white`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${done ? "text-foreground" : "text-muted"}`}>
          {label}
        </p>
        {date && (
          <p className="text-[11px] text-muted mt-0.5">
            {new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}
