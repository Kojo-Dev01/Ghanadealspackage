"use client";

import { useState, useCallback } from "react";
import { Menu } from "lucide-react";
import Image from "next/image";
import { AgentSidebar } from "./agent-sidebar";

export function DashboardShell({
  logoutAction,
  children,
}: {
  logoutAction: () => void;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] max-lg:grid-cols-1">
      {/* Mobile top bar */}
      <div className="hidden max-lg:flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-border sticky top-0 z-40">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-sidebar-text hover:bg-accent/10 hover:text-accent transition-all cursor-pointer border-none bg-transparent"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <Image src="/logo.png" alt="GhanaDeals" width={28} height={28} className="rounded-lg shrink-0" unoptimized />
        <span className="text-sm font-bold tracking-tight">
          <span className="text-accent">Ghana</span>
          <span className="text-foreground">Deals</span>
        </span>
      </div>

      <AgentSidebar logoutAction={logoutAction} isOpen={sidebarOpen} onClose={closeSidebar} />

      <main className="p-6 sm:p-8 grid gap-6 content-start overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
