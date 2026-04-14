"use server";

import { updateAdminMe } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function updateAdminProfile(
  name: string
): Promise<{ ok: boolean; message: string }> {
  const res = await updateAdminMe({ name });
  if (res.ok) {
    revalidatePath("/settings");
    return { ok: true, message: "Profile updated" };
  }
  return { ok: false, message: res.message };
}

export async function updateAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  const res = await updateAdminMe({ currentPassword, newPassword });
  if (res.ok) return { ok: true, message: "Password updated successfully" };
  return { ok: false, message: res.message };
}
