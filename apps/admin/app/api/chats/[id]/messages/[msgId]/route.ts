import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const apiBase = process.env.API_URL ?? "http://localhost:4000";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("gd_admin_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, msgId } = await params;

  const res = await fetch(
    `${apiBase}/v1/admin/conversations/${encodeURIComponent(id)}/messages/${encodeURIComponent(msgId)}`,
    {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed" }, { status: res.status });
  }

  return NextResponse.json(await res.json());
}
