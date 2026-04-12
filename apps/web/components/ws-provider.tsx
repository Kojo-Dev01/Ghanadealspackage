"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type WsPayload =
  | { type: "new_message"; conversationId: string; message: Record<string, unknown> }
  | { type: "messages_read"; conversationId: string; readBy: string }
  | { type: "presence"; onlineUsers: string[] }
  | { type: "pong" };

type WsListener = (data: WsPayload) => void;

type WsContextValue = {
  connected: boolean;
  subscribe: (listener: WsListener) => () => void;
};

const WsContext = createContext<WsContextValue | null>(null);

export function useWs() {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWs must be inside <WsProvider>");
  return ctx;
}

/**
 * App-level WebSocket provider. Maintains a single persistent connection
 * per authenticated user. Components subscribe to messages via useWs().
 */
export function WsProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef<Set<WsListener>>(new Set());

  const subscribe = useCallback((listener: WsListener) => {
    listenersRef.current.add(listener);
    return () => { listenersRef.current.delete(listener); };
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function connect() {
      // Fetch token from cookie-forwarding endpoint
      let token: string;
      try {
        const res = await fetch("/api/ws-token", { credentials: "same-origin" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        token = data.token;
      } catch {
        return;
      }

      if (cancelled) return;

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const apiHost = new URL(apiBase).host;
      const wsUrl = `${protocol}//${apiHost}/v1/ws?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setConnected(true);
        // Heartbeat every 30s
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsPayload;
          if (data.type === "pong") return;
          // Broadcast to all subscribers
          for (const listener of listenersRef.current) {
            listener(data);
          }
        } catch {
          // ignore non-JSON
        }
      };

      ws.onclose = () => {
        if (pingRef.current) clearInterval(pingRef.current);
        setConnected(false);
        if (!cancelled) {
          const attempt = reconnectAttemptRef.current++;
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          reconnectTimerRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (pingRef.current) clearInterval(pingRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [userId]);

  return (
    <WsContext.Provider value={{ connected, subscribe }}>
      {children}
    </WsContext.Provider>
  );
}
