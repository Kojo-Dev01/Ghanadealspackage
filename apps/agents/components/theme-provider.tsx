"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type ThemeContextValue = {
  isDark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Theme is already set by blocking script in <head>; just sync local state
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      const val = next ? "dark" : "light";
      const domainMatch = window.location.hostname.match(/[^.]+\.[^.]+$/);
      const cookieDomain = domainMatch ? ";domain=." + domainMatch[0] : "";
      document.cookie = `gh-theme=${val};path=/;max-age=31536000;SameSite=Lax${cookieDomain}`;
      window.localStorage.setItem("gh-theme", val);
      if (next) {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
