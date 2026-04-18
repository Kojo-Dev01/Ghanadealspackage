import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/v1";
const SESSION_COOKIE = "gd_web_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days (matches JWT expiry)

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  const json = await res.json();

  // Unverified user — API sends 403 with needsVerification
  if (res.status === 403 && json.needsVerification) {
    return NextResponse.json({
      ok: false,
      needsVerification: true,
      userId: json.userId,
      email: json.email,
      name: json.name,
      role: json.role,
      verificationToken: json.verificationToken,
      message: json.message,
    }, { status: 403 });
  }

  // Suspended user
  if (res.status === 403 && json.suspended) {
    return NextResponse.json(
      { ok: false, suspended: true, message: json.message },
      { status: 403 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, message: json.message ?? "Login failed" },
      { status: res.status },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, json.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return NextResponse.json({
    ok: true,
    data: { user: json.user, agent: json.agent, profile: json.profile },
  });
}
