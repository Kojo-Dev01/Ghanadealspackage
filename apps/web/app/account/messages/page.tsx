"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../../components/auth-provider";
import { fetchConversations, type ConversationListItem } from "../../../lib/api";

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

/* ---------- inline style helpers ---------- */

const S = {
  wrapper: { display: "flex", flexDirection: "column" as const, gap: 16 },
  headerBlock: {},
  h1: { fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary)" },
  subtitle: { color: "var(--text-secondary)", marginTop: 4, fontSize: 14 },

  /* loading */
  loadWrap: { display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" },

  /* empty */
  empty: {
    textAlign: "center" as const, padding: "48px 20px",
    background: "var(--bg-card)", borderRadius: 16,
    border: "1px solid var(--border-primary)",
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: "50%",
    background: "rgba(230,57,70,0.08)", display: "flex",
    alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
  emptyIconSvg: { width: 28, height: 28, color: "var(--red)" },
  emptyH: { fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "var(--text-primary)" },
  emptyP: { color: "var(--text-secondary)", fontSize: 14, margin: "0 0 20px", maxWidth: 260, marginLeft: "auto", marginRight: "auto" },
  emptyBtn: {
    display: "inline-block", padding: "10px 24px", borderRadius: 10,
    background: "var(--red)", color: "#fff", fontSize: 14, fontWeight: 600,
    textDecoration: "none",
  },

  /* search */
  searchWrap: { position: "relative" as const },
  searchIcon: {
    position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)",
    width: 16, height: 16, color: "var(--text-tertiary)", pointerEvents: "none" as const,
  },
  searchInput: {
    width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
    borderRadius: 12, border: "1px solid var(--border-primary)",
    background: "var(--bg-card)", color: "var(--text-primary)",
    fontSize: 14, outline: "none",
  },

  /* list */
  list: { display: "flex", flexDirection: "column" as const, gap: 2 },

  /* item */
  item: (unread: boolean): React.CSSProperties => ({
    display: "flex", gap: 12, padding: "14px 14px", alignItems: "center",
    borderRadius: 12, textDecoration: "none",
    background: unread ? "rgba(230,57,70,0.04)" : "var(--bg-card)",
    WebkitTapHighlightColor: "transparent",
    transition: "background .15s",
  }),

  /* avatar */
  avatarWrap: { position: "relative" as const, flexShrink: 0 },
  avatarImg: { width: 48, height: 48, borderRadius: "50%", objectFit: "cover" as const, display: "block" },
  avatarFallback: (accent: string): React.CSSProperties => ({
    width: 48, height: 48, borderRadius: "50%",
    background: accent, color: "var(--red)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, fontWeight: 700,
  }),
  unreadDot: {
    position: "absolute" as const, top: -2, right: -2,
    width: 14, height: 14, borderRadius: "50%",
    background: "var(--red)", border: "2px solid var(--bg-card)",
  },

  body: { flex: 1, minWidth: 0 },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  name: (bold: boolean): React.CSSProperties => ({
    fontSize: 14, color: "var(--text-primary)",
    fontWeight: bold ? 700 : 500,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  }),
  time: (unread: boolean): React.CSSProperties => ({
    fontSize: 11, flexShrink: 0,
    color: unread ? "var(--red)" : "var(--text-tertiary)",
    fontWeight: unread ? 600 : 400,
  }),
  propLabel: {
    fontSize: 11, color: "var(--text-tertiary)", marginTop: 2,
    whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis",
    lineHeight: 1.3,
  },
  bottomRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 2 },
  preview: (bold: boolean): React.CSSProperties => ({
    margin: 0, fontSize: 13, lineHeight: 1.4,
    color: bold ? "var(--text-primary)" : "var(--text-secondary)",
    fontWeight: bold ? 600 : 400,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  }),
  badge: {
    flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: 20, height: 20, borderRadius: 10,
    background: "var(--red)", color: "#fff", fontSize: 11,
    fontWeight: 700, padding: "0 6px",
  },

  noResults: { textAlign: "center" as const, padding: "48px 0", color: "var(--text-secondary)", fontSize: 14 },
} as const;

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const refresh = useCallback(() => {
    fetchConversations().then((data) => {
      setConversations(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [user, refresh]);

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
      <>
        <div style={S.loadWrap}>
          <div className="msg-spinner" />
        </div>
        <style>{`
          .msg-spinner { width:32px; height:32px; border:3px solid var(--border-primary); border-top-color:var(--red); border-radius:50%; animation:msgspin .8s linear infinite; }
          @keyframes msgspin { to { transform:rotate(360deg); } }
        `}</style>
      </>
    );
  }

  return (
    <div style={S.wrapper}>
      {/* Header */}
      <div style={S.headerBlock}>
        <h1 style={S.h1}>Messages</h1>
        <p style={S.subtitle}>
          {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
        </p>
      </div>

      {/* Search & Filters — always visible when conversations exist */}
      {conversations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={S.searchWrap}>
            <svg style={S.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or property…"
              style={S.searchInput}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {(["all", "unread"] as const).map((tab) => {
              const active = filter === tab;
              const label = tab === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: "none", cursor: "pointer", transition: "background .15s, color .15s",
                    background: active ? "var(--red)" : "var(--bg-secondary)",
                    color: active ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {conversations.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}>
            <svg style={S.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 style={S.emptyH}>No messages yet</h3>
          <p style={S.emptyP}>Start a conversation by enquiring about a property</p>
          <Link href="/properties" style={S.emptyBtn}>Browse Properties</Link>
        </div>
      ) : (
        <>

          <div style={S.list}>
            {filtered.map((convo) => {
              const hasUnread = convo.unreadCount > 0;
              const initial = getInitial(convo.otherUser?.name);
              return (
                <Link
                  key={convo.id}
                  href={`/account/messages/${convo.id}`}
                  style={S.item(hasUnread)}
                >
                  {/* Avatar */}
                  <div style={S.avatarWrap}>
                    {convo.otherUser?.avatar_url ? (
                      <Image
                        src={convo.otherUser.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        style={S.avatarImg}
                      />
                    ) : (
                      <div style={S.avatarFallback("rgba(230,57,70,0.08)")}>
                        {initial}
                      </div>
                    )}
                    {hasUnread && <div style={S.unreadDot} />}
                  </div>

                  {/* Content */}
                  <div style={S.body}>
                    <div style={S.topRow}>
                      <span style={S.name(hasUnread)}>
                        {convo.otherUser?.name ?? "Unknown"}
                      </span>
                      <span style={S.time(hasUnread)}>
                        {formatTime(convo.lastMessageAt)}
                      </span>
                    </div>

                    {convo.property && (
                      <p style={S.propLabel}>{convo.property.title}</p>
                    )}

                    <div style={S.bottomRow}>
                      <p style={S.preview(hasUnread)}>
                        {getPreview(convo, user?.id ?? null)}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span style={S.badge}>{convo.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}

            {filtered.length === 0 && (
              <div style={S.noResults}>
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
