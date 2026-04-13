"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";
import { fetchUnreadConversationCount } from "../lib/api";

const navItems = [
  { key: "overview", label: "Overview", href: "/account", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { key: "messages", label: "Messages", href: "/account/messages", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { key: "saved", label: "Saved Properties", href: "/account/saved", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { key: "profile", label: "My Profile", href: "/account/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { key: "notifications", label: "Notifications", href: "/account/notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
] as const;

function getActiveKey(pathname: string) {
  if (pathname.startsWith("/account/messages")) return "messages";
  if (pathname.startsWith("/account/saved")) return "saved";
  if (pathname.startsWith("/account/profile")) return "profile";
  if (pathname.startsWith("/account/notifications")) return "notifications";
  return "overview";
}

export function AccountSidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
  const pathname = usePathname();
  const activeKey = getActiveKey(pathname);
  const { user, logout } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchUnreadConversationCount().then(setUnreadMessages);
    const interval = setInterval(() => {
      fetchUnreadConversationCount().then(setUnreadMessages);
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <aside className={className} style={{
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
      background: "#111111",
      color: "rgba(255,255,255,0.8)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
    }}>
      {/* Mobile close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "flex-end",
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "none",
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            marginBottom: 8,
            transition: "background 0.15s, color 0.15s",
          }}
          className="acct-sidebar-close"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      {/* Brand */}
      <div style={{ padding: "0 8px", marginBottom: 28 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--red)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff",
          }}>G</div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>
              <span style={{ color: "var(--red)" }}>Ghana</span>
              <span style={{ color: "#fff" }}>Deals</span>
            </span>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.3 }}>My Dashboard</p>
          </div>
        </Link>
      </div>

      {/* User card */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px", marginBottom: 20,
        borderRadius: 10, background: "rgba(255,255,255,0.06)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--red)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700, flexShrink: 0,
        }}>
          {(user?.name || user?.email || "U")[0].toUpperCase()}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.name || "User"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.email}
          </div>
        </div>
      </div>

      {/* Navigation label */}
      <p style={{ padding: "0 8px", marginBottom: 6, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
        Navigation
      </p>

      {/* Nav links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => {
          const active = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8,
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? "var(--red)" : "rgba(255,255,255,0.7)",
                background: active ? "rgba(230,57,70,0.12)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                }
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
              {item.key === "messages" && unreadMessages > 0 && (
                <span style={{
                  marginLeft: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  background: "var(--red)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "0 6px",
                }}>
                  {unreadMessages}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 2 }}>
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8,
            fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)",
            textDecoration: "none", transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Public Site
        </Link>
        <button
          type="button"
          onClick={logout}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8,
            fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)",
            background: "none", border: "none", cursor: "pointer", width: "100%",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
