import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  UserCircle,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

type AgentShellProps = {
  activeNav: "overview" | "listings" | "inquiries" | "profile" | "verification";
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

const navItems = [
  { key: "overview", label: "Overview", href: "/", icon: <LayoutDashboard size={18} /> },
  { key: "listings", label: "My Listings", href: "/listings", icon: <Building2 size={18} /> },
  { key: "inquiries", label: "Inquiries", href: "/inquiries", icon: <MessageSquare size={18} /> },
  { key: "verification", label: "Verification", href: "/verification", icon: <ShieldCheck size={18} /> },
  { key: "profile", label: "Profile", href: "/profile", icon: <UserCircle size={18} /> },
] as const;

export async function AgentShell({
  activeNav,
  eyebrow,
  title,
  description,
  actions,
  children,
}: AgentShellProps) {
  async function logoutAction() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("gd_agent_session");
    redirect("/login");
  }

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] max-lg:grid-cols-1">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen overflow-y-auto bg-sidebar text-sidebar-text flex flex-col gap-2 p-6 max-lg:static max-lg:h-auto max-lg:flex-row max-lg:flex-wrap max-lg:items-center max-lg:p-4 max-lg:gap-4">
        <div className="mb-6 max-lg:mb-0">
          <div className="flex items-center gap-2.5 px-2 mb-1">
            <Image src="/logo.png" alt="GhanaDeals" width={32} height={32} className="rounded-lg shrink-0" unoptimized />
            <div>
              <span className="text-sm font-bold text-white tracking-tight">Ghana<span className="text-accent">Deals</span></span>
              <p className="text-[11px] text-sidebar-text max-lg:hidden">Seller Dashboard</p>
            </div>
          </div>
        </div>

        <p className="px-2 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500 max-lg:hidden">
          Navigation
        </p>
        <nav className="grid gap-0.5 max-lg:flex max-lg:flex-wrap max-lg:gap-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                item.key === activeNav
                  ? "bg-white/10 text-white font-semibold"
                  : "text-sidebar-text hover:bg-white/[0.06] hover:text-sidebar-active"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/[0.06] max-lg:mt-0 max-lg:pt-0 max-lg:border-none">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-white/[0.06] hover:text-sidebar-active transition-all cursor-pointer"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </form>
          <a
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-white/[0.06] hover:text-sidebar-active transition-all mt-0.5"
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={18} />
            Public site
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="p-6 sm:p-8 grid gap-6 content-start overflow-x-hidden">
        <header className="flex items-start justify-between gap-5 max-sm:flex-col">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              {eyebrow}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted max-w-xl">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}
