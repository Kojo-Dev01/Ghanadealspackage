import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/admin-shell";
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
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

const STATUS_INFO: Record<
  VerificationStatus,
  { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }
> = {
  unverified: {
    label: "Unverified",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: ShieldAlert,
  },
  pending: {
    label: "Pending Review",
    color: "text-amber-700",
    bg: "bg-amber-50/60",
    border: "border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Verified",
    color: "text-green-700",
    bg: "bg-green-50/60",
    border: "border-green-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700",
    bg: "bg-red-50/60",
    border: "border-red-200",
    icon: XCircle,
  },
};

function ModerationPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    flagged: "bg-red-100 text-red-700",
    archived: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${styles[status] ?? "bg-slate-100 text-slate-500"}`}
    >
      {status}
    </span>
  );
}

export default async function AdminAgentDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const agent = await fetchAdminAgentById(id);
  if (!agent) notFound();

  const status = STATUS_INFO[agent.verificationStatus] ?? STATUS_INFO.unverified;
  const StatusIcon = status.icon;
  const canReview =
    agent.verificationStatus === "pending" ||
    agent.verificationStatus === "unverified" ||
    agent.verificationStatus === "rejected";

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
      activeNav="agents"
      eyebrow="Seller Details"
      title={agent.name}
      description={agent.company || "Independent Seller"}
      actions={
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-panel-alt transition-colors"
        >
          <ArrowLeft size={14} /> Back to Sellers
        </Link>
      }
    >
      {/* Flash messages */}
      {sp.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm font-medium text-green-700">
          {sp.success === "approved"
            ? "Seller has been verified successfully."
            : sp.success === "rejected"
              ? "Seller verification has been rejected."
              : "Action completed."}
        </div>
      )}
      {sp.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm font-medium text-red-700">
          Something went wrong. Please try again.
        </div>
      )}

      <div className="grid grid-cols-[1fr_340px] gap-5 max-lg:grid-cols-1">
        {/* ── Left Column ── */}
        <div className="grid gap-5 content-start">
          {/* Verification Status Banner */}
          <section
            className={`rounded-xl shadow-sm p-5 border ${status.bg} ${status.border}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusIcon size={20} className={status.color} />
                <div>
                  <span className={`text-sm font-bold ${status.color}`}>
                    {status.label}
                  </span>
                  {agent.verificationSubmittedAt && (
                    <p className="text-xs text-muted mt-0.5">
                      Submitted{" "}
                      {new Date(agent.verificationSubmittedAt).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </p>
                  )}
                  {agent.verifiedAt && agent.verificationStatus === "approved" && (
                    <p className="text-xs text-muted mt-0.5">
                      Verified{" "}
                      {new Date(agent.verifiedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {agent.rejectionReason &&
                    agent.verificationStatus === "rejected" && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {agent.rejectionReason}
                      </p>
                    )}
                </div>
              </div>

              {/* Approve / Reject actions */}
              {canReview && (
                <div className="flex items-center gap-2">
                  <form action={approveAction}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                  </form>
                  <form
                    action={rejectAction}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="reason"
                      type="text"
                      placeholder="Rejection reason…"
                      className="border border-border rounded-lg bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:border-red-400 transition-colors w-48"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </form>
                </div>
              )}
            </div>
          </section>

          {/* KYC Documents */}
          {agent.kycDocuments.length > 0 && (
            <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
              <h3 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                KYC Documents
              </h3>
              <div className="grid gap-2">
                {agent.kycDocuments.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-panel-alt border border-border rounded-lg px-4 py-3 hover:border-accent/40 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                        {doc.name || doc.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted capitalize">
                        {doc.type.replace(/_/g, " ")}
                        {doc.uploadedAt &&
                          ` · Uploaded ${new Date(doc.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                      </p>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-muted group-hover:text-accent shrink-0"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Agent Listings */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <h3 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
              <Building2 size={16} className="text-accent" />
              Listings
              <span className="text-xs font-normal text-muted">
                ({agent.listings.length})
              </span>
            </h3>
            {agent.listings.length > 0 ? (
              <div className="grid gap-2">
                {agent.listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="flex items-center justify-between gap-3 bg-panel-alt border border-border rounded-lg px-4 py-3 hover:border-accent/40 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground truncate">
                      {listing.title}
                    </span>
                    <ModerationPill status={listing.moderationStatus} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                This seller has no listings yet.
              </p>
            )}
          </section>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="grid gap-5 content-start">
          {/* Agent Card */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
                style={{ background: agent.color || "#64748b" }}
              >
                {agent.name[0]?.toUpperCase() ?? "?"}
              </div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                {agent.name}
                {agent.verified && (
                  <CheckCircle2 size={16} className="text-green-500" />
                )}
              </h2>
              {agent.company && (
                <p className="text-sm text-muted">{agent.company}</p>
              )}
              <div className="flex items-center gap-0.5 mt-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-foreground">
                  {agent.rating.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-4 grid gap-3 text-sm">
              {agent.phone && (
                <div className="flex items-center gap-2.5 text-muted">
                  <Phone size={14} className="shrink-0" />
                  <span>{agent.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-muted">
                <Briefcase size={14} className="shrink-0" />
                <span>{agent.years} years experience</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted">
                <Building2 size={14} className="shrink-0" />
                <span>{agent.listings.length} listings</span>
              </div>
              {agent.areas.length > 0 && (
                <div className="flex items-start gap-2.5 text-muted">
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span>{agent.areas.join(", ")}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-muted">
                <Calendar size={14} className="shrink-0" />
                <span>
                  Joined{" "}
                  {new Date(agent.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </section>

          {/* Verification Timeline */}
          <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
            <h3 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent" />
              Verification Timeline
            </h3>
            <div className="grid gap-3">
              <TimelineItem
                icon={<User size={12} />}
                label="Account created"
                date={agent.createdAt}
                done
              />
              <TimelineItem
                icon={<FileText size={12} />}
                label="Documents submitted"
                date={agent.verificationSubmittedAt}
                done={!!agent.verificationSubmittedAt}
              />
              <TimelineItem
                icon={
                  agent.verificationStatus === "approved" ? (
                    <CheckCircle2 size={12} />
                  ) : agent.verificationStatus === "rejected" ? (
                    <XCircle size={12} />
                  ) : (
                    <Clock size={12} />
                  )
                }
                label={
                  agent.verificationStatus === "approved"
                    ? "Verified"
                    : agent.verificationStatus === "rejected"
                      ? "Rejected"
                      : "Awaiting review"
                }
                date={agent.verifiedAt}
                done={
                  agent.verificationStatus === "approved" ||
                  agent.verificationStatus === "rejected"
                }
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
        </div>
      </div>
    </AdminShell>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  done,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  date: string | null;
  done: boolean;
  variant?: "default" | "success" | "error";
}) {
  const dotColor = !done
    ? "bg-slate-200 text-slate-400"
    : variant === "error"
      ? "bg-red-100 text-red-600"
      : variant === "success"
        ? "bg-green-100 text-green-600"
        : "bg-accent/10 text-accent";

  return (
    <div className="flex items-start gap-2.5">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${dotColor}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${done ? "text-foreground" : "text-muted"}`}
        >
          {label}
        </p>
        {date && (
          <p className="text-xs text-muted">
            {new Date(date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
