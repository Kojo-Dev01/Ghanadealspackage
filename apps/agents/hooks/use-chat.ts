"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWs } from "@/components/ws-provider";
import { apiFetch } from "@/lib/client-api";

export type PropertyRefData = {
  id: string;
  title: string;
  image: string | null;
  price: number;
  location: string;
  listingType: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  attachment_url: string | null;
  attachment_name: string | null;
  property_ref_id: string | null;
  property_ref: PropertyRefData | null;
  read_at: string | null;
  created_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function useChat(conversationId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { subscribe } = useWs();

  // Debounced mark-read — also dispatches event so sidebar badge refreshes
  const debouncedMarkRead = useCallback((convoId: string) => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(async () => {
      const res = await apiFetch(`/v1/conversations/${convoId}/read`, { method: "PATCH" });
      if (res?.ok) {
        window.dispatchEvent(new CustomEvent("gd:messages-read"));
      }
    }, 500);
  }, []);

  // Load initial messages
  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);

    apiFetch(`/v1/conversations/${conversationId}/messages`).then(async (res) => {
      if (!res || !res.ok) {
        setMessages([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
      setHasMore(data.hasMore ?? false);
      setLoading(false);
    });

    // Mark as read when opening (immediate)
    apiFetch(`/v1/conversations/${conversationId}/read`, { method: "PATCH" }).then((res) => {
      if (res?.ok) window.dispatchEvent(new CustomEvent("gd:messages-read"));
    });
    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, [conversationId]);

  // Subscribe to WS messages from the app-level provider
  useEffect(() => {
    if (!conversationId || !userId) return;

    const unsubscribe = subscribe((data) => {
      if (data.type === "new_message" && data.conversationId === conversationId) {
        setMessages((prev) => [...prev, data.message as unknown as ChatMessage]);
        debouncedMarkRead(conversationId);
      }
      if (data.type === "messages_read" && data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_id === userId && !m.read_at
              ? { ...m, read_at: new Date().toISOString() }
              : m
          )
        );
      }
    });

    return unsubscribe;
  }, [conversationId, userId, subscribe, debouncedMarkRead]);

  // Load older messages
  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || messages.length === 0) return;
    const oldest = messages[0];
    const params = new URLSearchParams({ cursor: oldest.created_at });
    const res = await apiFetch(`/v1/conversations/${conversationId}/messages?${params}`);
    if (!res || !res.ok) return;
    const data = await res.json();
    setMessages((prev) => [...(data.messages ?? []), ...prev]);
    setHasMore(data.hasMore ?? false);
  }, [conversationId, hasMore, messages]);

  // Send message (text, image, or property_ref)
  const sendChatMessage = useCallback(
    async (
      content: string,
      opts?: { messageType?: string; attachmentUrl?: string; attachmentName?: string; propertyRefId?: string }
    ) => {
      if (!conversationId || !content.trim()) return null;
      setSending(true);
      const res = await apiFetch(`/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          messageType: opts?.messageType ?? "text",
          ...(opts?.attachmentUrl && { attachmentUrl: opts.attachmentUrl }),
          ...(opts?.attachmentName && { attachmentName: opts.attachmentName }),
          ...(opts?.propertyRefId && { propertyRefId: opts.propertyRefId }),
        }),
      });
      if (res && res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setSending(false);
        return msg;
      }
      setSending(false);
      return null;
    },
    [conversationId]
  );

  return { messages, loading, hasMore, sending, loadMore, sendChatMessage, apiFetch };
}
