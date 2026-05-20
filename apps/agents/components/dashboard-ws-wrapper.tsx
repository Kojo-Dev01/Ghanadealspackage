"use client";

import { useEffect, useState, type ReactNode } from "react";
import { WsProvider } from "./ws-provider";
import { GlobalMessageToasts } from "./global-message-toasts";

/**
 * Wraps the dashboard in a WsProvider that stays alive
 * as long as the user is on any dashboard page.
 */
export function DashboardWsWrapper({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUserId(data.id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <WsProvider userId={userId}>
      <GlobalMessageToasts userId={userId} />
      {children}
    </WsProvider>
  );
}
