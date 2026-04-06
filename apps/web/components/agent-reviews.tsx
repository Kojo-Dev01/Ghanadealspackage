"use client";

import { useState, useTransition } from "react";
import { submitAgentReview, type ReviewRecord } from "../lib/api";

type Props = {
  agentId: string;
  reviews: ReviewRecord[];
  total: number;
};

function StarRating({ value, onChange, readonly = false, size = 22 }: { value: number; onChange?: (v: number) => void; readonly?: boolean; size?: number }) {
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
            fontSize: size,
            color: star <= (hover || value) ? "#f59e0b" : "var(--text-tertiary, #d1d5db)",
            transition: "color 0.15s, transform 0.15s",
            transform: !readonly && star <= hover ? "scale(1.2)" : "scale(1)",
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  lineHeight: 1.6,
  border: "1px solid var(--border-input)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  outline: "none",
  resize: "vertical" as const,
  transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
  fontFamily: "inherit",
};

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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          Reviews {total > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-secondary)" }}>({total})</span>}
        </h2>
        <button
          onClick={() => { setShowForm(!showForm); setMessage(""); }}
          className="btn btn-primary"
          style={{ fontSize: 13 }}
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          marginBottom: 24,
          boxShadow: "var(--shadow-card)",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
            Share your experience
          </h3>

          {/* Rating */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
              How would you rate this agent? *
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)",
              padding: "10px 14px", border: "1px solid var(--border-primary)",
            }}>
              <StarRating value={rating} onChange={setRating} size={28} />
              {rating > 0 && (
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
              Your Review <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="What was your experience working with this agent? Were they responsive, knowledgeable, helpful?"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--border-focus)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(230,57,70,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-input)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {comment.length > 0 && (
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4, textAlign: "right" }}>
                {comment.length}/2000
              </p>
            )}
          </div>

          {/* Submit */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSubmit}
              disabled={isPending || rating === 0}
              className="btn btn-primary"
              style={{ fontSize: 14, opacity: isPending || rating === 0 ? 0.6 : 1 }}
            >
              {isPending ? "Submitting..." : "Submit Review"}
            </button>
            {message && (
              <p style={{
                fontSize: 13,
                color: message.includes("error") || message.includes("Please") || message.includes("log in")
                  ? "#ef4444"
                  : "var(--success)",
                fontWeight: 500,
              }}>
                {message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Review List */}
      {reviews.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-primary)",
        }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 500 }}>
            No reviews yet
          </p>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>
            Be the first to review this agent!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((review) => (
            <div key={review.id} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              transition: "box-shadow var(--transition-fast)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "var(--red)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 13, fontWeight: 700,
                  }}>
                    {review.userName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{review.userName}</p>
                    <StarRating value={review.rating} readonly size={13} />
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{timeAgo(review.createdAt)}</span>
              </div>
              {review.comment && (
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 4 }}>{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
