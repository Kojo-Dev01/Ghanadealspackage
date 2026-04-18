import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/v1";
const SESSION_COOKIE = "gd_web_session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(`${API_BASE}/auth/sso/generate`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: data.message ?? "Failed to generate SSO token" },
        { status: res.status },
      );
    }

    return NextResponse.json({ ok: true, ssoToken: data.token, expiresIn: data.expiresIn });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Service unavailable" },
      { status: 503 },
    );
  }
}
