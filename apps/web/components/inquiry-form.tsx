"use client";

import { useState } from "react";
import { startConversation, sendMessage, submitInquiry } from "../lib/api";
import { useAuth } from "./auth-provider";

type Props = {
  propertyId: string;
};

export function InquiryForm({ propertyId }: Props) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // If not logged in, prompt login
    if (!user) {
      window.dispatchEvent(new Event("gd:open-login"));
      return;
    }

    if (!message.trim()) return;
    setStatus("loading");
    setFeedback("");

    const text = message.trim();

    // Also create a formal inquiry so agent receives inquiry notifications/email.
    const inquiryResult = await submitInquiry({
      propertyId,
      name: user.name,
      email: user.email,
      message: text,
      phone: "",
    });

    const result = await startConversation(propertyId, "", "");
    if (result) {
      // Send as a property_ref message so the property is tagged with the caption
      await sendMessage(result.conversationId, text, "property_ref", { propertyRefId: propertyId });
      setStatus("success");
      setFeedback(
        inquiryResult.ok
          ? "Message sent! The seller was notified."
          : "Message sent, but inquiry alert could not be confirmed. Please try again."
      );
      setMessage("");
    } else {
      setStatus("error");
      setFeedback("Failed to send message. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inquiry-form" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
        Send a Message
      </h4>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary, #64748b)" }}>
        Send a message and continue searching.
      </p>

      <textarea
        placeholder="Type your message to the seller..."
        required
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn-primary"
        style={{ width: "100%", padding: "10px 16px", fontSize: 14, cursor: status === "loading" ? "wait" : "pointer" }}
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>

      {!user && (
        <p style={{
          margin: 0,
          fontSize: 12,
          color: "var(--text-secondary, #64748b)",
          textAlign: "center",
        }}>
          You&apos;ll need to log in to send a message.
        </p>
      )}

      {feedback && (
        <p style={{
          margin: 0,
          fontSize: 13,
          color: status === "success" ? "#10B981" : "#EF4444",
          textAlign: "center"
        }}>
          {feedback}
        </p>
      )}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid var(--border, #e2e8f0)",
  borderRadius: 6,
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box"
};
