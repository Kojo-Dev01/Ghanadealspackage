import Link from "next/link";
import Image from "next/image";
import { AdminShell } from "@/components/admin-shell";
import { fetchAdminConversations } from "@/lib/api";
import {
  Search,
  MessagesSquare,
  MessageCircle,
  Users,
  Clock,
  Home,
} from "lucide-react";

type ChatsPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getPreview(msg: { content: string; message_type: string } | null): string {
  if (!msg) return "No messages yet";
  if (msg.message_type === "image") return "📷 Photo";
  if (msg.message_type === "property_ref") return "🏠 Property shared";
  return msg.content.length > 55 ? msg.content.slice(0, 55) + "…" : msg.content;
}

function getInitial(name: string | undefined) {
  return (name ?? "?")[0].toUpperCase();
}

export default async function AdminChatsPage({ searchParams }: ChatsPageProps) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const response = await fetchAdminConversations({ q: query || undefined, page, limit: 20 });
  const conversations = response?.items ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  // Simple stats
  const totalMessages = conversations.reduce((sum, c) => sum + (c.messageCount ?? 0), 0);
  const uniqueParticipants = new Set(
    conversations.flatMap((c) => [c.buyer?.user_id, c.seller?.user_id].filter(Boolean))
  ).size;

  return (
    <AdminShell
      eyebrow="Communication"
      title="Chats"
      description="Monitor conversations between buyers and sellers."
    >
      {/* Stats */}
      <section className="flex flex-wrap gap-4">
        {([
          { label: "Conversations", value: total, icon: MessagesSquare, color: "text-blue-500" },
          { label: "Messages", value: totalMessages, icon: MessageCircle, color: "text-violet-500" },
          { label: "Participants", value: uniqueParticipants, icon: Users, color: "text-sky-500" },
        ] as const).map((s) => (
          <article
            key={s.label}
            className="flex-1 min-w-[140px] bg-panel border border-border rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{s.label}</span>
              <s.icon size={15} className={s.color} />
            </div>
            <strong className="block text-2xl font-extrabold tracking-tight">{s.value}</strong>
          </article>
        ))}
      </section>

      {/* Search */}
      <section className="bg-panel border border-border rounded-xl shadow-sm p-5">
        <form className="flex flex-wrap items-end gap-4" action="/chats" method="get">
          <label className="grid gap-1 text-xs font-semibold text-muted flex-1 min-w-[220px]">
            <span className="flex items-center gap-1">
              <Search size={12} /> Search
            </span>
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Name, email, or property…"
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
          <strong className="text-foreground">{total}</strong> conversation{total !== 1 ? "s" : ""}
          {query && <> matching &ldquo;{query}&rdquo;</>}
        </div>
      </section>

      {/* Conversations Table */}
      {conversations.length === 0 ? (
        <section className="bg-panel border border-border rounded-xl shadow-sm p-12 text-center">
          {query ? (
            <p className="text-sm text-muted">No conversations matching &ldquo;{query}&rdquo;</p>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <MessagesSquare size={24} className="text-accent" />
              </div>
              <h3 className="text-base font-semibold mb-1">No conversations yet</h3>
              <p className="text-sm text-muted max-w-xs mx-auto">
                Conversations between buyers and sellers will appear here.
              </p>
            </>
          )}
        </section>
      ) : (
        <section className="bg-panel border border-border rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel-alt/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Participants</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Property</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Last Message</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Messages</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Activity</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((convo) => {
                  const buyerInitial = getInitial(convo.buyer?.name);
                  const sellerInitial = getInitial(convo.seller?.name);
                  return (
                    <tr
                      key={convo.id}
                      className="border-b border-border last:border-0 hover:bg-panel-alt/30 transition-colors"
                    >
                      {/* Participants */}
                      <td className="px-4 py-3">
                        <Link href={`/chats/${convo.id}`} className="flex items-center gap-3 no-underline">
                          {/* Stacked avatars */}
                          <div className="relative flex-shrink-0 w-10 h-10">
                            {convo.buyer?.avatar_url ? (
                              <Image
                                src={convo.buyer.avatar_url}
                                alt=""
                                width={28}
                                height={28}
                                unoptimized
                                className="w-7 h-7 rounded-full object-cover absolute top-0 left-0 border-2 border-panel"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-bold absolute top-0 left-0 border-2 border-panel">
                                {buyerInitial}
                              </div>
                            )}
                            {convo.seller?.avatar_url ? (
                              <Image
                                src={convo.seller.avatar_url}
                                alt=""
                                width={28}
                                height={28}
                                unoptimized
                                className="w-7 h-7 rounded-full object-cover absolute bottom-0 right-0 border-2 border-panel"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-[10px] font-bold absolute bottom-0 right-0 border-2 border-panel">
                                {sellerInitial}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate max-w-[200px]">
                              {convo.buyer?.name ?? "Unknown"}
                            </div>
                            <div className="text-xs text-muted truncate max-w-[200px]">
                              ↔ {convo.seller?.name ?? "Unknown"}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Property */}
                      <td className="px-4 py-3">
                        {convo.property ? (
                          <div className="flex items-center gap-2.5">
                            {convo.property.image ? (
                              <Image
                                src={convo.property.image}
                                alt=""
                                width={40}
                                height={40}
                                unoptimized
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-panel-alt flex items-center justify-center flex-shrink-0">
                                <Home size={14} className="text-muted" />
                              </div>
                            )}
                            <span className="text-xs text-accent font-medium truncate max-w-[180px]">
                              {convo.property.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>

                      {/* Last Message */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-muted truncate max-w-[200px]">
                          {getPreview(convo.lastMessage)}
                        </p>
                      </td>

                      {/* Message Count */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-[22px] rounded-full bg-panel-alt text-[11px] font-bold text-muted px-2">
                          {convo.messageCount}
                        </span>
                      </td>

                      {/* Activity */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="flex items-center gap-1 text-xs text-muted whitespace-nowrap">
                            <Clock size={12} />
                            {formatTime(convo.lastMessageAt)}
                          </span>
                          <Link
                            href={`/chats/${convo.id}`}
                            className="text-accent text-xs font-semibold hover:underline no-underline"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                    href={`/chats?q=${encodeURIComponent(query)}&page=${page - 1}`}
                    className="px-3 py-1 rounded-md border border-border text-xs font-medium hover:bg-panel-alt transition-colors"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`/chats?q=${encodeURIComponent(query)}&page=${page + 1}`}
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