"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ConversationDetail } from "@/lib/api";
import { useChat, type ChatMessage, type PropertyRefData } from "@/hooks/use-chat";

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

type SellerProp = { id: string; title: string; image: string | null; price: number; location: string; listingType: string };

/* ── Property card in bubble ── */
function PropertyCard({ prop, isMine }: { prop: PropertyRefData; isMine: boolean }) {
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
function BubbleContent({ msg, isMine, onImageClick }: { msg: ChatMessage; isMine: boolean; onImageClick?: (url: string) => void }) {
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
    // Property was deleted — fallback
    return (
      <p className="opacity-70 italic m-0">
        🏠 {msg.content || "Property no longer available"}
      </p>
    );
  }
  if (msg.message_type === "image" && msg.attachment_url) {
    return (
      <>
        <button type="button" className="block border-none bg-transparent p-0 cursor-pointer" onClick={() => onImageClick?.(msg.attachment_url!)}>
          <img src={msg.attachment_url} alt={msg.attachment_name ?? "Image"} className="max-w-full max-h-[280px] rounded-xl object-cover block" loading="lazy" />
        </button>
        {msg.content && <p className="whitespace-pre-wrap break-words m-0 mt-1.5 px-1">{msg.content}</p>}
      </>
    );
  }
  return <p className="whitespace-pre-wrap break-words m-0">{msg.content}</p>;
}

/* ── Mention popup ── */
function PropertyMentionPopup({
  items,
  filter,
  onSelect,
  loading,
}: {
  items: SellerProp[];
  filter: string;
  onSelect: (p: SellerProp) => void;
  loading: boolean;
}) {
  const filtered = filter
    ? items.filter((p) => p.title.toLowerCase().includes(filter.toLowerCase()))
    : items;

  return (
    <div className="absolute bottom-full left-4 right-4 bg-panel border border-border rounded-xl max-h-[280px] overflow-y-auto shadow-lg z-10">
      {loading ? (
        <div className="p-4 text-center text-sm text-muted">Loading properties…</div>
      ) : filtered.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted">No properties found</div>
      ) : (
        filtered.slice(0, 8).map((p) => (
          <button
            key={p.id}
            type="button"
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left border-none bg-transparent cursor-pointer hover:bg-panel-alt transition-colors"
            onClick={() => onSelect(p)}
          >
            {p.image ? (
              <img src={p.image} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-panel-alt flex items-center justify-center text-xl flex-shrink-0">🏠</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-foreground truncate">{p.title}</div>
              <div className="text-xs text-muted">{formatPrice(p.price)} · {p.location}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export default function SellerChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [convo, setConvo] = useState<ConversationDetail | null>(null);
  const [convoLoading, setConvoLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMsgCountRef = useRef(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  // @ mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [sellerProps, setSellerProps] = useState<SellerProp[]>([]);
  const [propsLoading, setPropsLoading] = useState(false);
  const propsCached = useRef(false);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { messages, loading, hasMore, sending, loadMore, sendChatMessage, apiFetch: clientFetch } = useChat(id, userId);

  // Get current user
  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUserId(data.id);
        }
      });
  }, []);

  // Load conversation detail
  useEffect(() => {
    if (!id) return;
    fetch("/api/ws-token", { credentials: "same-origin" })
      .then(async (tokenRes) => {
        if (!tokenRes.ok) return;
        const { token } = await tokenRes.json();
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const res = await fetch(`${apiBase}/v1/conversations/${id}`, {
          headers: { authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) {
          router.push("/messages");
          return;
        }
        setConvo(await res.json());
        setConvoLoading(false);
      });
  }, [id, router]);

  useEffect(() => {
    // Only auto-scroll when new messages are appended (not when loading older ones)
    const prev = prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;
    if (messages.length === 0) return;
    // If this is initial load or new message appended at end, scroll down
    if (prev === 0 || (messages.length > prev && messages[messages.length - 1]?.id !== messages[0]?.id)) {
      messagesEndRef.current?.scrollIntoView({ behavior: prev === 0 ? "instant" : "smooth" });
    }
  }, [messages]);

  // Scroll to bottom once the chat view mounts after loading
  useEffect(() => {
    if (!convoLoading && !loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [convoLoading, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!convoLoading && inputRef.current && window.innerWidth > 768) {
      inputRef.current.focus();
    }
  }, [convoLoading]);

  // Load seller properties for @ mention
  const loadSellerProperties = useCallback(async () => {
    if (propsCached.current || !id) return;
    setPropsLoading(true);
    const res = await clientFetch(`/v1/conversations/${id}/seller-properties`);
    if (res && res.ok) {
      setSellerProps(await res.json());
    }
    propsCached.current = true;
    setPropsLoading(false);
  }, [id, clientFetch]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInput(val);

    const cursorPos = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursorPos);
    const atIdx = textBefore.lastIndexOf("@");
    if (atIdx !== -1 && (atIdx === 0 || textBefore[atIdx - 1] === " ")) {
      const query = textBefore.slice(atIdx + 1);
      if (!query.includes(" ") || query.length < 30) {
        setShowMentions(true);
        setMentionFilter(query);
        loadSellerProperties();
        return;
      }
    }
    setShowMentions(false);
  }

  function handlePropertySelect(prop: SellerProp) {
    setShowMentions(false);
    setInput("");
    sendChatMessage(prop.title, { messageType: "property_ref", propertyRefId: prop.id });
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB");
      e.target.value = "";
      return;
    }
    setImagePreview({ file, url: URL.createObjectURL(file) });
    e.target.value = "";
  }

  function cancelImagePreview() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
    }
  }

  async function handleSendImage() {
    if (!imagePreview || uploading) return;
    setUploading(true);
    // Upload via the existing /api/uploads/sign proxy (agents are authorized)
    const form = new FormData();
    form.append("file", imagePreview.file);
    form.append("folder", "chat");
    const uploadRes = await fetch("/api/uploads/sign", { method: "POST", body: form, credentials: "same-origin" });
    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      const caption = input.trim() || "Sent an image";
      await sendChatMessage(caption, {
        messageType: "image",
        attachmentUrl: url,
        attachmentName: imagePreview.file.name,
      });
      setInput("");
    }
    cancelImagePreview();
    setUploading(false);
    inputRef.current?.focus();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (imagePreview) {
      await handleSendImage();
      return;
    }
    if (!input.trim() || sending) return;
    const text = input;
    setInput("");
    setShowMentions(false);
    await sendChatMessage(text);
    inputRef.current?.focus();
  }

  if (convoLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!convo) return null;

  const otherUser = convo.buyerId === userId ? convo.seller : convo.buyer;
  const initial = (otherUser?.name ?? "?")[0].toUpperCase();

  // Group by date
  const grouped: { date: string; msgs: typeof messages }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const d = formatDate(msg.created_at);
    if (d !== currentDate) {
      currentDate = d;
      grouped.push({ date: d, msgs: [] });
    }
    grouped[grouped.length - 1].msgs.push(msg);
  }

  return (
    <div className="flex flex-col relative -m-6 sm:-m-8 h-screen max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-panel flex-shrink-0">
        <Link
          href="/messages"
          className="flex items-center justify-center w-9 h-9 -ml-1 rounded-lg text-muted hover:text-foreground hover:bg-panel-alt transition-colors"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </Link>

        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{otherUser?.name ?? "Unknown"}</div>
          {convo.property ? (
            <div className="text-xs text-muted truncate">Re: {convo.property.title}</div>
          ) : (
            <div className="text-xs text-muted">Direct message</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={() => {
          const el = scrollContainerRef.current;
          if (!el) return;
          setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
        }}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 overscroll-contain [scrollbar-width:thin] relative"
      >
        {hasMore && (
          <div className="text-center mb-4">
            <button
              type="button"
              onClick={loadMore}
              className="px-5 py-1.5 rounded-full border border-border bg-panel text-muted text-xs hover:bg-panel-alt transition-colors cursor-pointer"
            >
              Load older messages
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-muted">
            <span className="text-4xl mb-2">💬</span>
            <p className="text-sm">No messages yet — send the first one!</p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            <div className="text-center my-4">
              <span className="text-[11px] font-semibold text-muted bg-panel-alt px-3.5 py-1 rounded-full">
                {group.date}
              </span>
            </div>
            {group.msgs.map((msg) => {
              const isMine = msg.sender_id === userId;
              const hasMedia = msg.message_type === "image" || msg.message_type === "property_ref";
              return (
                <div
                  key={msg.id}
                  className={`flex mb-1 ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] sm:max-w-[70%] text-sm sm:text-[14px] leading-relaxed ${
                      hasMedia ? "p-1.5" : "px-3.5 py-2.5"
                    } ${
                      isMine
                        ? "bg-accent text-white rounded-2xl rounded-br-sm"
                        : "bg-panel border border-border text-foreground rounded-2xl rounded-bl-sm"
                    }`}
                  >
                    <BubbleContent msg={msg} isMine={isMine} onImageClick={setLightboxUrl} />
                    <div className={`flex justify-end items-center gap-1 mt-1 px-1 text-[10px] ${isMine ? "text-white/60" : "text-muted"}`}>
                      {formatTime(msg.created_at)}
                      {isMine && (
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
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute right-6 bottom-[80px] z-10 w-10 h-10 rounded-full bg-panel border border-border shadow-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-panel-alt transition-all cursor-pointer"
          aria-label="Scroll to bottom"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-panel flex-shrink-0 relative">
        {/* @ mention popup */}
        {showMentions && (
          <PropertyMentionPopup
            items={sellerProps}
            filter={mentionFilter}
            onSelect={handlePropertySelect}
            loading={propsLoading}
          />
        )}

        {/* Image preview */}
        {imagePreview && (
          <div className="flex items-center gap-2.5 px-4 py-2 border-b border-border">
            <img src={imagePreview.url} alt="Preview" className="w-14 h-14 rounded-lg object-cover" />
            <span className="flex-1 text-sm text-muted">
              {uploading ? "Uploading…" : "Add a caption and send"}
            </span>
            <button
              type="button"
              onClick={cancelImagePreview}
              className="w-7 h-7 rounded-full bg-panel-alt text-muted flex items-center justify-center border-none cursor-pointer hover:bg-accent hover:text-white transition-colors"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full bg-panel-alt text-muted flex items-center justify-center flex-shrink-0 border-none cursor-pointer hover:text-foreground hover:bg-border transition-colors"
            aria-label="Attach image"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={imagePreview ? "Add a caption…" : "Type a message… (@ to tag a property)"}
            autoComplete="off"
            className="flex-1 px-4 py-2.5 rounded-full border border-border bg-panel-alt text-foreground text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={((!input.trim() && !imagePreview) || sending || uploading)}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
              (input.trim() || imagePreview)
                ? "bg-accent text-white hover:bg-accent-hover"
                : "bg-panel-alt text-muted"
            }`}
            aria-label="Send message"
          >
            {(sending || uploading) ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      </div>

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxUrl(null)}
          role="dialog"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border-none cursor-pointer transition-colors z-10"
            aria-label="Close"
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
