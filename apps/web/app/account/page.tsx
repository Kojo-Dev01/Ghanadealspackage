"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../components/auth-provider";
import { fetchSavedProperties, fetchNotifications, type SavedPropertyItem, type NotificationItem } from "../../lib/api";

export default function AccountDashboardPage() {
  const { user } = useAuth();

  const [savedItems, setSavedItems] = useState<SavedPropertyItem[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      fetchSavedProperties(),
      fetchNotifications({ limit: 5 }),
    ]).then(([saved, notifs]) => {
      setSavedItems(saved.items.slice(0, 3));
      setSavedTotal(saved.total);
      setNotifications(notifs.items);
      setUnreadCount(notifs.items.filter((n) => !n.read).length);
      setFetching(false);
    });
  }, [user]);

  if (fetching) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ display: "inline-block", width: 32, height: 32, border: "3px solid var(--border-primary)", borderTopColor: "var(--red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <>
          {/* Greeting */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              {greeting}, {user?.name?.split(" ")[0] || "there"}!
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
              Here&apos;s a quick overview of your account.
            </p>
          </div>

          {/* Stat cards */}
          <div className="acct-stat-grid" style={{ display: "grid", gap: 16, marginBottom: 28 }}>
            <style>{`.acct-stat-grid { grid-template-columns: repeat(3, 1fr); } @media (max-width: 640px) { .acct-stat-grid { grid-template-columns: 1fr !important; } }`}</style>
            <Link href="/account/saved" style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 20px",
              textDecoration: "none",
              transition: "box-shadow var(--transition-fast)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--red-light)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{savedTotal}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Saved Properties</div>
                </div>
              </div>
            </Link>

            <Link href="/account/notifications" style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 20px",
              textDecoration: "none",
              transition: "box-shadow var(--transition-fast)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--info-bg)", color: "var(--info)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{unreadCount}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Unread Notifications</div>
                </div>
              </div>
            </Link>

            <Link href="/listings" style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 20px",
              textDecoration: "none",
              transition: "box-shadow var(--transition-fast)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--success-bg)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>Browse</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Find Properties</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Saved Properties */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-lg)",
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Recently Saved</h2>
              {savedTotal > 0 && (
                <Link href="/account/saved" style={{ fontSize: 13, color: "var(--red)", textDecoration: "none", fontWeight: 500 }}>
                  View all →
                </Link>
              )}
            </div>
            {savedItems.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 12px" }}>No saved properties yet</p>
                <Link href="/listings" className="btn btn-primary" style={{ fontSize: 13 }}>Browse Listings</Link>
              </div>
            ) : (
              <div>
                {savedItems.map((p) => (
                  <Link
                    key={p.id}
                    href={`/property/${p.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 20px",
                      textDecoration: "none",
                      color: "inherit",
                      borderBottom: "1px solid var(--border-primary)",
                      transition: "background var(--transition-fast)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 56,
                      height: 42,
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--bg-skeleton)",
                    }}>
                      {p.image && (
                        <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {p.region} · {p.type}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--red)", whiteSpace: "nowrap" }}>
                      {p.priceFormatted}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notifications */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Recent Notifications</h2>
              <Link href="/account/notifications" style={{ fontSize: 13, color: "var(--red)", textDecoration: "none", fontWeight: 500 }}>
                View all →
              </Link>
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "12px 20px",
                      borderBottom: "1px solid var(--border-primary)",
                      background: n.read ? "transparent" : "var(--info-bg)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontWeight: n.read ? 400 : 600, fontSize: 13, color: "var(--text-primary)" }}>{n.title}</span>
                      {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--info)", flexShrink: 0, marginTop: 5, marginLeft: 8 }} />}
                    </div>
                    {n.body && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{n.body}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
    </>
  );
}
