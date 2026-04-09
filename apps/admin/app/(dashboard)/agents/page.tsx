import { AdminShell } from "@/components/admin-shell";
import { fetchAdminAgents } from "@/lib/api";
import type { VerificationStatus } from "@/lib/api";
import { Search, MapPin, ShieldCheck } from "lucide-react";
import { SellerCard } from "@/components/seller-card";

const STATUS_LABELS: Record<VerificationStatus, string> = {
  unverified: "Unverified",
  pending: "Pending Review",
  approved: "Verified",
  rejected: "Rejected",
};

type AgentsPageProps = {
  searchParams: Promise<{
    q?: string;
    area?: string;
    verification?: string;
    success?: string;
    error?: string;
  }>;
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

  return (
    <AdminShell
      eyebrow="People"
      title="Sellers"
      description="Manage registered sellers and review verification requests."
    >
      {/* Flash messages */}
      {params.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm font-medium text-green-700">
          {params.success === "approved"
            ? "Seller verified successfully."
            : params.success === "rejected"
              ? "Seller verification rejected."
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
          <strong className="text-foreground">{total}</strong> registered sellers
          {query && ` matching "${query}"`}
          {area && ` in ${area}`}
          {verificationFilter && ` — ${STATUS_LABELS[verificationFilter as VerificationStatus] ?? verificationFilter}`}
        </div>
      </section>

      {/* Sellers Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <SellerCard key={agent.id} agent={agent} />
        ))}

        {agents.length === 0 && (
          <div className="col-span-full bg-panel border border-border rounded-xl p-10 text-center">
            <p className="text-sm text-muted">
              No sellers found matching the current filters.
            </p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
