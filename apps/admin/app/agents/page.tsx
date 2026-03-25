import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { fetchAdminAgents, verifyAgent } from "@/lib/api";
import type { VerificationStatus } from "@/lib/api";
import {
  Search,
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
  Eye,
} from "lucide-react";

type AgentsPageProps = {
  searchParams: Promise<{
    q?: string;
    area?: string;
    verification?: string;
    success?: string;
    error?: string;
  }>;
};

const STATUS_INFO: Record<
  VerificationStatus,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  unverified: {
    label: "Unverified",
    color: "text-slate-500",
    bg: "bg-slate-100",
    icon: ShieldAlert,
  },
  pending: {
    label: "Pending Review",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: Clock,
  },
  approved: {
    label: "Verified",
    color: "text-green-600",
    bg: "bg-green-50",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-600",
    bg: "bg-red-50",
    icon: XCircle,
  },
};

export default async function AdminAgentsPage({
  searchParams,
}: AgentsPageProps) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const area = String(params.area ?? "").trim();
  const verificationFilter = (params.verification ?? "") as
    | VerificationStatus
    | "";

  const agentsResponse = await fetchAdminAgents({
    q: query || undefined,
    area: area || undefined,
    verification: verificationFilter || undefined,
  });

  const agents = agentsResponse?.items ?? [];
  const total = agentsResponse?.total ?? 0;

  async function approveAction(formData: FormData) {
    "use server";
    const cookieStore = await cookies();
    const token = cookieStore.get("gd_admin_session")?.value;
    if (!token) redirect("/login");
    const agentId = String(formData.get("agentId") ?? "");
    if (!agentId) redirect("/agents?error=missing");
    const ok = await verifyAgent(agentId, "approve");
    redirect(ok ? "/agents?success=approved" : "/agents?error=1");
  }

  async function rejectAction(formData: FormData) {
    "use server";
    const cookieStore = await cookies();
    const token = cookieStore.get("gd_admin_session")?.value;
    if (!token) redirect("/login");
    const agentId = String(formData.get("agentId") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();
    if (!agentId) redirect("/agents?error=missing");
    const ok = await verifyAgent(agentId, "reject", reason || undefined);
    redirect(ok ? "/agents?success=rejected" : "/agents?error=1");
  }

  return (
    <AdminShell
      activeNav="agents"
      eyebrow="People"
      title="Agents"
      description="Manage registered agents and review verification requests."
    >
      {/* Flash messages */}
      {params.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm font-medium text-green-700">
          {params.success === "approved"
            ? "Agent verified successfully."
            : params.success === "rejected"
              ? "Agent verification rejected."
              : "Action completed."}
        </div>
      )}
      {params.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm font-medium text-red-700">
          Something went wrong. Please try again.
        </div>
      )}

      {/* Filters */}
      <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
        <form
          className="flex flex-wrap items-end gap-4"
          action="/agents"
          method="get"
        >
          <label className="grid gap-1 text-xs font-semibold text-muted flex-1 min-w-[180px]">
            <span className="flex items-center gap-1">
              <Search size={12} /> Search
            </span>
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Name or company…"
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted min-w-[140px]">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> Area
            </span>
            <input
              name="area"
              type="text"
              defaultValue={area}
              placeholder="e.g. Accra"
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted min-w-[140px]">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} /> Verification
            </span>
            <select
              name="verification"
              defaultValue={verificationFilter}
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            >
              <option value="">All</option>
              <option value="pending">Pending Review</option>
              <option value="unverified">Unverified</option>
              <option value="approved">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <button
            type="submit"
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Apply
          </button>
        </form>
        <div className="mt-3 text-xs text-muted">
          <strong className="text-foreground">{total}</strong> registered agents
          {query && ` matching "${query}"`}
          {area && ` in ${area}`}
          {verificationFilter && ` — ${STATUS_INFO[verificationFilter as VerificationStatus]?.label ?? verificationFilter}`}
        </div>
      </section>

      {/* Agents Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const status = STATUS_INFO[agent.verificationStatus] ?? STATUS_INFO.unverified;
          const StatusIcon = status.icon;
          const canReview = agent.verificationStatus === "pending";

          return (
            <article
              key={agent.id}
              className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Link
                  href={`/agents/${agent.id}`}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0 hover:ring-2 hover:ring-accent/40 transition-all"
                  style={{ background: agent.color || "#64748b" }}
                >
                  {agent.name[0]?.toUpperCase() ?? "?"}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="text-sm font-bold text-foreground truncate hover:text-accent transition-colors"
                    >
                      {agent.name}
                    </Link>
                    {agent.verified && (
                      <CheckCircle2
                        size={14}
                        className="text-green-500 shrink-0"
                      />
                    )}
                  </div>
                  {agent.company && (
                    <p className="text-xs text-muted truncate">
                      {agent.company}
                    </p>
                  )}
                </div>
                <Link
                  href={`/agents/${agent.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-muted hover:text-accent transition-colors shrink-0"
                >
                  <Eye size={13} />
                  View
                </Link>
              </div>

              {/* Info */}
              <div className="p-4 grid grid-cols-2 gap-2 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Building2 size={12} /> {agent.listings} listings
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {agent.years} yrs experience
                </span>
                {agent.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {agent.phone}
                  </span>
                )}
                {agent.areas.length > 0 && (
                  <span className="flex items-center gap-1 col-span-2">
                    <MapPin size={12} /> {agent.areas.join(", ")}
                  </span>
                )}
              </div>

              {/* Verification Status + Actions */}
              <div className="mt-auto border-t border-border p-4 grid gap-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${status.bg} ${status.color}`}
                  >
                    <StatusIcon size={12} />
                    {status.label}
                  </span>
                  {agent.verificationSubmittedAt && (
                    <span className="text-[11px] text-muted">
                      {new Date(agent.verificationSubmittedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>

                {/* KYC Document Links (pending only) */}
                {canReview && agent.kycDocuments.length > 0 && (
                  <div className="grid gap-1">
                    {agent.kycDocuments.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-accent hover:underline truncate"
                      >
                        <FileText size={12} />
                        {doc.name || doc.type.replace(/_/g, " ")}
                        <ExternalLink size={10} className="shrink-0" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Approve / Reject actions */}
                {canReview && (
                  <div className="flex gap-2">
                    <form action={approveAction} className="flex-1">
                      <input type="hidden" name="agentId" value={agent.id} />
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectAction} className="flex-1 grid gap-1.5">
                      <input type="hidden" name="agentId" value={agent.id} />
                      <input
                        name="reason"
                        type="text"
                        placeholder="Reason (optional)…"
                        className="border border-border rounded-lg bg-panel-alt px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-red-400 transition-colors"
                      />
                      <button
                        type="submit"
                        className="w-full bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                )}

                {/* Rejection reason (when rejected) */}
                {agent.verificationStatus === "rejected" && agent.rejectionReason && (
                  <p className="text-[11px] text-red-600 bg-red-50 rounded px-2 py-1">
                    Rejected: {agent.rejectionReason}
                  </p>
                )}
              </div>
            </article>
          );
        })}

        {agents.length === 0 && (
          <div className="col-span-full bg-panel border border-border rounded-xl p-10 text-center">
            <p className="text-sm text-muted">
              No agents found matching the current filters.
            </p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
