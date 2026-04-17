import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/v1";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: body.userId, verificationToken: body.verificationToken }),
  });

  const json = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, message: json.message ?? "Failed to resend code" },
      { status: res.status },
    );
  }

  return NextResponse.json({ ok: true, message: json.message, email: json.email, verificationToken: json.verificationToken });
}
