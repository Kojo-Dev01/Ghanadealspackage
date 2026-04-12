import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/v1";
const SESSION_COOKIE = "gd_web_session";

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const target = new URL(`${API_BASE}/${path.join("/")}`);

  // Forward query parameters
  const { searchParams } = new URL(request.url);
  searchParams.forEach((value, key) => target.searchParams.set(key, value));

  const headers: HeadersInit = { authorization: `Bearer ${token}` };
  const ct = request.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  const init: RequestInit = { method: request.method, headers };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const res = await fetch(target.toString(), init);
  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
