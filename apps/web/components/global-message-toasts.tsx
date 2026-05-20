"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWs } from "./ws-provider";

type IncomingMessage = {
  id?: string;
  sender_id?: string;
  content?: string;
  message_type?: string;
  created_at?: string;
};

type ToastItem = {
  id: string;
  conversationId: string;
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
        width: "min(360px, calc(100vw - 2rem))",
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
            borderRadius: 12,
            border: "1px solid var(--border-primary)",
            background: "var(--bg-card)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red)", marginBottom: 2 }}>New message</div>
          <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.35, wordBreak: "break-word" }}>{toast.preview}</div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              style={{
                height: 32,
                padding: "0 12px",
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
                padding: "0 12px",
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
