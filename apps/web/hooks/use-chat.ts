"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../lib/api";
import { fetchMessages, sendMessage as sendMessageApi, markConversationRead } from "../lib/api";
import { useWs } from "../components/ws-provider";

export function useChat(conversationId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { subscribe } = useWs();

  // Debounced mark-read
  const debouncedMarkRead = useCallback((convoId: string) => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(async () => {
      await markConversationRead(convoId);
      window.dispatchEvent(new CustomEvent("gd:messages-read"));
    }, 500);
  }, []);

  // Load initial messages
  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    fetchMessages(conversationId).then((data) => {
      setMessages(data.messages);
      setHasMore(data.hasMore);
      setLoading(false);
    });
    // Mark as read when opening (immediate)
    markConversationRead(conversationId).then(() => {
      window.dispatchEvent(new CustomEvent("gd:messages-read"));
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
    const data = await fetchMessages(conversationId, oldest.created_at);
    setMessages((prev) => [...data.messages, ...prev]);
    setHasMore(data.hasMore);
  }, [conversationId, hasMore, messages]);

  // Send message (text, image, or property_ref)
  const sendChatMessage = useCallback(
    async (
      content: string,
      opts?: { messageType?: string; attachmentUrl?: string; attachmentName?: string; propertyRefId?: string }
    ) => {
      if (!conversationId || !content.trim()) return null;
      setSending(true);
      const msg = await sendMessageApi(
        conversationId,
        content.trim(),
        opts?.messageType ?? "text",
        opts
      );
      if (msg) {
        setMessages((prev) => [...prev, msg]);
      }
      setSending(false);
      return msg;
    },
    [conversationId]
  );

  return { messages, loading, hasMore, sending, loadMore, sendChatMessage };
}
