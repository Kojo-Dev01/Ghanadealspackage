import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/v1";
const SESSION_COOKIE = "gd_web_session";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const ct = request.headers.get("content-type");
  if (!ct || !ct.includes("multipart/form-data")) {
    return NextResponse.json({ message: "Multipart required" }, { status: 400 });
  }

  // Stream the raw body to the API
  const res = await fetch(`${API_BASE}/uploads/chat-image`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": ct,
    },
    body: request.body,
    // @ts-expect-error - duplex needed for request streaming
    duplex: "half",
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
