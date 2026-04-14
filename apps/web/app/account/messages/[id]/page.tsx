"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../components/auth-provider";
import {
  fetchConversation,
  fetchSellerProperties,
  uploadChatImage,
  type ConversationDetail,
  type ChatMessage,
  type PropertyRefData,
} from "../../../../lib/api";
import { useChat } from "../../../../hooks/use-chat";

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

/* ── Property card inside a chat bubble ── */
function PropertyCard({ prop, isMine }: { prop: PropertyRefData; isMine: boolean }) {
  return (
    <Link
      href={`/property/${prop.id}`}
      style={{
        display: "flex", gap: 10, padding: 8,
        borderRadius: 12, border: `1px solid ${isMine ? "rgba(255,255,255,.2)" : "var(--border-primary)"}`,
        textDecoration: "none", transition: "opacity .15s", minWidth: 220,
      }}
    >
      {prop.image && (
        <img src={prop.image} alt={prop.title} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isMine ? "#fff" : "var(--text-primary)" }}>
          {prop.title}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: isMine ? "rgba(255,255,255,.85)" : "var(--red)" }}>
          {formatPrice(prop.price)}
        </div>
        <div style={{ fontSize: 11, marginTop: 2, color: isMine ? "rgba(255,255,255,.6)" : "var(--text-tertiary)" }}>
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
            <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "6px 4px 0" }}>{msg.content}</p>
          )}
        </>
      );
    }
    return (
      <p style={{ opacity: 0.7, fontStyle: "italic", margin: 0 }}>
        🏠 {msg.content || "Property no longer available"}
      </p>
    );
  }
  if (msg.message_type === "image" && msg.attachment_url) {
    return (
      <>
        <button type="button" style={{ display: "block", border: "none", background: "none", padding: 0, cursor: "pointer" }} onClick={() => onImageClick?.(msg.attachment_url!)}>
          <img src={msg.attachment_url} alt={msg.attachment_name ?? "Image"} style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 12, objectFit: "cover", display: "block" }} loading="lazy" />
        </button>
        {msg.content && <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "6px 4px 0" }}>{msg.content}</p>}
      </>
    );
  }
  return <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{msg.content}</p>;
}

/* ── Property mention popup ── */
type SellerProp = { id: string; title: string; image: string | null; price: number; location: string; listingType: string };

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
    <div style={{
      position: "absolute", bottom: "100%", left: 16, right: 16,
      background: "var(--bg-card)", border: "1px solid var(--border-primary)",
      borderRadius: 12, maxHeight: 280, overflowY: "auto",
      boxShadow: "0 -4px 20px rgba(0,0,0,.12)", zIndex: 10,
    }}>
      {loading ? (
        <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>Loading properties…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>No properties found</div>
      ) : (
        filtered.slice(0, 8).map((p) => (
          <button
            key={p.id}
            type="button"
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
            onClick={() => onSelect(p)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            {p.image ? (
              <img src={p.image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏠</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{formatPrice(p.price)} · {p.location}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [convo, setConvo] = useState<ConversationDetail | null>(null);
  const [convoLoading, setConvoLoading] = useState(true);
  const [input, setInput] = useState(searchParams.get("draft") ?? "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMsgCountRef = useRef(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Tagged property state (for sending property_ref with caption)
  const [taggedProperty, setTaggedProperty] = useState<SellerProp | null>(null);

  // @ mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [sellerProps, setSellerProps] = useState<SellerProp[]>([]);
  const [propsLoading, setPropsLoading] = useState(false);
  const propsCached = useRef(false);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { messages, loading, hasMore, sending, loadMore, sendChatMessage } = useChat(id, user?.id ?? null);

  useEffect(() => {
    if (!id) return;
    fetchConversation(id).then((data) => {
      if (!data) { router.push("/account/messages"); return; }
      setConvo(data);
      setConvoLoading(false);

      // Auto-tag property if autoTag param is set and conversation has a property
      if (searchParams.get("autoTag") && data.property) {
        setTaggedProperty({
          id: data.property.id,
          title: data.property.title,
          image: data.property.image || null,
          price: data.property.price,
          location: data.property.location,
          listingType: "",
        });
      }
    });
  }, [id, router, searchParams]);

  useEffect(() => {
    const prev = prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;
    if (messages.length === 0) return;
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

  // Load seller properties when @ is first triggered
  const loadSellerProperties = useCallback(async () => {
    if (propsCached.current || !id) return;
    setPropsLoading(true);
    const props = await fetchSellerProperties(id);
    setSellerProps(props);
    propsCached.current = true;
    setPropsLoading(false);
  }, [id]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInput(val);

    // Detect @ trigger
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
    // Remove the @... text from input, keep anything before the @
    const cursorPos = inputRef.current?.selectionStart ?? input.length;
    const textBefore = input.slice(0, cursorPos);
    const atIdx = textBefore.lastIndexOf("@");
    const beforeAt = atIdx > 0 ? textBefore.slice(0, atIdx).trimEnd() : "";
    const afterCursor = input.slice(cursorPos);
    setInput((beforeAt + (beforeAt ? " " : "") + afterCursor).trim());
    setTaggedProperty(prop);
    inputRef.current?.focus();
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB");
      e.target.value = "";
      return;
    }
    setImagePreview({ file, url: URL.createObjectURL(file) });
    // Reset file input so same file can be re-selected
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
    const result = await uploadChatImage(imagePreview.file);
    if (result) {
      const caption = input.trim() || "Sent an image";
      await sendChatMessage(caption, {
        messageType: "image",
        attachmentUrl: result.url,
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
    if (taggedProperty) {
      const caption = input.trim() || taggedProperty.title;
      setInput("");
      setTaggedProperty(null);
      setShowMentions(false);
      await sendChatMessage(caption, { messageType: "property_ref", propertyRefId: taggedProperty.id });
      inputRef.current?.focus();
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <style>{`@keyframes chatspin { to { transform:rotate(360deg); } }`}</style>
        <div style={{ width: 32, height: 32, border: "3px solid var(--border-primary)", borderTopColor: "var(--red)", borderRadius: "50%", animation: "chatspin .8s linear infinite" }} />
      </div>
    );
  }

  if (!convo) return null;

  const otherUser = convo.buyerId === user?.id ? convo.seller : convo.buyer;
  const initial = (otherUser?.name ?? "?")[0].toUpperCase();

  // Group messages by date
  const grouped: { date: string; msgs: typeof messages }[] = [];
  let curDate = "";
  for (const msg of messages) {
    const d = formatDate(msg.created_at);
    if (d !== curDate) { curDate = d; grouped.push({ date: d, msgs: [] }); }
    grouped[grouped.length - 1].msgs.push(msg);
  }

  return (
    <>
      <style>{`
        @keyframes chatspin { to { transform: rotate(360deg); } }

        /* When chat is active: hide dashboard header, remove content padding */
        .acct-main:has(.buyer-chat-shell) > header { display: none !important; }
        .acct-main:has(.buyer-chat-shell) > .acct-content { padding: 0 !important; overflow: hidden !important; }

        .buyer-chat-shell {
          display: flex; flex-direction: column;
          position: relative;
          height: 100vh; height: 100dvh;
          background: var(--bg-primary, #fff);
        }
        @media (max-width: 1024px) {
          .buyer-chat-shell {
            position: fixed; inset: 0; z-index: 50;
          }
        }
      `}</style>

      <div className="buyer-chat-shell">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border-primary)", background: "var(--bg-card)", flexShrink: 0 }}>
          <Link
            href="/account/messages"
            style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: -4, padding: "6px 10px 6px 6px", borderRadius: 8, color: "var(--text-tertiary)", transition: "all .15s", textDecoration: "none", fontSize: 13, fontWeight: 500 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Messages
          </Link>

          <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: "var(--red)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
            {initial}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {otherUser?.name ?? "Unknown"}
            </div>
            {convo.property ? (
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Re: {convo.property.title}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Direct message</div>
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
          style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 2, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" } as React.CSSProperties}
        >
          {hasMore && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <button
                type="button"
                onClick={loadMore}
                style={{ padding: "6px 20px", borderRadius: 999, border: "1px solid var(--border-primary)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
              >
                Load older messages
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "40px 20px", color: "var(--text-tertiary)", textAlign: "center" }}>
              <span style={{ fontSize: 40, marginBottom: 8 }}>💬</span>
              <p style={{ fontSize: 14, margin: 0 }}>No messages yet — send the first one!</p>
            </div>
          )}

          {grouped.map((group) => (
            <div key={group.date}>
              <div style={{ textAlign: "center", margin: "16px 0 8px" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", background: "var(--bg-secondary)", padding: "4px 14px", borderRadius: 999, display: "inline-block" }}>
                  {group.date}
                </span>
              </div>
              {group.msgs.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                const hasMedia = msg.message_type === "image" || msg.message_type === "property_ref";
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 3 }}>
                    <div style={{
                      maxWidth: "75%",
                      fontSize: 14, lineHeight: 1.55,
                      padding: hasMedia ? 6 : "10px 14px",
                      background: isMine ? "var(--red)" : "var(--bg-secondary)",
                      color: isMine ? "#fff" : "var(--text-primary)",
                      borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      border: isMine ? "none" : "1px solid var(--border-primary)",
                      wordBreak: "break-word",
                    }}>
                      <BubbleContent msg={msg} isMine={isMine} onImageClick={setLightboxUrl} />
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 4, padding: "0 2px" }}>
                        <span style={{ fontSize: 10, color: isMine ? "rgba(255,255,255,.6)" : "var(--text-tertiary)" }}>
                          {formatTime(msg.created_at)}
                        </span>
                        {isMine && (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>{msg.read_at ? "✓✓" : "✓"}</span>
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
            aria-label="Scroll to bottom"
            style={{
              position: "absolute", right: 24, bottom: 80, zIndex: 10,
              width: 40, height: 40, borderRadius: "50%",
              background: "var(--bg-card)", border: "1px solid var(--border-primary)",
              boxShadow: "0 2px 8px rgba(0,0,0,.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-secondary)", cursor: "pointer",
              transition: "background .15s, color .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        {/* Input area */}
        <div style={{ borderTop: "1px solid var(--border-primary)", background: "var(--bg-card)", flexShrink: 0, position: "relative" }}>
          {/* @ mention popup */}
          {showMentions && (
            <PropertyMentionPopup
              items={sellerProps}
              filter={mentionFilter}
              onSelect={handlePropertySelect}
              loading={propsLoading}
            />
          )}

          {/* Image preview strip */}
          {imagePreview && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: "1px solid var(--border-primary)" }}>
              <img src={imagePreview.url} alt="Preview" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>
                {uploading ? "Uploading…" : "Add a caption and send"}
              </span>
              <button
                type="button"
                onClick={cancelImagePreview}
                style={{ width: 28, height: 28, borderRadius: "50%", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--bg-secondary)", color: "var(--text-secondary)", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                aria-label="Remove image"
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Tagged property preview strip */}
          {taggedProperty && !imagePreview && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: "1px solid var(--border-primary)" }}>
              {taggedProperty.image && (
                <img src={taggedProperty.image} alt={taggedProperty.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  🏠 {taggedProperty.title}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  Tagged property · add a caption and send
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTaggedProperty(null)}
                style={{ width: 28, height: 28, borderRadius: "50%", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--bg-secondary)", color: "var(--text-secondary)", transition: "all .15s", flexShrink: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                aria-label="Remove tagged property"
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px" }}>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--bg-secondary)", color: "var(--text-secondary)", flexShrink: 0, transition: "all .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-primary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
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
              placeholder={imagePreview ? "Add a caption…" : taggedProperty ? "Add a caption for the tagged property…" : "Type a message… (@ to tag a property)"}
              autoComplete="off"
              style={{ flex: 1, padding: "10px 18px", borderRadius: 999, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none", transition: "border-color .15s" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--red)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; }}
            />
            <button
              type="submit"
              disabled={((!input.trim() && !imagePreview && !taggedProperty) || sending || uploading)}
              style={{
                width: 42, height: 42, borderRadius: "50%", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all .15s",
                cursor: (input.trim() || imagePreview || taggedProperty) ? "pointer" : "default",
                background: (input.trim() || imagePreview || taggedProperty) ? "var(--red)" : "var(--bg-secondary)",
                color: (input.trim() || imagePreview || taggedProperty) ? "#fff" : "var(--text-tertiary)",
              }}
              aria-label="Send message"
            >
              {(sending || uploading) ? (
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "chatspin .6s linear infinite" }} />
              ) : (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxUrl(null)}
          role="dialog"
          aria-label="Image preview"
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, cursor: "pointer" }}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
            style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.1)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .15s", zIndex: 10 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
          />
        </div>
      )}
    </>
  );
}
