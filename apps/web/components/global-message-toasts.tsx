"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWs } from "./ws-provider";

type IncomingMessage = {
  id?: string;
  sender_id?: string;
  sender_name?: string;
  senderName?: string;
  sender?: { name?: string };
  content?: string;
  message_type?: string;
  created_at?: string;
};

type ToastItem = {
  id: string;
  conversationId: string;
  senderName: string;
  preview: string;
  createdAt: number;
};

const MAX_TOASTS = 3;
const TOAST_LIFETIME_MS = 7000;
const TOAST_COOLDOWN_MS = 1200;

function getPreview(message: IncomingMessage) {
  if (message.message_type === "image") return "Sent a photo";
  if (message.message_type === "property_ref") return "Shared a property";
  const content = (message.content ?? "New message").trim();
  return content.length > 80 ? `${content.slice(0, 77)}...` : content;
}

function getSenderName(message: IncomingMessage) {
  const name = message.senderName ?? message.sender_name ?? message.sender?.name ?? "New message";
  return name.trim() || "New message";
}

function getConversationFromPath(pathname: string) {
  const match = pathname.match(/^\/account\/messages\/([^/]+)/);
  return match?.[1] ?? null;
}

export function GlobalMessageToasts({ userId }: { userId: string | null }) {
  const { subscribe } = useWs();
  const router = useRouter();
  const pathname = usePathname();
  const activeConversationId = useMemo(() => getConversationFromPath(pathname), [pathname]);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastToastAtRef = useRef(0);
  const seenMessageKeysRef = useRef(new Set<string>());

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (data.type !== "new_message") return;

      const message = data.message as IncomingMessage;
      if (message.sender_id && userId && message.sender_id === userId) return;
      if (!data.conversationId) return;
      if (activeConversationId && data.conversationId === activeConversationId) return;

      const messageKey = message.id ?? `${data.conversationId}:${message.created_at ?? ""}:${message.content ?? ""}`;
      if (seenMessageKeysRef.current.has(messageKey)) return;
      seenMessageKeysRef.current.add(messageKey);

      const now = Date.now();
      if (now - lastToastAtRef.current < TOAST_COOLDOWN_MS) return;
      lastToastAtRef.current = now;

      const toast: ToastItem = {
        id: crypto.randomUUID(),
        conversationId: data.conversationId,
        senderName: getSenderName(message),
        preview: getPreview(message),
        createdAt: now,
      };

      setToasts((prev) => [toast, ...prev].slice(0, MAX_TOASTS));
    });

    return unsubscribe;
  }, [subscribe, userId, activeConversationId]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setInterval(() => {
      const cutoff = Date.now() - TOAST_LIFETIME_MS;
      setToasts((prev) => prev.filter((t) => t.createdAt > cutoff));
    }, 800);
    return () => window.clearInterval(timer);
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        top: 16,
        zIndex: 120,
        width: "min(380px, calc(100vw - 2rem))",
        display: "grid",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: "auto",
            borderRadius: 16,
            border: "1px solid var(--border-primary)",
            background: "color-mix(in oklab, var(--bg-card) 94%, white 6%)",
            boxShadow: "0 12px 34px rgba(0,0,0,0.18)",
            padding: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "color-mix(in oklab, var(--red) 16%, transparent)",
                color: "var(--red)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              {toast.senderName.slice(0, 2)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", letterSpacing: 0.4, textTransform: "uppercase" }}>New message</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {toast.senderName}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.35, marginTop: 2, wordBreak: "break-word" }}>
                {toast.preview}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: 8,
                border: "none",
                background: "var(--red)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                router.push(`/account/messages/${toast.conversationId}`);
              }}
            >
              View
            </button>
            <button
              type="button"
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: 8,
                border: "1px solid var(--border-primary)",
                background: "var(--bg-secondary)",
                color: "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
