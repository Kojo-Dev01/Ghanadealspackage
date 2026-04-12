"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MessageSquare, Filter } from "lucide-react";
import type { ConversationListItem } from "@/lib/api";
import { apiFetch } from "@/lib/client-api";

type FilterTab = "all" | "unread";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getInitial(name: string | undefined) {
  return (name ?? "?")[0].toUpperCase();
}

function getPreview(convo: ConversationListItem, userId: string | null): string {
  if (!convo.lastMessage) return "No messages yet";
  const isMe = convo.lastMessage.sender_id === userId;
  const prefix = isMe ? "You: " : "";
  if (convo.lastMessage.message_type === "image") return `${prefix}📷 Photo`;
  if (convo.lastMessage.message_type === "property_ref") return `${prefix}🏠 Property`;
  return `${prefix}${convo.lastMessage.content}`;
}

export default function SellerMessagesPage() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then(async (res) => { if (res.ok) { const d = await res.json(); setUserId(d.id); } })
      .catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    const res = await apiFetch("/v1/conversations");
    if (res?.ok) {
      setConversations(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const unreadCount = useMemo(() => conversations.filter((c) => c.unreadCount > 0).length, [conversations]);

  const filtered = useMemo(() => {
    let list = conversations;
    if (filter === "unread") list = list.filter((c) => c.unreadCount > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.otherUser?.name?.toLowerCase().includes(q) ||
        c.property?.title?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, filter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Messages</h1>
          <p className="text-sm text-muted mt-0.5">
            {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
          </p>
        </div>
      </div>

      {/* Search & Filters — always visible when conversations exist */}
      {conversations.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or property…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-panel text-foreground text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all placeholder:text-muted"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(["all", "unread"] as const).map((tab) => {
              const active = filter === tab;
              const label = tab === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? "bg-accent text-white"
                      : "bg-panel-alt text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="bg-panel border border-border rounded-xl p-12 max-sm:p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-accent" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p className="text-sm text-muted max-w-xs mx-auto">
            When buyers message you about your properties, conversations will appear here.
          </p>
        </div>
      ) : (
        <>

          <div className="space-y-1">
            {filtered.map((convo) => {
              const hasUnread = convo.unreadCount > 0;
              const initial = getInitial(convo.otherUser?.name);
              return (
                <Link
                  key={convo.id}
                  href={`/messages/${convo.id}`}
                  className={`flex items-center gap-3 p-3.5 rounded-xl transition-colors [-webkit-tap-highlight-color:transparent] hover:bg-panel-alt ${
                    hasUnread ? "bg-accent/[0.04]" : "bg-panel"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {convo.otherUser?.avatar_url ? (
                      <Image
                        src={convo.otherUser.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center text-base font-bold">
                        {initial}
                      </div>
                    )}
                    {hasUnread && (
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-panel" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                        {convo.otherUser?.name ?? "Unknown"}
                      </span>
                      <span className={`text-[11px] flex-shrink-0 ${hasUnread ? "font-semibold text-accent" : "text-muted"}`}>
                        {formatTime(convo.lastMessageAt)}
                      </span>
                    </div>

                    {convo.property && (
                      <p className="text-[11px] text-muted truncate mt-0.5 leading-tight">
                        {convo.property.title}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-[13px] truncate leading-snug ${hasUnread ? "font-semibold text-foreground" : "text-muted"}`}>
                        {getPreview(convo, userId)}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-accent text-white text-[11px] font-bold px-1.5">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted text-sm">
                {search.trim()
                  ? <>No conversations matching &ldquo;{search}&rdquo;</>
                  : filter === "unread"
                    ? "No unread conversations"
                    : "No conversations"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
