"use client";

import { useState } from "react";

type InquiryStatusActionsProps = {
  inquiryId: string;
  currentStatus: string;
};

const statusFlow: Record<string, { label: string; next: string; className: string }[]> = {
  new: [
    { label: "Mark Read", next: "read", className: "bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20" },
    { label: "Mark Responded", next: "responded", className: "bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20" },
  ],
  read: [
    { label: "Mark Responded", next: "responded", className: "bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20" },
    { label: "Close", next: "closed", className: "bg-slate-500/10 text-slate-600 border-slate-200 hover:bg-slate-500/20" },
  ],
  responded: [
    { label: "Close", next: "closed", className: "bg-slate-500/10 text-slate-600 border-slate-200 hover:bg-slate-500/20" },
  ],
  closed: [
    { label: "Reopen", next: "new", className: "bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20" },
  ],
};

export function InquiryStatusActions({ inquiryId, currentStatus }: InquiryStatusActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const actions = statusFlow[currentStatus] ?? [];

  const handleUpdate = async (nextStatus: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/inquiries/${encodeURIComponent(inquiryId)}/status`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const json = await res.json().catch(() => ({ message: "Failed" }));
        setError(json.message ?? "Failed to update");
        setLoading(false);
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((action) => (
        <button
          key={action.next}
          disabled={loading}
          onClick={() => handleUpdate(action.next)}
          className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${action.className}`}
        >
          {action.label}
        </button>
      ))}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
