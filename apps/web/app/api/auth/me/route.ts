import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/v1";
const SESSION_COOKIE = "gd_web_session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(null, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    // Token expired or invalid — clear the stale cookie
    cookieStore.delete(SESSION_COOKIE);
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json(await res.json());
}
