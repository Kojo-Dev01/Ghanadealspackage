import Link from "next/link";
import { AgentShell } from "@/components/agent-shell";
import { fetchAgentInquiries } from "@/lib/api";

type InquiriesPageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function AgentInquiriesPage({
  searchParams,
}: InquiriesPageProps) {
  const params = await searchParams;
  const status = params.status || undefined;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const data = await fetchAgentInquiries({ status, page });
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <AgentShell
      activeNav="inquiries"
      eyebrow="Messages"
      title="Inquiries"
      description="View messages from potential buyers and renters."
      actions={
        <Link
          className="inline-flex items-center gap-1.5 bg-panel border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-panel-alt hover:border-slate-300 transition-colors"
          href="/"
        >
          ← Overview
        </Link>
      }
    >
      {/* Filters */}
      <section className="bg-panel border border-border rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[15px] font-bold">Filter</h2>
          <div className="text-right">
            <strong className="text-xl font-extrabold block">
              {data.total}
            </strong>
            <span className="text-xs text-muted">
              {status ? `${status} inquiries` : "total inquiries"}
            </span>
          </div>
        </div>

        <form
          className="grid grid-cols-[1fr_auto] gap-3 items-end max-sm:grid-cols-1"
          action="/inquiries"
          method="get"
        >
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Status
            <select
              name="status"
              defaultValue={status ?? ""}
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-foreground text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <button
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
            type="submit"
          >
            Apply
          </button>
        </form>
      </section>

      {/* Inquiry cards */}
      <section className="grid gap-3">
        {data.items.map((inquiry) => (
          <article
            key={inquiry.id}
            className="bg-panel border border-border rounded-xl p-5 shadow-sm grid gap-2.5"
          >
            <div className="flex justify-between items-start gap-4 max-sm:flex-col">
              <div>
                <h2 className="text-[15px] font-bold">{inquiry.name}</h2>
                <p className="text-xs text-muted">
                  {inquiry.email} · {inquiry.phone}
                </p>
              </div>
              <StatusPill status={inquiry.status} />
            </div>
            <p className="text-sm font-semibold">
              Re: {inquiry.propertyTitle}
            </p>
            <p className="text-sm text-muted leading-relaxed">
              {inquiry.message}
            </p>
            <p className="text-xs text-muted">Received {inquiry.createdAt}</p>
          </article>
        ))}

        {data.items.length === 0 && (
          <div className="bg-panel border border-border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-muted">
              No inquiries match the current filter.
            </p>
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="bg-panel border border-border rounded-xl p-5 shadow-sm flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold">
            Page {data.page} of {totalPages}
          </h2>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                className="inline-flex items-center gap-1.5 bg-panel border border-border px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-panel-alt transition-colors"
                href={`/inquiries?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page - 1) })}`}
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                className="inline-flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
                href={`/inquiries?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page + 1) })}`}
              >
                Next →
              </Link>
            )}
          </div>
        </section>
      )}
    </AgentShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
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
