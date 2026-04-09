import { AdminShell } from "@/components/admin-shell";
import { fetchAdminUsers } from "@/lib/api";
import {
  Search,
  Mail,
  Phone,
  Heart,
  Calendar,
} from "lucide-react";

type UsersPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminUsersPage({
  searchParams,
}: UsersPageProps) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const usersResponse = await fetchAdminUsers({
    q: query || undefined,
    page,
    limit: 20,
  });

  const users = usersResponse?.items ?? [];
  const total = usersResponse?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <AdminShell
      eyebrow="People"
      title="Users"
      description="Browse registered buyer accounts on the marketplace."
    >
      {/* Search */}
      <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
        <form
          className="flex flex-wrap items-end gap-4"
          action="/users"
          method="get"
        >
          <label className="grid gap-1 text-xs font-semibold text-muted flex-1 min-w-[220px]">
            <span className="flex items-center gap-1">
              <Search size={12} /> Search
            </span>
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Name, email or phone…"
              className="border border-border rounded-lg bg-panel-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </label>
          <button
            type="submit"
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
        <div className="mt-3 text-xs text-muted">
          <strong className="text-foreground">{total}</strong> registered user{total !== 1 ? "s" : ""}
          {query && ` matching "${query}"`}
        </div>
      </section>

      {/* Users Table */}
      {users.length === 0 ? (
        <section className="bg-panel border border-border rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted text-sm">No users found.</p>
        </section>
      ) : (
        <section className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel-alt/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Contact</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Saved</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-panel-alt/30 transition-colors"
                  >
                    {/* Name + Avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: "#3B82F6" }}
                        >
                          {user.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{user.name}</div>
                          <div className="text-xs text-muted truncate max-w-[200px]">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <Mail size={12} /> {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1.5 text-xs text-muted">
                            <Phone size={12} /> {user.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Saved count */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                        <Heart size={12} className={user.savedCount > 0 ? "text-red-500" : ""} />
                        {user.savedCount}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        <Calendar size={12} /> {formatDate(user.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`/users?q=${encodeURIComponent(query)}&page=${page - 1}`}
                    className="px-3 py-1 rounded-md border border-border text-xs font-medium hover:bg-panel-alt transition-colors"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`/users?q=${encodeURIComponent(query)}&page=${page + 1}`}
                    className="px-3 py-1 rounded-md border border-border text-xs font-medium hover:bg-panel-alt transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </AdminShell>
  );
}
