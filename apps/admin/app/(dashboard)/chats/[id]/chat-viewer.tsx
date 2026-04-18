"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { AdminConversationDetail, AdminChatMessage } from "@/lib/api";

/* ── Helpers ── */

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(n: number) {
  return `GHS ${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(n)}`;
}

/* ── Property card in bubble ── */

function PropertyCard({ prop, isMine }: { prop: NonNullable<AdminChatMessage["property_ref"]>; isMine: boolean }) {
  return (
    <Link
      href={`/listings/${prop.id}`}
      className={`flex gap-2.5 p-2 rounded-xl border no-underline transition-opacity hover:opacity-85 ${
        isMine ? "border-white/20" : "border-border"
      }`}
      style={{ minWidth: 220 }}
    >
      {prop.image && (
        <img src={prop.image} alt={prop.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-semibold truncate ${isMine ? "text-white" : "text-foreground"}`}>
          {prop.title}
        </div>
        <div className={`text-xs font-bold mt-0.5 ${isMine ? "text-white/85" : "text-accent"}`}>
          {formatPrice(prop.price)}
        </div>
        <div className={`text-[11px] mt-0.5 ${isMine ? "text-white/60" : "text-muted"}`}>
          📍 {prop.location}
        </div>
      </div>
    </Link>
  );
}

/* ── Bubble content renderer ── */

function BubbleContent({
  msg,
  isMine,
  onImageClick,
}: {
  msg: AdminChatMessage;
  isMine: boolean;
  onImageClick?: (url: string) => void;
}) {
  if (msg.message_type === "property_ref") {
    if (msg.property_ref) {
      return (
        <>
          <PropertyCard prop={msg.property_ref} isMine={isMine} />
          {msg.content && msg.content !== msg.property_ref.title && (
            <p className="whitespace-pre-wrap break-words m-0 mt-1.5 px-1">{msg.content}</p>
          )}
        </>
      );
    }
    return (
      <p className="opacity-70 italic m-0">
        🏠 {msg.content || "Property no longer available"}
      </p>
    );
  }
  if (msg.message_type === "image" && msg.attachment_url) {
    return (
      <>
        <button
          type="button"
          className="block border-none bg-transparent p-0 cursor-pointer"
          onClick={() => onImageClick?.(msg.attachment_url!)}
        >
          <img
            src={msg.attachment_url}
            alt={msg.attachment_name ?? "Image"}
            className="max-w-[200px] max-h-[180px] rounded-2xl object-cover block"
            loading="lazy"
          />
        </button>
        {msg.content && <p className="whitespace-pre-wrap break-words m-0 mt-1.5 px-2">{msg.content}</p>}
      </>
    );
  }
  return <p className="whitespace-pre-wrap break-words m-0">{msg.content}</p>;
}

/* ── Main admin chat viewer ── */

export function AdminChatViewer({
  conversation,
  initialMessages,
  initialHasMore,
}: {
  conversation: AdminConversationDetail;
  initialMessages: AdminChatMessage[];
  initialHasMore: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const convo = conversation;
  const sellerInitial = (convo.seller?.name ?? "?")[0].toUpperCase();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[0].created_at;
    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(convo.id)}/messages?cursor=${encodeURIComponent(oldest)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...(data.messages ?? []), ...prev]);
        setHasMore(data.hasMore ?? false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages, convo.id]);

  const handleDelete = useCallback(async (msgId: string) => {
    setDeletingId(msgId);
    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(convo.id)}/messages/${encodeURIComponent(msgId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, deleted_at: new Date().toISOString(), deleted_by: "admin" } : m
          )
        );
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }, [convo.id]);

  const grouped: { date: string; msgs: AdminChatMessage[] }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const d = formatDate(msg.created_at);
    if (d !== currentDate) {
      currentDate = d;
      grouped.push({ date: d, msgs: [] });
    }
    grouped[grouped.length - 1].msgs.push(msg);
  }

  /*
   * Layout strategy: CSS Grid with 3 explicit rows.
   *   row 1 (auto)  → header + legend
   *   row 2 (1fr)   → messages (only scrollable area)
   *   row 3 (auto)  → footer
   *
   * position:fixed to escape parent layout entirely.
   * On lg+ offset left by 260px sidebar width.
   * grid-template-rows guarantees row 2 fills remaining space.
   */
  return (
    <>
      <style>{`
        .chat-shell {
          position: fixed;
          inset: 0;
          display: grid;
          grid-template-rows: auto 1fr auto;
          z-index: 30;
          background: var(--color-background);
        }
        @media (min-width: 1024px) {
          .chat-shell { left: 260px; }
        }
        .chat-scroll {
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          scrollbar-width: thin;
        }
      `}</style>

      <div className="chat-shell">
        {/* ─── ROW 1: Header ─── */}
        <div>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-panel">
            <Link
              href="/chats"
              className="flex items-center justify-center w-9 h-9 -ml-1 rounded-lg text-muted hover:text-foreground hover:bg-panel-alt transition-colors"
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </Link>

            <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {sellerInitial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {convo.buyer?.name ?? "Unknown"} → {convo.seller?.name ?? "Unknown"}
              </div>
              {convo.property ? (
                <div className="text-xs text-muted truncate">Re: {convo.property.title}</div>
              ) : (
                <div className="text-xs text-muted">Direct message</div>
              )}
            </div>

            <div className="px-2 py-1 bg-panel-alt rounded-md text-[11px] font-medium text-muted flex-shrink-0">
              Moderator
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-panel-alt/50 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-panel border border-border" />
              <span className="font-semibold text-foreground">{convo.buyer?.name ?? "Unknown"}</span>
              <span className="text-muted">(Buyer)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{convo.seller?.name ?? "Unknown"}</span>
              <span className="text-muted">(Seller)</span>
              <span className="w-2 h-2 rounded-full bg-accent" />
            </span>
          </div>
        </div>

        {/* ─── ROW 2: Messages (scrollable) ─── */}
        <div
          ref={scrollRef}
          className="chat-scroll relative px-4 py-4 w-full"
          onScroll={() => {
            const el = scrollRef.current;
            if (!el) return;
            setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
          }}
        >
          {hasMore && (
            <div className="text-center mb-4">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="px-5 py-1.5 rounded-full border border-border bg-panel text-muted text-xs hover:bg-panel-alt transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load older messages"}
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted">
              <span className="text-4xl mb-2">💬</span>
              <p className="text-sm">No messages in this conversation.</p>
            </div>
          )}

          {grouped.map((group) => (
            <div key={group.date} className="w-full">
              <div className="text-center my-4">
                <span className="text-[11px] font-semibold text-muted bg-panel-alt px-3.5 py-1 rounded-full">
                  {group.date}
                </span>
              </div>
              {group.msgs.map((msg) => {
                const isSeller =
                  msg.sender_id === convo.sellerId ||
                  msg.sender_id === convo.seller?.user_id;
                const senderName = isSeller ? convo.seller?.name : convo.buyer?.name;
                const hasMedia = msg.message_type === "image" || msg.message_type === "property_ref";
                const isDeleted = !!msg.deleted_at;

                return (
                  <div
                    key={msg.id}
                    className={`group flex w-full mb-1 ${isSeller ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      style={{ position: "relative" }}
                      className={`max-w-[75%] sm:max-w-[70%] text-sm sm:text-[14px] leading-relaxed overflow-hidden ${
                        isDeleted
                          ? "px-3.5 py-2.5 bg-panel-alt/50 border border-border border-dashed text-muted rounded-2xl italic"
                          : hasMedia ? "p-1" : "px-3.5 py-2.5"
                      } ${
                        !isDeleted && isSeller
                          ? "bg-accent text-white rounded-2xl rounded-br-sm ml-auto"
                          : !isDeleted
                            ? "bg-panel border border-border text-foreground rounded-2xl rounded-bl-sm mr-auto"
                            : isSeller ? "ml-auto" : "mr-auto"
                      }`}
                    >
                      {/* Delete button — bottom-right of bubble */}
                      {!isDeleted && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(msg.id)}
                          style={{ position: "absolute", bottom: 2, right: 2, zIndex: 10 }}
                          className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-50  shadow-lg flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 hover:scale-110 transition-all duration-150 cursor-pointer"
                          title="Delete message"
                        >
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}

                      <div className={`text-[10px] font-semibold mb-0.5 ${hasMedia && !isDeleted ? "px-2" : "px-1"} ${isDeleted ? "text-muted" : isSeller ? "text-white/60" : "text-muted"}`}>
                        {senderName ?? "Unknown"} · {isSeller ? "Seller" : "Buyer"}
                      </div>

                      {isDeleted ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          This message was removed by a moderator
                        </div>
                      ) : (
                        <BubbleContent msg={msg} isMine={isSeller} onImageClick={setLightboxUrl} />
                      )}

                      <div className={`flex justify-end items-center gap-1 mt-1 ${hasMedia && !isDeleted ? "px-2" : "px-1"} text-[10px] ${isDeleted ? "text-muted/60" : isSeller ? "text-white/60" : "text-muted"}`}>
                        {formatTime(msg.created_at)}
                        {isDeleted && (
                          <span className="text-red-400 font-medium ml-1">Deleted</span>
                        )}
                        {!isDeleted && isSeller && (
                          <span className="text-[11px]">{msg.read_at ? "✓✓" : "✓"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div ref={messagesEndRef} />

          {showScrollBtn && (
            <button
              type="button"
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="sticky bottom-4 float-right z-10 w-10 h-10 rounded-full bg-panel border border-border shadow-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-panel-alt transition-all cursor-pointer"
              aria-label="Scroll to bottom"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>

        {/* ─── ROW 3: Footer ─── */}
        <div className="border-t border-border bg-panel px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-center gap-2 text-sm text-muted">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Admin view — hover messages to moderate
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)" }}
          className="flex items-center justify-center p-6"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-panel border border-border rounded-2xl shadow-2xl p-6"
            style={{ width: 360, maxWidth: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Delete this message?</h3>
                <p className="text-xs text-muted mt-0.5">
                  Users will see &ldquo;This message was removed by a moderator&rdquo;
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-panel-alt transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={!!deletingId}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)" }}
          className="flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxUrl(null)}
          role="dialog"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center border-none cursor-pointer transition-colors"
            aria-label="Close"
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            style={{ maxWidth: "85vw", maxHeight: "85vh" }}
            className="object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}