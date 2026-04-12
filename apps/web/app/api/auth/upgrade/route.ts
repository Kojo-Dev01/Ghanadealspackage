import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/v1";
const SESSION_COOKIE = "gd_web_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const res = await fetch(`${API_BASE}/buyer/upgrade-to-seller`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, message: json.message ?? "Upgrade failed" },
      { status: res.status },
    );
  }

  // Set new JWT cookie with updated role
  cookieStore.set(SESSION_COOKIE, json.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return NextResponse.json({
    ok: true,
    data: { user: json.user, agent: json.agent },
  });
}
