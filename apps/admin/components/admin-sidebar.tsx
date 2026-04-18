"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  MessagesSquare,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { FormButton } from "@/components/form-button";
import { useTheme } from "@/components/theme-provider";
import type { Permission } from "@/lib/permissions-shared";

type AdminRole = "super_admin" | "moderator" | "customer_service";

type NavKey = "overview" | "listings" | "agents" | "users" | "chats" | "metrics" | "settings" | "team" | "system";

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<Permission>> = {
  super_admin: new Set<Permission>([
    "stats.read", "metrics.read", "listings.read", "listings.moderate", "listings.featured",
    "agents.read", "agents.verify", "users.read", "inquiries.read", "inquiries.update",
    "admin_users.read", "admin_users.create", "admin_users.update", "admin_users.deactivate",
    "settings.read",
  ]),
  moderator: new Set<Permission>([
    "stats.read", "metrics.read", "listings.read", "listings.moderate", "listings.featured",
    "agents.read", "agents.verify",
  ]),
  customer_service: new Set<Permission>([
    "stats.read", "metrics.read", "users.read", "inquiries.read", "inquiries.update",
  ]),
};

const NAV_PERMISSION: Record<NavKey, Permission | null> = {
  overview: "stats.read",
  listings: "listings.read",
  agents: "agents.read",
  users: "users.read",
  chats: "inquiries.read",
  metrics: "metrics.read",
  team: "admin_users.read",
  settings: null,
  system: "settings.read",
};

const navItems: Array<
  | { key: NavKey; label: string; href: string; icon: ReactNode }
  | { key: NavKey; label: string; soon: true; icon: ReactNode }
> = [
  { key: "overview", label: "Overview", href: "/", icon: <LayoutDashboard size={18} /> },
  { key: "listings", label: "Listings", href: "/listings", icon: <Building2 size={18} /> },
  { key: "agents", label: "Sellers", href: "/agents", icon: <UserCircle size={18} /> },
  { key: "users", label: "Users", href: "/users", icon: <Users size={18} /> },
  { key: "chats", label: "Chats", href: "/chats", icon: <MessagesSquare size={18} /> },
  { key: "metrics", label: "Metrics", href: "/metrics", icon: <BarChart3 size={18} /> },
  { key: "team", label: "Team", href: "/team", icon: <ShieldCheck size={18} /> },
  { key: "system", label: "System", href: "/system", icon: <Monitor size={18} /> },
  { key: "settings", label: "Settings", href: "/settings", icon: <Settings size={18} /> },
];

function getActiveNav(pathname: string): NavKey {
  if (pathname.startsWith("/listings")) return "listings";
  if (pathname.startsWith("/agents")) return "agents";
  if (pathname.startsWith("/users")) return "users";
  if (pathname.startsWith("/chats")) return "chats";
  if (pathname.startsWith("/metrics")) return "metrics";
  if (pathname.startsWith("/team")) return "team";
  if (pathname.startsWith("/system")) return "system";
  if (pathname.startsWith("/settings")) return "settings";
  return "overview";
}

export function AdminSidebar({
  role,
  logoutAction,
}: {
  role: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const activeNav = getActiveNav(pathname);
  const permissions = ROLE_PERMISSIONS[role as AdminRole] ?? ROLE_PERMISSIONS.customer_service;
  const { isDark, toggle } = useTheme();

  const visibleNavItems = navItems.filter((item) => {
    const perm = NAV_PERMISSION[item.key];
    return perm === null || permissions.has(perm);
  });

  return (
    <aside className="bg-sidebar text-sidebar-text border-r border-border flex max-lg:flex-row max-lg:items-center max-lg:px-4 max-lg:py-3 max-lg:gap-4 max-lg:overflow-x-auto lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="max-lg:hidden px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="GhanaDeals" width={32} height={32} className="rounded-lg shrink-0" unoptimized />
          <div>
            <span className="font-bold text-[15px] tracking-tight"><span className="text-accent">Ghana</span><span className="text-sidebar-active">Deals</span></span>
            <p className="text-[11px] text-sidebar-text/60">Marketplace Admin</p>
          </div>
        </div>
      </div>

      <p className="max-lg:hidden text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/40 px-5 mt-4 mb-2">
        Navigation
      </p>

      <nav className="flex max-lg:flex-row max-lg:gap-1 lg:flex-col lg:gap-0.5 lg:px-3">
        {visibleNavItems.map((item) => {
          if ("href" in item) {
            const active = item.key === activeNav;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-accent/5 hover:text-sidebar-active"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          }
          return (
            <div
              key={item.key}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm opacity-40 cursor-default"
            >
              <span className="flex items-center gap-2.5">
                {item.icon}
                {item.label}
              </span>
              <small className="text-[10px] uppercase tracking-wider">Soon</small>
            </div>
          );
        })}
      </nav>

      <div className="max-lg:hidden mt-auto pt-4 border-t border-border px-3 pb-5 flex flex-col gap-1">
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-accent/5 hover:text-sidebar-active transition-all cursor-pointer"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <a
          href={process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-accent/5 hover:text-sidebar-active transition-all"
        >
          <ExternalLink size={18} />
          Public site
        </a>
        <form action={logoutAction}>
          <FormButton
            type="submit"
            pendingText="Signing out…"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-accent/5 hover:text-sidebar-active transition-all w-full cursor-pointer"
          >
            <LogOut size={18} />
            Sign out
          </FormButton>
        </form>
      </div>
    </aside>
  );
}
