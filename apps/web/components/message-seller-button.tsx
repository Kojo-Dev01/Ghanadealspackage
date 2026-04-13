"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startConversation } from "../lib/api";
import { useAuth } from "./auth-provider";

type Props = {
  sellerId: string;
  sellerName: string;
};

export function MessageSellerButton({ sellerId, sellerName }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  async function handleClick() {
    if (!user) {
      window.dispatchEvent(new Event("gd:open-login"));
      return;
    }

    if (user.id === sellerId) return;

    setStatus("loading");

    const result = await startConversation("", sellerId, `Hi ${sellerName}, I'd like to get in touch with you.`);
    if (result) {
      router.push(`/account/messages/${result.conversationId}`);
    } else {
      setStatus("idle");
    }
  }

  // Don't show the button if the logged-in user IS this seller
  if (user && user.id === sellerId) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      className="btn btn-primary btn-sm"
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {status === "loading" ? "Opening chat..." : "Message Seller"}
    </button>
  );
}
