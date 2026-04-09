import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  fetchAdminInquiries,
  updateInquiryStatus,
  type InquiryStatus,
} from "@/lib/api";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Home,
} from "lucide-react";

type InquiriesPageProps = {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
};

const statusOptions: InquiryStatus[] = ["new", "read", "responded", "closed"];

function normalizeStatus(value?: string): InquiryStatus | undefined {
  if (!value) return undefined;
  return statusOptions.includes(value as InquiryStatus)
    ? (value as InquiryStatus)
    : undefined;
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    read: "bg-slate-100 text-slate-600",
    responded: "bg-green-100 text-green-700",
    closed: "bg-zinc-200 text-zinc-500",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${colors[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

export default async function AdminInquiriesPage({
  searchParams,
}: InquiriesPageProps) {
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const query = String(params.q ?? "").trim();
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const inquiriesResponse = await fetchAdminInquiries({
    status,
    q: query || undefined,
    page,
    limit: 12,
  });

  async function updateStatusAction(formData: FormData) {
    "use server";

    const inquiryId = String(formData.get("inquiryId") ?? "").trim();
    const nextStatus = normalizeStatus(
      String(formData.get("nextStatus") ?? "")
    );
    const currentStatus = normalizeStatus(
      String(formData.get("currentStatus") ?? "")
    );
    const currentQuery = String(formData.get("currentQuery") ?? "").trim();
    const currentPage = Math.max(
      1,
      Number(formData.get("currentPage") ?? "1") || 1
    );

    if (inquiryId && nextStatus) {
      await updateInquiryStatus(inquiryId, nextStatus);
    }

    revalidatePath("/");
    revalidatePath("/inquiries");

    const sp = new URLSearchParams();
    if (currentStatus) sp.set("status", currentStatus);
    if (currentQuery) sp.set("q", currentQuery);
    if (currentPage > 1) sp.set("page", String(currentPage));
    const dest = sp.toString();
    redirect(dest ? `/inquiries?${dest}` : "/inquiries");
  }

  const inquiries = inquiriesResponse ?? {
    items: [],
    total: 0,
    limit: 12,
    page: 1,
  };
  const totalPages = Math.max(1, Math.ceil(inquiries.total / inquiries.limit));

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (query) sp.set("q", query);
    if (p > 1) sp.set("page", String(p));
    const str = sp.toString();
    return str ? `/inquiries?${str}` : "/inquiries";
  }

  return (
    <AdminShell
      eyebrow="Customer"
      title="Inquiries"
      description="View and manage property inquiries from potential buyers and renters."
    >
      {/* Filters */}
      <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
        <form
          className="flex flex-wrap items-end gap-4"
          action="/inquiries"
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
              placeholder="Name or email…"
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted min-w-[140px]">
            <span className="flex items-center gap-1">
              <SlidersHorizontal size={12} /> Status
            </span>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
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
          <strong className="text-foreground">{inquiries.total}</strong>{" "}
          {status ? `${status} inquiries` : "total inquiries"}
        </div>
      </section>

      {/* Inquiries Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {inquiries.items.map((inquiry) => (
          <article
            key={inquiry.id}
            className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {inquiry.name}
                </h3>
                <StatusPill status={inquiry.status} />
              </div>
              <p className="text-xs text-accent font-medium flex items-center gap-1 truncate">
                <Home size={11} /> {inquiry.property.title}
              </p>
            </div>

            <div className="p-4 flex flex-col gap-2 flex-1">
              <div className="grid grid-cols-1 gap-1 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Mail size={12} /> {inquiry.email}
                </span>
                {inquiry.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {inquiry.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={12} />{" "}
                  {new Date(inquiry.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mt-1 line-clamp-3">
                {inquiry.message}
              </p>
            </div>

            <div className="border-t border-border p-3 flex gap-1.5">
              <form className="flex gap-1.5 w-full" action={updateStatusAction}>
                <input type="hidden" name="inquiryId" value={inquiry.id} />
                <input
                  type="hidden"
                  name="currentStatus"
                  value={status ?? ""}
                />
                <input type="hidden" name="currentQuery" value={query} />
                <input
                  type="hidden"
                  name="currentPage"
                  value={String(page)}
                />
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    name="nextStatus"
                    type="submit"
                    value={option}
                    disabled={option === inquiry.status}
                    className={`flex-1 px-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                      option === inquiry.status
                        ? "bg-slate-100 text-slate-400 cursor-default"
                        : option === "new"
                          ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          : option === "responded"
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : option === "closed"
                              ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </form>
            </div>
          </article>
        ))}

        {inquiries.items.length === 0 && (
          <div className="col-span-full bg-panel border border-border rounded-xl p-10 text-center">
            <p className="text-sm text-muted">
              No inquiries match the current filters.
            </p>
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="bg-panel border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <p className="text-sm text-muted">
            Page <strong className="text-foreground">{inquiries.page}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-panel-alt transition-colors"
              >
                <ChevronLeft size={14} /> Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-panel-alt transition-colors"
              >
                Next <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </section>
      )}
    </AdminShell>
  );
}
