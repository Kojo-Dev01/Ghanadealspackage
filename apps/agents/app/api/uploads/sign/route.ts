import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "gd_agent_session";

function getApiBaseUrl() {
  if (process.env.API_INTERNAL_URL) return process.env.API_INTERNAL_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  return "http://localhost:4000";
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  // Forward the multipart form data as-is to the Fastify API
  const formData = await request.formData();
  const body = new FormData();

  for (const [key, value] of formData.entries()) {
    if (value instanceof Blob) {
      body.append(key, value, (value as File).name);
    } else {
      body.append(key, value);
    }
  }

  const res = await fetch(`${getApiBaseUrl()}/v1/uploads/file`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
