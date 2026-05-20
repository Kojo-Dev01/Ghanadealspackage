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
  const match = pathname.match(/^\/messages\/([^/]+)/);
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
    <div className="fixed right-4 top-4 z-[120] w-[min(380px,calc(100vw-2rem))] space-y-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl border border-border/70 bg-panel/95 backdrop-blur shadow-[0_12px_34px_rgba(0,0,0,0.18)] p-3.5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
              {toast.senderName.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] tracking-wide uppercase font-semibold text-accent/90">New message</div>
              <div className="text-sm font-semibold text-foreground truncate">{toast.senderName}</div>
              <div className="text-[13px] text-muted leading-snug break-words mt-0.5">{toast.preview}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="h-8 px-3.5 rounded-lg bg-accent text-white text-xs font-semibold hover:opacity-90"
              onClick={() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                router.push(`/messages/${toast.conversationId}`);
              }}
            >
              View
            </button>
            <button
              type="button"
              className="h-8 px-3.5 rounded-lg bg-panel-alt text-muted text-xs font-semibold hover:text-foreground"
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
