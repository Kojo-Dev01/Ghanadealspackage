"use client";

/**
 * Shared client-side API helper for the agents app.
 * Caches the JWT token for 4 minutes to avoid redundant /api/ws-token calls.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const res = await fetch("/api/ws-token", { credentials: "same-origin" });
  if (!res.ok) return null;
  const { token } = await res.json();
  cachedToken = token;
  tokenExpiresAt = Date.now() + 4 * 60 * 1000;
  return token;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const token = await getToken();
  if (!token) return null;
  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body) {
    headers["content-type"] = "application/json";
  }
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
}
