"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitInquiry, startConversation } from "../lib/api";
import { useAuth } from "./auth-provider";

type Props = {
  propertyId: string;
};

export function InquiryForm({ propertyId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setFeedback("");

    // If logged in, start a chat conversation
    if (user) {
      const result = await startConversation(propertyId, "", message);
      if (result) {
        setStatus("success");
        setFeedback("Message sent! Redirecting to chat...");
        setMessage("");
        setTimeout(() => {
          router.push(`/account/messages/${result.conversationId}`);
        }, 1000);
      } else {
        setStatus("error");
        setFeedback("Failed to send message. Please try again.");
      }
      return;
    }

    // Anonymous: submit traditional inquiry
    const result = await submitInquiry({ propertyId, name, email, phone, message });
    if (result.ok) {
      setStatus("success");
      setFeedback(result.message);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } else {
      setStatus("error");
      setFeedback(result.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inquiry-form" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
        {user ? "Send a Message" : "Send an Inquiry"}
      </h4>

      {!user && (
        <>
          <input
            type="text"
            placeholder="Your name *"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email address *"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />
        </>
      )}

      <textarea
        placeholder={user ? "Type your message to the seller..." : "Your message *"}
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
        {status === "loading" ? "Sending..." : user ? "Send Message" : "Send Inquiry"}
      </button>

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
