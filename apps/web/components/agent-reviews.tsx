"use client";

import { useState, useTransition } from "react";
import { submitAgentReview, type ReviewRecord } from "../lib/api";

type Props = {
  agentId: string;
  reviews: ReviewRecord[];
  total: number;
};

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            cursor: readonly ? "default" : "pointer",
            fontSize: readonly ? 14 : 22,
            color: star <= (hover || value) ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function AgentReviews({ agentId, reviews: initialReviews, total }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  function handleSubmit() {
    if (rating === 0) {
      setMessage("Please select a rating");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("gd_token") : null;
    if (!token) {
      setMessage("Please log in to leave a review");
      return;
    }

    startTransition(async () => {
      const result = await submitAgentReview(token, agentId, {
        rating,
        comment: comment.trim() || undefined,
      });
      setMessage(result.message);
      if (result.ok) {
        setRating(0);
        setComment("");
        setShowForm(false);
      }
    });
  }

  const inputCls =
    "border border-[var(--border)] rounded-lg bg-[var(--panel-alt)] px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 w-full";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          Reviews {total > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-secondary)" }}>({total})</span>}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
          style={{ fontSize: 13 }}
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <div style={{ background: "var(--panel-alt)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Your Rating *</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Share your experience with this agent..."
              className={inputCls}
              style={{ resize: "vertical" }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="btn btn-primary"
            style={{ fontSize: 13 }}
          >
            {isPending ? "Submitting..." : "Submit Review"}
          </button>
          {message && (
            <p style={{ fontSize: 12, color: message.includes("error") || message.includes("Please") ? "var(--error, #ef4444)" : "var(--accent)", marginTop: 8 }}>
              {message}
            </p>
          )}
        </div>
      )}

      {/* Review List */}
      {reviews.length === 0 ? (
        <p style={{ textAlign: "center", padding: "32px 0", color: "var(--text-secondary)", fontSize: 14 }}>
          No reviews yet. Be the first to review this agent!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((review) => (
            <div key={review.id} style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700 }}>
                    {review.userName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{review.userName}</p>
                    <StarRating value={review.rating} readonly />
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{timeAgo(review.createdAt)}</span>
              </div>
              {review.comment && (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
