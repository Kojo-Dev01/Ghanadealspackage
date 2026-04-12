import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "gd_web_session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ token });
}
