import Link from "next/link";
import { AgentShell } from "@/components/agent-shell";
import {
  fetchAgentStats,
  fetchAgentListings,
  fetchAgentInquiries,
  fetchVerificationStatus,
} from "@/lib/api";
import { ShieldCheck, ShieldAlert, Clock, XCircle, ArrowRight } from "lucide-react";

export default async function AgentOverviewPage() {
  const [stats, listingsData, inquiriesData, verification] = await Promise.all([
    fetchAgentStats(),
    fetchAgentListings({ page: 1 }),
    fetchAgentInquiries({ page: 1 }),
    fetchVerificationStatus(),
  ]);

  const vStatus = verification?.verificationStatus ?? "unverified";

  const statCards = [
    {
      label: "Total Listings",
      value: stats?.totalListings ?? 0,
      delta: `${stats?.approvedListings ?? 0} approved`,
      color: "bg-blue-500",
    },
    {
      label: "Approved",
      value: stats?.approvedListings ?? 0,
      delta: "Live on marketplace",
      color: "bg-green-500",
    },
    {
      label: "Pending Review",
      value: stats?.pendingListings ?? 0,
      delta: "Awaiting moderation",
      color: "bg-amber-500",
    },
    {
      label: "Inquiries",
      value: stats?.totalInquiries ?? 0,
      delta: `${stats?.newInquiries ?? 0} new`,
      color: "bg-red-500",
    },
  ];

  const recentListings = listingsData.items.slice(0, 5);
  const recentInquiries = inquiriesData.items.slice(0, 5);

  return (
    <AgentShell
      activeNav="overview"
      eyebrow="Dashboard"
      title="Overview"
      description="Your listings and inquiries at a glance."
      actions={
        <Link
          className="inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
          href="/listings"
        >
          My listings →
        </Link>
      }
    >
      {/* Verification Banner */}
      {vStatus === "unverified" && (
        <Link
          href="/verification"
          className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <ShieldAlert size={22} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-amber-900">
              Complete Your Verification
            </h2>
            <p className="text-xs text-amber-700 mt-0.5">
              Get verified to earn a trust badge, rank higher in search results, and unlock premium features.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full shrink-0 group-hover:bg-amber-200 transition-colors">
            Verify now <ArrowRight size={12} />
          </span>
        </Link>
      )}

      {vStatus === "pending" && (
        <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Clock size={22} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-blue-900">
              Verification Under Review
            </h2>
            <p className="text-xs text-blue-700 mt-0.5">
              Your documents are being reviewed. This usually takes 1–2 business days.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full shrink-0">
            <Clock size={12} /> Pending
          </span>
        </div>
      )}

      {vStatus === "rejected" && (
        <Link
          href="/verification"
          className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <XCircle size={22} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-red-900">
              Verification Rejected
            </h2>
            <p className="text-xs text-red-700 mt-0.5">
              {verification?.rejectionReason ?? "Your documents were not approved. Please resubmit."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full shrink-0 group-hover:bg-red-200 transition-colors">
            Resubmit <ArrowRight size={12} />
          </span>
        </Link>
      )}

      {/* Stats */}
      <section className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {statCards.map((s) => (
          <article
            key={s.label}
            className="relative bg-panel border border-border rounded-xl p-5 shadow-sm overflow-hidden"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-[3px] ${s.color}`}
            />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {s.label}
            </p>
            <strong className="block mt-2 mb-1 text-[28px] font-extrabold tracking-tight">
              {s.value}
            </strong>
            <span className="text-xs text-muted">{s.delta}</span>
          </article>
        ))}
      </section>

      {/* Content grid */}
      <section className="grid grid-cols-[1.2fr_0.8fr] gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {/* Recent Listings */}
        <div className="bg-panel border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-bold">Recent Listings</h2>
            <Link
              className="text-accent text-[13px] font-semibold hover:text-accent-hover transition-colors"
              href="/listings"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-2">
            {recentListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-panel-alt border border-border rounded-lg px-3.5 py-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-[13px] font-bold">{listing.title}</h3>
                  <StatusPill status={listing.moderationStatus} />
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {listing.region} · {listing.type} · {listing.priceFormatted}
                </p>
              </div>
            ))}
            {recentListings.length === 0 && (
              <p className="text-[13px] text-muted">
                No listings yet. Submit your first property on the marketplace.
              </p>
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-panel border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-bold">Recent Inquiries</h2>
            <Link
              className="text-accent text-[13px] font-semibold hover:text-accent-hover transition-colors"
              href="/inquiries"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-2">
            {recentInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="bg-panel-alt border border-border rounded-lg px-3.5 py-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-[13px] font-bold">{inquiry.name}</h3>
                  <StatusPill status={inquiry.status} />
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  Re: {inquiry.propertyTitle}
                </p>
              </div>
            ))}
            {recentInquiries.length === 0 && (
              <p className="text-[13px] text-muted">
                No inquiries received yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </AgentShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    approved: "bg-green-500/10 text-green-600",
    flagged: "bg-red-500/10 text-red-600",
    new: "bg-blue-500/10 text-blue-600",
    read: "bg-amber-500/10 text-amber-600",
    responded: "bg-green-500/10 text-green-600",
    closed: "bg-slate-500/10 text-slate-500",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-bold shrink-0 ${styles[status] ?? "bg-slate-100 text-slate-500"}`}
    >
      {status}
    </span>
  );
}

