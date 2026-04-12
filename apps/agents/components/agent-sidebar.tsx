"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Mail,
  UserCircle,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Sun,
  Moon,
  Bookmark,
  Bell,
  Check,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { useWs } from "./ws-provider";
import { getToken, apiFetch } from "@/lib/client-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

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

const navItems = [
  { key: "overview", label: "Overview", href: "/", icon: <LayoutDashboard size={18} /> },
  { key: "listings", label: "My Listings", href: "/listings", icon: <Building2 size={18} /> },
  { key: "messages", label: "Messages", href: "/messages", icon: <MessageSquare size={18} /> },
  { key: "inquiries", label: "Inquiries", href: "/inquiries", icon: <Mail size={18} /> },
  { key: "saved", label: "Saved Properties", href: "/saved", icon: <Bookmark size={18} /> },
  { key: "verification", label: "Verification", href: "/verification", icon: <ShieldCheck size={18} /> },
  { key: "profile", label: "Profile", href: "/profile", icon: <UserCircle size={18} /> },
] as const;

function getActiveNav(pathname: string) {
  if (pathname.startsWith("/listings")) return "listings";
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/inquiries")) return "inquiries";
  if (pathname.startsWith("/saved")) return "saved";
  if (pathname.startsWith("/verification")) return "verification";
  if (pathname.startsWith("/profile")) return "profile";
  return "overview";
}

export function AgentSidebar({ logoutAction }: { logoutAction: () => void }) {
  const pathname = usePathname();
  const activeNav = getActiveNav(pathname);
  const { isDark, toggle } = useTheme();
  const { subscribe } = useWs();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch unread counts (messages + notifications)
  useEffect(() => {
    async function fetchUnread() {
      try {
        const token = await getToken();
        if (!token) return;
        const [msgRes, notifRes] = await Promise.all([
          fetch(`${API_BASE}/v1/conversations/unread-count`, { headers: { authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/v1/notifications/unread-count`, { headers: { authorization: `Bearer ${token}` } }),
        ]);
        if (msgRes.ok) {
          const data = await msgRes.json();
          setUnreadMessages(data.count ?? 0);
        }
        if (notifRes.ok) {
          const data = await notifRes.json();
          setUnreadNotifs(data.count ?? 0);
        }
      } catch { /* silent */ }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // Re-fetch true unread count (used by WS callback & mark-read event)
  const refreshUnreadMessages = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/v1/conversations/unread-count`, { headers: { authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.count ?? 0);
      }
    } catch { /* silent */ }
  }, []);

  // Real-time: refresh unread count when a new message arrives via WS
  useEffect(() => {
    const unsub = subscribe((data) => {
      if (data.type === "new_message") {
        refreshUnreadMessages();
      }
    });
    return unsub;
  }, [subscribe, refreshUnreadMessages]);

  // Refresh badge when user marks messages as read in a conversation
  useEffect(() => {
    const handler = () => refreshUnreadMessages();
    window.addEventListener("gd:messages-read", handler);
    return () => window.removeEventListener("gd:messages-read", handler);
  }, [refreshUnreadMessages]);

  const openNotifications = useCallback(async () => {
    if (notifOpen) { setNotifOpen(false); return; }
    if (notifLoading) return;
    setNotifOpen(true);
    setNotifLoading(true);
    try {
      const res = await apiFetch("/v1/notifications?limit=15");
      if (res && res.ok) {
        const data = await res.json();
        setNotifItems(data.items ?? []);
      }
    } catch { /* silent */ }
    setNotifLoading(false);
  }, [notifOpen, notifLoading]);

  const markRead = useCallback(async (id: string) => {
    await apiFetch(`/v1/notifications/${id}/read`, { method: "PUT" });
    setNotifItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadNotifs((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await apiFetch("/v1/notifications/read-all", { method: "PUT" });
    setNotifItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifs(0);
  }, []);

  const deleteNotif = useCallback(async (id: string) => {
    const item = notifItems.find((n) => n.id === id);
    await apiFetch(`/v1/notifications/${id}`, { method: "DELETE" });
    setNotifItems((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.read) setUnreadNotifs((c) => Math.max(0, c - 1));
  }, [notifItems]);

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto bg-sidebar text-sidebar-text border-r border-border flex flex-col gap-2 p-6 max-lg:static max-lg:h-auto max-lg:flex-row max-lg:flex-wrap max-lg:items-center max-lg:p-4 max-lg:gap-4">
      {/* Logo + Bell */}
      <div className="mb-6 max-lg:mb-0 max-lg:flex-1">
        <div className="flex items-center gap-2.5 px-2 mb-1">
          <Image src="/logo.png" alt="GhanaDeals" width={32} height={32} className="rounded-lg shrink-0" unoptimized />
          <div className="flex-1">
            <span className="text-sm font-bold tracking-tight"><span className="text-accent">Ghana</span><span className="text-foreground">Deals</span></span>
            <p className="text-[11px] text-muted max-lg:hidden">Seller Dashboard</p>
          </div>
          {/* Notification bell */}
          <div ref={panelRef}>
            <button
              type="button"
              onClick={openNotifications}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-text hover:bg-accent/10 hover:text-accent transition-all cursor-pointer border-none bg-transparent"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Slide-in Panel */}
      {notifOpen && (
        <div className="fixed inset-0 z-[80]" onClick={() => setNotifOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Panel */}
          <aside
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0 right-0 h-full w-[360px] max-w-[90vw] bg-panel border-l border-border shadow-2xl flex flex-col animate-slide-in-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-accent" />
                <h3 className="text-[15px] font-bold text-foreground">Notifications</h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadNotifs > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[12px] font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-panel-alt transition-colors cursor-pointer bg-transparent border-none"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0 [scrollbar-width:thin]">
              {notifLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
                </div>
              ) : notifItems.length === 0 ? (
                <div className="py-16 text-center">
                  <Bell size={32} className="mx-auto text-muted mb-3" />
                  <p className="text-sm font-medium text-muted">No notifications yet</p>
                  <p className="text-xs text-muted mt-1">We&apos;ll notify you when something happens</p>
                </div>
              ) : (
                notifItems.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-5 py-3.5 border-b border-border last:border-b-0 transition-colors ${
                      n.read ? "hover:bg-panel-alt/50" : "bg-accent/5 hover:bg-accent/10"
                    }`}
                  >
                    <div className="w-2 flex-shrink-0 pt-1.5">
                      {!n.read && <span className="block w-2 h-2 rounded-full bg-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] leading-snug ${n.read ? "font-normal" : "font-semibold"} text-foreground`}>
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="text-[12px] text-muted mt-0.5 line-clamp-2">{n.body}</div>
                      )}
                      <div className="text-[11px] text-muted mt-1">{timeAgo(n.createdAt)}</div>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0 pt-0.5">
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          className="p-1.5 rounded-md text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer bg-transparent border-none"
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotif(n.id)}
                        className="p-1.5 rounded-md text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent border-none"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .animate-slide-in-right {
              animation: slideInRight 0.2s ease-out forwards;
            }
          `}</style>
        </div>
      )}

      <p className="px-2 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted/60 max-lg:hidden">
        Navigation
      </p>
      <nav className="grid gap-0.5 max-lg:flex max-lg:flex-wrap max-lg:gap-1">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
              item.key === activeNav
                ? "bg-accent/10 text-accent font-semibold"
                : "text-sidebar-text hover:bg-accent/5 hover:text-foreground"
            }`}
          >
            {item.icon}
            {item.label}
            {item.key === "messages" && unreadMessages > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-accent text-white text-[11px] font-bold px-1.5">
                {unreadMessages}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-border max-lg:mt-0 max-lg:pt-0 max-lg:border-none">
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-accent/5 hover:text-foreground transition-all cursor-pointer"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-accent/5 hover:text-foreground transition-all cursor-pointer"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </form>
        <a
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-accent/5 hover:text-foreground transition-all mt-0.5"
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={18} />
          Public site
        </a>
      </div>
    </aside>
  );
}
