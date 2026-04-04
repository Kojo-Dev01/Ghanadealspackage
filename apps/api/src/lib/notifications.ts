import { getSupabaseAdminClient } from "./supabase.js";

export type NotificationType =
  | "inquiry_received"
  | "inquiry_status_changed"
  | "listing_approved"
  | "listing_flagged"
  | "verification_approved"
  | "verification_rejected"
  | "property_saved"
  | "welcome"
  | "system";

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

/**
 * Create one notification for a single user.
 * Fire-and-forget — callers should `.catch()` to avoid unhandled rejections.
 */
export async function createNotification(opts: CreateNotificationOptions): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await (supabase as any).from("notifications").insert({
    user_id: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? "",
    data: opts.data ?? {},
  });
}

/**
 * Create the same notification for multiple users at once.
 */
export async function createNotificationBatch(
  userIds: string[],
  opts: Omit<CreateNotificationOptions, "userId">
): Promise<void> {
  if (userIds.length === 0) return;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const rows = userIds.map((userId) => ({
    user_id: userId,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? "",
    data: opts.data ?? {},
  }));

  await (supabase as any).from("notifications").insert(rows);
}
