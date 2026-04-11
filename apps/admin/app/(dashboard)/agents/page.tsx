import { AdminShell } from "@/components/admin-shell";
import { fetchAdminAgents } from "@/lib/api";
import type { VerificationStatus } from "@/lib/api";
import Link from "next/link";
import { Search } from "lucide-react";
import { SellerCard } from "@/components/seller-card";
import { Pagination } from "@/components/pagination";

const VERIFICATION_FILTERS: { value: VerificationStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending Review" },
  { value: "unverified", label: "Unverified" },
  { value: "approved", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

type AgentsPageProps = {
  searchParams: Promise<{
    q?: string;
    area?: string;
    verification?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
};

function buildHref(overrides: { verification?: string; q?: string; area?: string; page?: number }, current: { verification: string; q: string; area: string }) {
  const sp = new URLSearchParams();
  const v = overrides.verification !== undefined ? overrides.verification : current.verification;
  if (v) sp.set("verification", v);
  const q = overrides.q !== undefined ? overrides.q : current.q;
  if (q) sp.set("q", q);
  const a = overrides.area !== undefined ? overrides.area : current.area;
  if (a) sp.set("area", a);
  const p = overrides.page ?? 1;
  if (p > 1) sp.set("page", String(p));
  const qs = sp.toString();
  return `/agents${qs ? `?${qs}` : ""}`;
}

export default async function AdminAgentsPage({
  searchParams,
}: AgentsPageProps) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const area = String(params.area ?? "").trim();
  const verificationFilter = (params.verification ?? "") as
    | VerificationStatus
    | "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const limit = 12;

  const agentsResponse = await fetchAdminAgents({
    q: query || undefined,
    area: area || undefined,
    verification: verificationFilter || undefined,
    page,
    limit,
  });

  const agents = agentsResponse?.items ?? [];
  const total = agentsResponse?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const current = { verification: verificationFilter, q: query, area };

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

      {/* Verification filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {VERIFICATION_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={buildHref({ verification: f.value }, current)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            style={
              verificationFilter === f.value
                ? { background: "var(--color-accent, #dc2626)", color: "#fff", borderColor: "var(--color-accent, #dc2626)" }
                : { background: "var(--color-panel, #fff)", color: "var(--color-muted, #64748b)", borderColor: "var(--color-border, #e2e8f0)" }
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Search + Area */}
      <form
        className="flex flex-wrap items-end gap-3"
        action="/agents"
        method="get"
      >
        {verificationFilter && <input type="hidden" name="verification" value={verificationFilter} />}
        <label className="grid gap-1 text-xs font-semibold text-muted flex-1 min-w-[180px] max-w-xs">
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Search size={12} /> Search
          </span>
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Name or company…"
            className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
            style={{ boxShadow: "none" }}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted min-w-[140px] max-w-[200px]">
          <span>Area</span>
          <input
            name="area"
            type="text"
            defaultValue={area}
            placeholder="e.g. Accra"
            className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
            style={{ boxShadow: "none" }}
          />
        </label>
        <button
          type="submit"
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Count */}
      <p className="text-sm text-muted">
        <strong className="text-foreground">{total}</strong>{" "}
        {verificationFilter
          ? VERIFICATION_FILTERS.find((f) => f.value === verificationFilter)?.label?.toLowerCase() ?? ""
          : "registered"}{" "}
        seller{total !== 1 ? "s" : ""}
        {query && <> matching &ldquo;{query}&rdquo;</>}
        {area && <> in {area}</>}
      </p>

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

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        buildHref={(p) => buildHref({ page: p }, current)}
        noun="sellers"
      />
    </AdminShell>
  );
}
