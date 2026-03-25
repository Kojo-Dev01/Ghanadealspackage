import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { Permission } from "@/lib/permissions-shared";

type NavKey = "overview" | "listings" | "agents" | "users" | "inquiries" | "metrics" | "settings" | "team";

type AdminShellProps = {
  activeNav: NavKey;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

type AdminRole = "super_admin" | "moderator" | "customer_service";

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

/** Which permission is needed to see each nav item */
const NAV_PERMISSION: Record<NavKey, Permission | null> = {
  overview: "stats.read",
  listings: "listings.read",
  agents: "agents.read",
  users: "users.read",
  inquiries: "inquiries.read",
  metrics: "metrics.read",
  team: "admin_users.read",
  settings: "settings.read",
};

const navItems: Array<
  | { key: NavKey; label: string; href: string; icon: ReactNode }
  | { key: NavKey; label: string; soon: true; icon: ReactNode }
> = [
  { key: "overview", label: "Overview", href: "/", icon: <LayoutDashboard size={18} /> },
  { key: "listings", label: "Listings", href: "/listings", icon: <Building2 size={18} /> },
  { key: "agents", label: "Agents", href: "/agents", icon: <UserCircle size={18} /> },
  { key: "users", label: "Users", href: "/users", icon: <Users size={18} /> },
  { key: "inquiries", label: "Inquiries", href: "/inquiries", icon: <MessageSquare size={18} /> },
  { key: "metrics", label: "Metrics", href: "/metrics", icon: <BarChart3 size={18} /> },
  { key: "team", label: "Team", href: "/team", icon: <ShieldCheck size={18} /> },
  { key: "settings", label: "Settings", href: "/settings", icon: <Settings size={18} /> },
];

export async function AdminShell({
  activeNav,
  eyebrow,
  title,
  description,
  actions,
  children,
}: AdminShellProps) {
  const cookieStore = await cookies();
  const role = (cookieStore.get("gd_admin_role")?.value ?? "customer_service") as AdminRole;
  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.customer_service;

  const visibleNavItems = navItems.filter((item) => {
    const perm = NAV_PERMISSION[item.key];
    return perm === null || permissions.has(perm);
  });

  async function logoutAction() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("gd_admin_session");
    cookieStore.delete("gd_admin_role");
    redirect("/login");
  }

  return (
    <main className="grid min-h-screen max-lg:grid-cols-1 grid-cols-[260px_1fr]">
      {/* ---- Sidebar ---- */}
      <aside className="bg-sidebar text-sidebar-text flex max-lg:flex-row max-lg:items-center max-lg:px-4 max-lg:py-3 max-lg:gap-4 max-lg:overflow-x-auto lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="max-lg:hidden px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="GhanaDeals" width={32} height={32} className="rounded-lg shrink-0" unoptimized />
            <div>
              <span className="text-sidebar-active font-bold text-[15px] tracking-tight">Ghana<span className="text-sidebar-accent">Deals</span></span>
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
                      ? "bg-white/10 text-sidebar-active"
                      : "hover:bg-white/5 hover:text-sidebar-active"
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

        <div className="max-lg:hidden mt-auto px-3 pb-5 flex flex-col gap-1">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-white/5 hover:text-sidebar-active transition-colors"
          >
            <ExternalLink size={18} />
            Public site
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-white/5 hover:text-sidebar-active transition-colors w-full cursor-pointer"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ---- Main ---- */}
      <section className="flex flex-col gap-6 p-6 lg:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-1">
              {eyebrow}
            </p>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-sm text-text-secondary mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        {children}
      </section>
    </main>
  );
}
