"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  UserCircle,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { key: "overview", label: "Overview", href: "/", icon: <LayoutDashboard size={18} /> },
  { key: "listings", label: "My Listings", href: "/listings", icon: <Building2 size={18} /> },
  { key: "inquiries", label: "Inquiries", href: "/inquiries", icon: <MessageSquare size={18} /> },
  { key: "verification", label: "Verification", href: "/verification", icon: <ShieldCheck size={18} /> },
  { key: "profile", label: "Profile", href: "/profile", icon: <UserCircle size={18} /> },
] as const;

function getActiveNav(pathname: string) {
  if (pathname.startsWith("/listings")) return "listings";
  if (pathname.startsWith("/inquiries")) return "inquiries";
  if (pathname.startsWith("/verification")) return "verification";
  if (pathname.startsWith("/profile")) return "profile";
  return "overview";
}

export function AgentSidebar({ logoutAction }: { logoutAction: () => void }) {
  const pathname = usePathname();
  const activeNav = getActiveNav(pathname);

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto bg-sidebar text-sidebar-text border-r border-border flex flex-col gap-2 p-6 max-lg:static max-lg:h-auto max-lg:flex-row max-lg:flex-wrap max-lg:items-center max-lg:p-4 max-lg:gap-4">
      <div className="mb-6 max-lg:mb-0">
        <div className="flex items-center gap-2.5 px-2 mb-1">
          <Image src="/logo.png" alt="GhanaDeals" width={32} height={32} className="rounded-lg shrink-0" unoptimized />
          <div>
            <span className="text-sm font-bold tracking-tight"><span className="text-accent">Ghana</span><span className="text-foreground">Deals</span></span>
            <p className="text-[11px] text-muted max-lg:hidden">Seller Dashboard</p>
          </div>
        </div>
      </div>

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
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-border max-lg:mt-0 max-lg:pt-0 max-lg:border-none">
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
