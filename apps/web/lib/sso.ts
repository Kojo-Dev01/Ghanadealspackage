"use client";

const SELLERS_URL =
  process.env.NEXT_PUBLIC_SELLERS_URL || "http://localhost:3002";

/**
 * Navigate to the seller dashboard using SSO.
 * Generates a one-time token and redirects with it appended.
 * Falls back to direct navigation if SSO generation fails.
 */
export async function navigateToSellerDashboard(path = "/") {
  try {
    const res = await fetch("/api/auth/sso", {
      method: "POST",
      credentials: "same-origin",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ssoToken) {
        const target = new URL("/auth/sso", SELLERS_URL);
        target.searchParams.set("token", data.ssoToken);
        if (path !== "/") target.searchParams.set("next", path);
        window.location.href = target.toString();
        return;
      }
    }
  } catch {
    // SSO failed — fall back to direct link (user will need to log in manually)
  }

  window.location.href = SELLERS_URL;
}
