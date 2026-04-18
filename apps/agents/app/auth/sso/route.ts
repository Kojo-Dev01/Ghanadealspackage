import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:4000";
const SESSION_COOKIE = "gd_agent_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const rawNext = request.nextUrl.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";
  const baseUrl = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid", baseUrl));
  }

  // Exchange the one-time SSO token for a session JWT
  let sessionToken: string | null = null;

  try {
    const res = await fetch(`${API_BASE}/v1/auth/sso/exchange`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, targetApp: "agents" }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      sessionToken = data.token ?? null;
    }
  } catch {
    // Network error — fall through to login redirect
  }

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login?error=sso", baseUrl));
  }

  // Set the session cookie and redirect
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return NextResponse.redirect(new URL(next, baseUrl));
}
