"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../../components/auth-provider";
import { fetchBuyerEnquiries, type BuyerEnquiryItem } from "../../../lib/api";

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  new: { label: "Sent", bg: "rgba(59,130,246,0.12)", color: "#3B82F6" },
  read: { label: "Read", bg: "rgba(139,92,246,0.12)", color: "#8B5CF6" },
  responded: { label: "Responded", bg: "rgba(16,185,129,0.12)", color: "#10B981" },
  closed: { label: "Closed", bg: "rgba(107,114,128,0.12)", color: "#6B7280" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.new;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EnquiriesPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<BuyerEnquiryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const limit = 20;

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    fetchBuyerEnquiries(page, filter || undefined).then((res) => {
      setItems(res.items);
      setTotal(res.total);
      setFetching(false);
    });
  }, [user, page, filter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (fetching && items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ display: "inline-block", width: 32, height: 32, border: "3px solid var(--border-primary)", borderTopColor: "var(--red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          My Enquiries
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
          {total} {total === 1 ? "enquiry" : "enquiries"} sent
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { value: "", label: "All" },
          { value: "new", label: "Sent" },
          { value: "read", label: "Read" },
          { value: "responded", label: "Responded" },
          { value: "closed", label: "Closed" },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => { setFilter(f.value); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--border-primary)",
              background: filter === f.value ? "var(--red)" : "var(--bg-card)",
              color: filter === f.value ? "#fff" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "var(--bg-card)",
          borderRadius: 12,
          border: "1px solid var(--border-primary)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", color: "var(--text-primary)" }}>
            No enquiries yet
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
            When you enquire about a property, it will appear here
          </p>
          <Link
            href="/properties"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: 8,
              background: "var(--red)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: 16,
                padding: 16,
                background: "var(--bg-card)",
                borderRadius: 12,
                border: "1px solid var(--border-primary)",
                transition: "box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Property image */}
              <Link
                href={`/properties/${item.propertyId}`}
                style={{ flexShrink: 0, borderRadius: 8, overflow: "hidden", display: "block" }}
              >
                <Image
                  src={item.propertyImage || "/placeholder-property.jpg"}
                  alt={item.propertyTitle}
                  width={120}
                  height={80}
                  unoptimized
                  style={{ objectFit: "cover", width: 120, height: 80, display: "block" }}
                />
              </Link>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <Link
                    href={`/properties/${item.propertyId}`}
                    style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none", lineHeight: 1.3 }}
                  >
                    {item.propertyTitle}
                  </Link>
                  <StatusPill status={item.status} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, fontSize: 12, color: "var(--text-tertiary)" }}>
                  {item.propertyRegion && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {item.propertyRegion}
                    </span>
                  )}
                  {item.propertyType && <span>{item.propertyType}</span>}
                  <span>{formatDate(item.createdAt)}</span>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {item.message}
                </p>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border-primary)",
                  background: "var(--bg-card)",
                  color: page <= 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Previous
              </button>
              <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text-secondary)" }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border-primary)",
                  background: "var(--bg-card)",
                  color: page >= totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
