import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "gd_agent_session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "Server config error" }, { status: 500 });
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.json({
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    });
  } catch {
    return NextResponse.json({ message: "Invalid session" }, { status: 401 });
  }
}
