import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/v1";
const SESSION_COOKIE = "gd_web_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
      accountType: body.accountType,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, message: json.message ?? "Signup failed" },
      { status: res.status },
    );
  }

  // If OTP verification is required, pass through without setting cookie
  if (json.needsVerification) {
    return NextResponse.json({
      ok: true,
      needsVerification: true,
      userId: json.userId,
      email: json.email,
      name: json.name,
      role: json.role,
      verificationToken: json.verificationToken,
    });
  }

  // Legacy path: if token is returned directly (shouldn't happen now)
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
