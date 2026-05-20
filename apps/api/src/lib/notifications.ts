import { getSupabaseAdminClient } from "./supabase.js";

export type NotificationType =
  | "inquiry_received"
  | "inquiry_status_changed"
  | "message_received"
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

type ExpoPushMessage = {
  to: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default";
};

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

function isExpoPushToken(token: string): boolean {
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function getActivePushTokens(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];

  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("push_tokens")
    .select("token, user_id")
    .in("user_id", userIds)
    .eq("enabled", true);

  if (error) {
    console.error("[push] failed to fetch push tokens", error);
    return [];
  }

  const rows = (data ?? []) as Array<{ token?: unknown; user_id?: string }>;
  console.warn(`[push] fetched tokens for user IDs [${userIds.join(", ")}]:`, rows.map(r => `${r.user_id}:${r.token}`));
  
  const tokens = rows
    .map((row) => (typeof row.token === "string" ? row.token : undefined))
    .filter((token): token is string => typeof token === "string" && isExpoPushToken(token));

  console.warn(`[push] filtered to ${tokens.length} valid Expo tokens`);
  return [...new Set(tokens)];
}

async function sendExpoPushBatch(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const batches = chunk(messages, 100);
  for (const batch of batches) {
    try {
      const res = await fetch(EXPO_PUSH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[push] Expo API error", res.status, text);
      }
    } catch (err) {
      console.error("[push] request failed", err);
    }
  }
}

async function sendPushNotification(
  userIds: string[],
  opts: Omit<CreateNotificationOptions, "userId">
): Promise<void> {
  const tokens = await getActivePushTokens(userIds);
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title: opts.title,
    body: opts.body ?? "",
    data: opts.data ?? {},
    sound: "default",
  }));

  await sendExpoPushBatch(messages);
}

/**
 * Create one notification for a single user.
 * Fire-and-forget — callers should `.catch()` to avoid unhandled rejections.
 */
export async function createNotification(opts: CreateNotificationOptions): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  console.warn(`[notification] creating ${opts.type} for user ${opts.userId}`);

  await (supabase as any).from("notifications").insert({
    user_id: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? "",
    data: opts.data ?? {},
  });

  await sendPushNotification([opts.userId], {
    type: opts.type,
    title: opts.title,
    body: opts.body,
    data: opts.data,
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

  await sendPushNotification(userIds, opts);
}
