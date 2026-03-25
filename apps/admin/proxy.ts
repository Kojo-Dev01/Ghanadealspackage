import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "gd_admin_session";

async function hasValidSession(token?: string) {
  if (!token) return false;

  const secret = process.env.JWT_SECRET;
  if (!secret) return true; // fall through to server-side checks

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    const role = String(payload.role ?? "");
    const allowedRoles = (process.env.ADMIN_ALLOWED_ROLES ?? "admin,moderator")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    return allowedRoles.includes(role);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const hasSession = await hasValidSession(token);

  if (pathname.startsWith("/login")) {
    if (hasSession) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
