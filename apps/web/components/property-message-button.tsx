"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startConversation } from "../lib/api";
import { useAuth } from "./auth-provider";

type Props = {
  propertyId: string;
};

export function PropertyMessageButton({ propertyId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  async function handleClick() {
    if (!user) {
      window.dispatchEvent(new Event("gd:open-login"));
      return;
    }

    setStatus("loading");

    const result = await startConversation(propertyId, "", "Hi, I'm interested in this property.");
    if (result) {
      router.push(`/account/messages/${result.conversationId}`);
    } else {
      setStatus("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      className="btn btn-primary"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {status === "loading" ? "Opening chat..." : "Chat with Seller"}
    </button>
  );
}
