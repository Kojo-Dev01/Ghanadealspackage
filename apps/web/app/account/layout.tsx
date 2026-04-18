"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../components/auth-provider";
import { AccountSidebar } from "../../components/account-sidebar";
import { WsProvider } from "../../components/ws-provider";
import { navigateToSellerDashboard } from "../../lib/sso";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      window.localStorage.setItem("gh-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      window.localStorage.setItem("gh-theme", "light");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 8,
        border: "1px solid var(--border-primary)",
        background: "var(--bg-secondary)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
    >
      {isDark ? (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      ) : (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      )}
    </button>
  );
}

function DashboardHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user } = useAuth();
  const isSeller = user?.role === "agent";

  return (
    <header className="acct-header">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={onOpenSidebar}
          className="acct-hamburger"
          aria-label="Open menu"
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          My Dashboard
        </h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ThemeToggle />
        {isSeller ? (
          <button
            type="button"
            onClick={() => navigateToSellerDashboard()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 8,
              background: "var(--red)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              textDecoration: "none",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            Seller Dashboard
          </button>
        ) : (
          <Link
            href="/sellers/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 8,
              background: "var(--red)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            List Your Property
          </Link>
        )}
      </div>
    </header>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  /* Still resolving session — show spinner */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)" }}>
        <div style={{ display: "inline-block", width: 32, height: 32, border: "3px solid var(--border-primary)", borderTopColor: "var(--red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* Not logged in — redirect */
  if (!user || !["buyer", "agent"].includes(user.role)) {
    router.push("/");
    return null;
  }

  return (
    <WsProvider userId={user.id}>
      <style>{`
        .acct-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: 100vh;
        }
        .acct-sidebar-desktop { display: contents; }
        .acct-sidebar-mobile { display: none; }
        @media (max-width: 1024px) {
          .acct-grid { display: block; }
          .acct-sidebar-desktop { display: none; }
          .acct-sidebar-mobile {
            display: block;
            position: fixed;
            top: 0; left: 0; bottom: 0;
            width: 280px;
            z-index: 60;
            box-shadow: 0 0 40px rgba(0,0,0,.3);
            transform: translateX(-100%);
            transition: transform 0.2s ease-out;
          }
          .acct-sidebar-mobile.open {
            transform: translateX(0);
          }
          .acct-sidebar-mobile > aside {
            position: static !important;
            height: 100% !important;
            width: 100% !important;
          }
        }
        .acct-main {
          display: flex; flex-direction: column; background: var(--bg-secondary);
          min-height: 100vh;
        }
        .acct-content {
          padding: 32px 40px; overflow-x: hidden; flex: 1;
        }
        @media (max-width: 640px) {
          .acct-content { padding: 20px 16px; }
        }
        .acct-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 40px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-primary);
        }
        @media (max-width: 640px) {
          .acct-header { padding: 12px 16px; }
          .acct-header .acct-cta-btn { display: none; }
        }
        .acct-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 8px;
          border: none;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .acct-hamburger:hover { background: var(--bg-card-hover); color: var(--text-primary); }
        @media (max-width: 1024px) {
          .acct-hamburger { display: flex; }
        }
        .acct-sidebar-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 55;
          background: rgba(0,0,0,0.4);
        }
        @media (max-width: 1024px) {
          .acct-sidebar-backdrop.open { display: block; }
          .acct-sidebar-close { display: flex !important; }
        }
      `}</style>

      {/* Mobile sidebar — outside the grid so it never affects document flow */}
      <div
        className={`acct-sidebar-backdrop ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />
      <div className={`acct-sidebar-mobile ${sidebarOpen ? "open" : ""}`}>
        <AccountSidebar onClose={closeSidebar} />
      </div>

      <div className="acct-grid">
        {/* Desktop sidebar — inside grid, hidden on mobile via display:none */}
        <div className="acct-sidebar-desktop">
          <AccountSidebar />
        </div>
        <div className="acct-main">
          <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="acct-content">
            {children}
          </main>
        </div>
      </div>
    </WsProvider>
  );
}
