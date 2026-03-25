import { AdminShell } from "@/components/admin-shell";
import { fetchAdminMetrics } from "@/lib/api";
import {
  TrendAreaChart,
  HorizontalBarChart,
  DonutChart,
  StatusDonutChart,
} from "@/components/charts";
import {
  Building2,
  Users,
  UserPlus,
  MessageSquare,
  TrendingUp,
  MapPin,
  Home,
} from "lucide-react";

function MetricCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-panel border border-border rounded-xl p-5 shadow-sm flex items-start gap-4">
      <div
        className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && (
          <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

export default async function MetricsPage() {
  const metrics = await fetchAdminMetrics();

  if (!metrics) {
    return (
      <AdminShell
        activeNav="metrics"
        eyebrow="Analytics"
        title="Metrics"
        description="Marketplace analytics and insights."
      >
        <p className="text-muted text-sm py-12 text-center">
          Unable to load metrics. Check your connection and try again.
        </p>
      </AdminShell>
    );
  }

  const { listings, agents, buyers, inquiries } = metrics;
  const totalUsers = buyers.total + agents.total;

  return (
    <AdminShell
      activeNav="metrics"
      eyebrow="Analytics"
      title="Metrics"
      description="Marketplace analytics and insights."
    >
      {/* Top-level KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Users"
          value={totalUsers}
          sub={`${buyers.total} buyers · ${agents.total} agents`}
          icon={<Users size={20} className="text-white" />}
          color="#6d28d9"
        />
        <MetricCard
          label="New Users (7d)"
          value={buyers.newThisWeek + agents.newThisWeek}
          sub={`${buyers.newThisWeek} buyers · ${agents.newThisWeek} agents`}
          icon={<UserPlus size={20} className="text-white" />}
          color="#0891b2"
        />
        <MetricCard
          label="Active Listings"
          value={listings.approved}
          sub={`${listings.newThisWeek} new this week`}
          icon={<Building2 size={20} className="text-white" />}
          color="#2563eb"
        />
        <MetricCard
          label="Inquiry Response Rate"
          value={`${inquiries.responseRate}%`}
          sub={`${inquiries.responded} of ${inquiries.total} responded`}
          icon={<MessageSquare size={20} className="text-white" />}
          color="#16a34a"
        />
      </section>

      {/* 30-Day Trend Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <article className="bg-panel border border-border rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <h2 className="text-sm font-bold text-foreground">Listings (30d)</h2>
          </div>
          <div className="p-4">
            <TrendAreaChart data={listings.trend} color="#2563eb" label="Listings" />
          </div>
        </article>

        <article className="bg-panel border border-border rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <h2 className="text-sm font-bold text-foreground">New Buyers (30d)</h2>
          </div>
          <div className="p-4">
            <TrendAreaChart data={buyers.trend} color="#6d28d9" label="Buyers" />
          </div>
        </article>

        <article className="bg-panel border border-border rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <h2 className="text-sm font-bold text-foreground">Inquiries (30d)</h2>
          </div>
          <div className="p-4">
            <TrendAreaChart data={inquiries.trend} color="#16a34a" label="Inquiries" />
          </div>
        </article>
      </section>

      {/* Detail sections */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Listing Status Donut */}
        <article className="bg-panel border border-border rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            <h2 className="text-sm font-bold text-foreground">Listing Status</h2>
          </div>
          <div className="p-5 flex flex-col items-center">
            <StatusDonutChart
              approved={listings.approved}
              pending={listings.pending}
              flagged={listings.flagged}
            />
            <div className="grid grid-cols-2 gap-4 text-sm mt-2 w-full">
              <div className="text-center">
                <span className="text-muted">This week:</span>{" "}
                <span className="font-bold text-foreground">{listings.newThisWeek}</span>
              </div>
              <div className="text-center">
                <span className="text-muted">This month:</span>{" "}
                <span className="font-bold text-foreground">{listings.newThisMonth}</span>
              </div>
            </div>
          </div>
        </article>

        {/* Users breakdown */}
        <article className="bg-panel border border-border rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Users size={16} className="text-accent" />
            <h2 className="text-sm font-bold text-foreground">Users Overview</h2>
          </div>
          <div className="p-5 flex flex-col items-center">
            <DonutChart
              data={[
                { name: "Buyers", count: buyers.total },
                { name: "Agents", count: agents.total },
              ]}
            />
            <div className="grid grid-cols-2 gap-4 text-sm mt-2 w-full">
              <div className="text-center">
                <span className="text-muted">Verified agents:</span>{" "}
                <span className="font-bold text-foreground">{agents.verified}</span>
              </div>
              <div className="text-center">
                <span className="text-muted">Verification rate:</span>{" "}
                <span className="font-bold text-foreground">
                  {agents.total > 0 ? Math.round((agents.verified / agents.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Listings by Type */}
        <article className="bg-panel border border-border rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Home size={16} className="text-accent" />
            <h2 className="text-sm font-bold text-foreground">Listings by Property Type</h2>
          </div>
          <div className="p-5">
            {listings.byType.length > 0 ? (
              <HorizontalBarChart data={listings.byType} color="#2563eb" />
            ) : (
              <p className="text-sm text-muted text-center py-4">No data yet</p>
            )}
          </div>
        </article>

        {/* Listings by Region */}
        <article className="bg-panel border border-border rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <MapPin size={16} className="text-accent" />
            <h2 className="text-sm font-bold text-foreground">Listings by Region</h2>
          </div>
          <div className="p-5">
            {listings.byRegion.length > 0 ? (
              <HorizontalBarChart data={listings.byRegion} color="#16a34a" />
            ) : (
              <p className="text-sm text-muted text-center py-4">No data yet</p>
            )}
          </div>
        </article>

        {/* Inquiry Performance */}
        <article className="bg-panel border border-border rounded-xl shadow-sm lg:col-span-2">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <MessageSquare size={16} className="text-accent" />
            <h2 className="text-sm font-bold text-foreground">Inquiry Performance</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-start gap-8">
              <div className="w-48 shrink-0">
                <StatusDonutChart
                  approved={inquiries.responded}
                  pending={inquiries.total - inquiries.responded}
                  flagged={0}
                />
              </div>
              <div className="space-y-2 text-sm flex-1 pt-4">
                <div className="flex gap-8">
                  <div>
                    <span className="text-muted">Total inquiries:</span>{" "}
                    <span className="font-bold text-foreground">{inquiries.total}</span>
                  </div>
                  <div>
                    <span className="text-muted">New this week:</span>{" "}
                    <span className="font-bold text-foreground">{inquiries.newThisWeek}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted">Responded:</span>{" "}
                  <span className="font-bold text-green-600">{inquiries.responded}</span>
                </div>
                <div>
                  <span className="text-muted">Response rate:</span>{" "}
                  <span className="font-bold text-foreground">{inquiries.responseRate}%</span>
                </div>
              </div>
            </div>

            {inquiries.recent.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                  Recent Inquiries
                </h3>
                <div className="divide-y divide-border">
                  {inquiries.recent.map((inq) => (
                    <div key={inq.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {inq.name}
                        </p>
                        <p className="text-xs text-muted">{inq.email}</p>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                          inq.status === "responded"
                            ? "bg-green-100 text-green-700"
                            : inq.status === "new"
                              ? "bg-blue-100 text-blue-700"
                              : inq.status === "read"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
