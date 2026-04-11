import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";
const SESSION_COOKIE = "gd_web_session";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const body = new FormData();

  for (const [key, value] of formData.entries()) {
    if (value instanceof Blob) {
      body.append(key, value, (value as File).name);
    } else {
      body.append(key, value);
    }
  }

  const res = await fetch(`${API_BASE}/uploads/file`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
