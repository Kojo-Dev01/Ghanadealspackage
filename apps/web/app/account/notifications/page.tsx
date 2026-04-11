"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../components/auth-provider";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationItem,
} from "../../../lib/api";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchPage = (p: number, unread: boolean) => {
    setFetching(true);
    fetchNotifications({ page: p, limit: 20, unread }).then((res) => {
      setItems(res.items);
      setTotal(res.total);
      setFetching(false);
    });
  };

  useEffect(() => {
    if (!user) return;
    fetchPage(1, false);
  }, [user]);

  const handleFilter = (f: "all" | "unread") => {
    setFilter(f);
    setPage(1);
    fetchPage(1, f === "unread");
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  };

  const unreadCount = items.filter((n) => !n.read).length;
  const totalPages = Math.ceil(total / 20);

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
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Notifications</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
                {total} notification{total !== 1 ? "s" : ""}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--red)",
                  fontWeight: 500,
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleFilter(f)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "1px solid var(--border-primary)",
                  background: filter === f ? "var(--red)" : "var(--bg-card)",
                  color: filter === f ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  textTransform: "capitalize",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            {items.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center" }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--border-primary)",
                    background: n.read ? "transparent" : "var(--info-bg)",
                    transition: "background var(--transition-fast)",
                  }}
                >
                  {/* Unread dot */}
                  <div style={{ width: 8, flexShrink: 0, paddingTop: 6 }}>
                    {!n.read && <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: "var(--info)" }} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>{n.title}</div>
                    {n.body && <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>{n.body}</div>}
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{timeAgo(n.createdAt)}</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        title="Mark as read"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          color: "var(--text-tertiary)",
                          borderRadius: "var(--radius-sm)",
                          transition: "color var(--transition-fast)",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--info)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                      >
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      title="Delete"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        color: "var(--text-tertiary)",
                        borderRadius: "var(--radius-sm)",
                        transition: "color var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "var(--red)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                    >
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => { const p = page - 1; setPage(p); fetchPage(p, filter === "unread"); }}
                disabled={page <= 1}
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-primary)",
                  background: "var(--bg-card)",
                  color: page <= 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Prev
              </button>
              <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text-secondary)" }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => { const p = page + 1; setPage(p); fetchPage(p, filter === "unread"); }}
                disabled={page >= totalPages}
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-primary)",
                  background: "var(--bg-card)",
                  color: page >= totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next →
              </button>
            </div>
          )}
    </>
  );
}
