import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { fetchAdminStats, fetchAdminListings } from "@/lib/api";
import {
  Building2,
  Users,
  MessageSquare,
  Clock,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

function StatCard({
  label,
  value,
  delta,
  icon,
  color,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <article className="bg-panel border border-border rounded-xl p-5 shadow-sm flex items-start gap-4">
      <div
        className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        <p className="text-xs text-text-secondary mt-0.5">{delta}</p>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    flagged: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${colors[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

export default async function AdminOverviewPage() {
  const [statsResponse, listingsResponse] = await Promise.all([
    fetchAdminStats(),
    fetchAdminListings({ status: "pending", limit: 5 }),
  ]);

  const totals = statsResponse?.totals ?? {
    listings: 0,
    pending: 0,
    approved: 0,
    flagged: 0,
    agents: 0,
    verifiedAgents: 0,
    inquiries: 0,
    buyers: 0,
    newBuyersThisWeek: 0,
  };

  const activity = statsResponse?.recentActivity ?? [];
  const moderationQueue = listingsResponse?.items ?? [];

  return (
    <AdminShell
      activeNav="overview"
      eyebrow="Dashboard"
      title="Overview"
      description="Marketplace health at a glance."
      actions={
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
          href="/listings"
        >
          Review listings <ArrowRight size={14} />
        </Link>
      }
    >
      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Active Listings"
          value={String(totals.listings)}
          delta={`${totals.approved} approved`}
          icon={<Building2 size={20} className="text-white" />}
          color="#2563eb"
        />
        <StatCard
          label="Agents"
          value={String(totals.agents)}
          delta={`${totals.verifiedAgents ?? 0} verified`}
          icon={<ShieldCheck size={20} className="text-white" />}
          color="#16a34a"
        />
        <StatCard
          label="Buyers"
          value={String(totals.buyers ?? 0)}
          delta={`${totals.newBuyersThisWeek ?? 0} new this week`}
          icon={<UserPlus size={20} className="text-white" />}
          color="#0891b2"
        />
        <StatCard
          label="Total Users"
          value={String((totals.buyers ?? 0) + totals.agents)}
          delta="Buyers + agents"
          icon={<Users size={20} className="text-white" />}
          color="#6d28d9"
        />
        <StatCard
          label="Inquiries"
          value={String(totals.inquiries)}
          delta="Buyer pipeline"
          icon={<MessageSquare size={20} className="text-white" />}
          color="#7c3aed"
        />
        <StatCard
          label="Pending Review"
          value={String(totals.pending)}
          delta={
            totals.flagged > 0 ? `${totals.flagged} flagged` : "None flagged"
          }
          icon={<Clock size={20} className="text-white" />}
          color="#d97706"
        />
      </section>

      {/* Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Moderation Queue */}
        <article className="lg:col-span-3 bg-panel border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">
              Moderation Queue
            </h2>
            <Link
              href="/listings?status=pending"
              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {moderationQueue.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {listing.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {listing.region} · {listing.type} ·{" "}
                    {listing.priceFormatted}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={listing.moderationStatus} />
                  <span className="text-[11px] text-muted hidden sm:inline">
                    {listing.submittedAt}
                  </span>
                </div>
              </div>
            ))}
            {moderationQueue.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted text-center">
                No pending listings right now.
              </p>
            )}
          </div>
        </article>

        {/* Recent Activity */}
        <article className="lg:col-span-2 bg-panel border border-border rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-border">
            {activity.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted text-center">
                No recent activity.
              </p>
            )}
            {activity.map((entry, i) => (
              <div key={i} className="flex gap-3 px-5 py-3">
                <span className="shrink-0 text-[11px] font-mono text-muted w-14">
                  {entry.time}
                </span>
                <p className="text-sm text-foreground">{entry.item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
