"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-provider";
import { NotificationBell } from "./notification-bell";

type ExtractedHeaderProps = {
  headerScrolled: boolean;
  mobileOpen: boolean;
  onToggleMobileNav: () => void;
  onCloseMobileNav: () => void;
  onOpenLogin: (intent?: "list-property") => void;
  onOpenSignup: (intent?: "list-property") => void;
  onShowToast: (message: string, type?: "success" | "error" | "info") => void;
};

export function ExtractedHeader({
  headerScrolled,
  mobileOpen,
  onToggleMobileNav,
  onCloseMobileNav,
  onOpenLogin,
  onOpenSignup,
  onShowToast
}: ExtractedHeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, agent, loading: authLoading, logout } = useAuth();

  const onListings = pathname.startsWith("/listings") || pathname.startsWith("/property");
  const listingType = searchParams.get("listingType");
  const typeParam = searchParams.get("type");

  const buyActive = onListings && (listingType === "sale" || (!listingType && !typeParam));
  const rentActive = onListings && listingType === "rent";
  const newActive = onListings && listingType === "new";
  const commercialActive = onListings && typeParam === "Commercial";
  const landActive = onListings && typeParam === "Land";
  const agentsActive = pathname.startsWith("/agents");
  const homeActive = pathname === "/";

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem("gh-theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);

    if (nextIsDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      window.localStorage.setItem("gh-theme", "dark");
      return;
    }

    document.documentElement.removeAttribute("data-theme");
    window.localStorage.setItem("gh-theme", "light");
  };

  return (
    <>
    <header className={`site-header ${headerScrolled ? "scrolled" : ""}`} id="siteHeader">
      <div className="header-inner">
        <Link href="/" className="logo">
          <Image src="/legacy/assets/favicon.jpeg" alt="GhanaDeals Logo" width={32} height={32} style={{ objectFit: "contain", borderRadius: 4 }} />
          <span>Ghana<span>Deals</span></span>
        </Link>

        <nav className="main-nav" id="mainNav">
          <Link href="/listings?listingType=sale" className={buyActive ? "active" : undefined}>Buy</Link>
          <Link href="/listings?listingType=rent" className={rentActive ? "active" : undefined}>Rent</Link>
          <Link href="/listings?listingType=new" className={newActive ? "active" : undefined}>New Developments</Link>
          <Link href="/listings?type=Commercial" className={commercialActive ? "active" : undefined}>Commercial</Link>
          <Link href="/listings?type=Land" className={landActive ? "active" : undefined}>Land</Link>
          <Link href="/agents" className={agentsActive ? "active" : undefined}>Find Sellers</Link>
        </nav>

        <div className="header-actions">
          <button className="theme-toggle" id="themeToggle" aria-label="Toggle theme" type="button" onClick={toggleTheme}>
            <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          </button>
          
          {mounted && user && <span className="notif-bell-wrap"><NotificationBell /></span>}
          <div id="authButtons">
            {!mounted || authLoading ? (
              <>
                <button className="btn-login" type="button" style={{ visibility: "hidden" }}>Login</button>
                <button className="btn-signup" type="button" style={{ visibility: "hidden" }}>Sign Up</button>
              </>
            ) : user ? (
              <div ref={profileRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  className="btn-profile"
                  onClick={() => setProfileOpen((p) => !p)}
                >
                  <span className="btn-profile-avatar" style={{ background: agent?.color ?? "#3B82F6" }}>
                    {(user.name || user.email)[0].toUpperCase()}
                  </span>
                  <span className="btn-profile-name">{user.name || "Account"}</span>
                </button>
                {profileOpen && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--bg-dropdown)", borderRadius: 12, boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-primary)", padding: "8px 0", minWidth: 200, zIndex: 1000 }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-primary)" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{user.email}</div>
                      <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4, textTransform: "capitalize" }}>{user.role}{agent?.verified ? " ✓" : ""}</div>
                    </div>
                    {user.role === "agent" ? (
                      <a href={process.env.NEXT_PUBLIC_SELLERS_URL || "http://localhost:3002"} onClick={() => setProfileOpen(false)} style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-primary)", textDecoration: "none", transition: "background var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>Dashboard</a>
                    ) : (
                      <Link href="/account" onClick={() => setProfileOpen(false)} style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-primary)", textDecoration: "none", transition: "background var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>Dashboard</Link>
                    )}
                    <Link href="/account/saved" onClick={() => setProfileOpen(false)} style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-primary)", textDecoration: "none", transition: "background var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>Saved Properties</Link>
                    <Link href="/account/profile" onClick={() => setProfileOpen(false)} style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-primary)", textDecoration: "none", transition: "background var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>My Profile</Link>
                    <button type="button" onClick={() => { setProfileOpen(false); logout(); onShowToast("Signed out", "info"); }} style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-primary)", transition: "background var(--transition-fast)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="btn-login" type="button" onClick={() => onOpenLogin()}>Login</button>
                <button className="btn-signup" type="button" onClick={() => onOpenSignup()}>Sign Up</button>
              </>
            )}
          </div>
          <button className="btn-list-property" type="button" onClick={() => { if (user && user.role === "agent") { window.location.href = process.env.NEXT_PUBLIC_SELLERS_URL || "http://localhost:3002"; } else if (user) { window.location.href = "/sellers/register"; } else { onOpenSignup("list-property"); } }}>{user && user.role === "agent" ? "Seller Dashboard" : "List Property"}</button>
          <div className={`hamburger ${mobileOpen ? "open" : ""}`} id="hamburger" onClick={onToggleMobileNav}>
            <div className="hamburger-lines"><span /><span /><span /></div>
          </div>
        </div>
      </div>
    </header>
    <div className={`mobile-nav-overlay ${mobileOpen ? "open" : ""}`} id="mobileNavOverlay" onClick={onCloseMobileNav} />
    <div className={`mobile-nav ${mobileOpen ? "open" : ""}`} id="mobileNav">
      <Link href="/" className={homeActive ? "active" : undefined} onClick={onCloseMobileNav}>Home</Link>
      <Link href="/listings?listingType=sale" className={buyActive ? "active" : undefined} onClick={onCloseMobileNav}>Buy</Link>
      <Link href="/listings?listingType=rent" className={rentActive ? "active" : undefined} onClick={onCloseMobileNav}>Rent</Link>
      <Link href="/listings?listingType=new" className={newActive ? "active" : undefined} onClick={onCloseMobileNav}>New Developments</Link>
      <Link href="/listings?type=Commercial" className={commercialActive ? "active" : undefined} onClick={onCloseMobileNav}>Commercial</Link>
      <Link href="/listings?type=Land" className={landActive ? "active" : undefined} onClick={onCloseMobileNav}>Land</Link>
      <Link href="/agents" className={agentsActive ? "active" : undefined} onClick={onCloseMobileNav}>Find Sellers</Link>
      <div className="mobile-nav-buttons">
        {user ? (
          <>
            <div style={{ padding: "8px 0 12px", borderBottom: "1px solid var(--border-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: agent?.color ?? "#3B82F6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                {(user.name || user.email)[0].toUpperCase()}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{user.email}</div>
              </div>
            </div>
            {user.role === "agent" ? (
              <a href={process.env.NEXT_PUBLIC_SELLERS_URL || "http://localhost:3002"} onClick={onCloseMobileNav} className="mobile-nav-link">Dashboard</a>
            ) : (
              <Link href="/account" onClick={onCloseMobileNav} className="mobile-nav-link">Dashboard</Link>
            )}
            <Link href="/account/saved" onClick={onCloseMobileNav} className="mobile-nav-link">Saved Properties</Link>
            <Link href="/account/profile" onClick={onCloseMobileNav} className="mobile-nav-link">My Profile</Link>
            <button className="btn btn-outline" type="button" onClick={() => { onCloseMobileNav(); logout(); onShowToast("Signed out", "info"); }}>Sign Out</button>
          </>
        ) : (
          <>
            <button className="btn btn-outline" type="button" onClick={() => onOpenLogin()}>Login</button>
            <button className="btn btn-primary" type="button" onClick={() => onOpenSignup()}>Sign Up</button>
          </>
        )}
      </div>
    </div>
    </>
  );
}
