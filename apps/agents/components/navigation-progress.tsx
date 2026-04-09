"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Navigation completed — pathname or search params changed
  useEffect(() => {
    setLoading(false);
    setProgress(100);
  }, [pathname, searchParams]);

  // Intercept internal link clicks to detect navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || anchor.target === "_blank") return;
      if (href === pathname) return; // same page
      setLoading(true);
      setProgress(15);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  // Gradually increase progress while loading
  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 12, 90));
    }, 400);
    return () => clearInterval(timer);
  }, [loading]);

  // Reset after completion animation
  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => setProgress(0), 400);
      return () => clearTimeout(t);
    }
  }, [progress]);

  if (progress === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: 3,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "var(--color-accent, #E63946)",
          transition: progress >= 100 ? "width 0.2s ease, opacity 0.3s ease 0.1s" : "width 0.4s ease",
          opacity: progress >= 100 ? 0 : 1,
          boxShadow: "0 0 8px var(--color-accent, #E63946)",
        }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
