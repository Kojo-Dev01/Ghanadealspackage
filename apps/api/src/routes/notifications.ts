import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient } from "../lib/supabase.js";

export async function registerNotificationRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Authentication required" });
    }
  });

  // ── GET / — list notifications (paginated) ──────────────────
  app.get("/", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { page, limit, unread } = request.query as { page?: string; limit?: string; unread?: string };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const from = (pageNum - 1) * limitNum;

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Service unavailable" });

    let query = (supabase as any)
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", sub)
      .order("created_at", { ascending: false })
      .range(from, from + limitNum - 1);

    if (unread === "true") {
      query = query.eq("read", false);
    }

    const { data, count, error } = await query;

    if (error) {
      request.log.error(error, "Failed to fetch notifications");
      return reply.code(500).send({ message: "Failed to fetch notifications" });
    }

    return {
      items: (data ?? []).map(formatNotification),
      total: count ?? 0,
      page: pageNum,
      limit: limitNum,
    };
  });

  // ── GET /unread-count — quick badge count ───────────────────
  app.get("/unread-count", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Service unavailable" });

    const { count, error } = await (supabase as any)
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", sub)
      .eq("read", false);

    if (error) {
      request.log.error(error, "Failed to count unread notifications");
      return reply.code(500).send({ message: "Failed to count notifications" });
    }

    return { count: count ?? 0 };
  });

  // ── PUT /:id/read — mark single notification as read ────────
  app.put("/:id/read", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Service unavailable" });

    const { error, count } = await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", sub);

    if (error) {
      request.log.error(error, "Failed to mark notification read");
      return reply.code(500).send({ message: "Failed to update" });
    }

    return { message: "Notification marked as read" };
  });

  // ── PUT /read-all — mark all notifications as read ──────────
  app.put("/read-all", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Service unavailable" });

    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("user_id", sub)
      .eq("read", false);

    if (error) {
      request.log.error(error, "Failed to mark all notifications read");
      return reply.code(500).send({ message: "Failed to update" });
    }

    return { message: "All notifications marked as read" };
  });

  // ── DELETE /:id — delete a single notification ──────────────
  app.delete("/:id", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Service unavailable" });

    const { error } = await (supabase as any)
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", sub);

    if (error) {
      request.log.error(error, "Failed to delete notification");
      return reply.code(500).send({ message: "Failed to delete" });
    }

    return { message: "Notification deleted" };
  });

  // ── GET /preferences — get notification preferences ─────────
  app.get("/preferences", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Service unavailable" });

    const { data, error } = await (supabase as any)
      .from("notification_preferences")
      .select("*")
      .eq("user_id", sub)
      .single();

    if (error || !data) {
      // Return defaults if no preferences row exists yet
      return {
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        mutedTypes: [],
      };
    }

    return {
      emailEnabled: data.email_enabled,
      pushEnabled: data.push_enabled,
      inAppEnabled: data.in_app_enabled,
      mutedTypes: data.muted_types ?? [],
    };
  });

  // ── PUT /preferences — update notification preferences ──────
  const preferencesSchema = z.object({
    emailEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    inAppEnabled: z.boolean().optional(),
    mutedTypes: z.array(z.string()).max(20).optional(),
  });

  const pushTokenSchema = z.object({
    token: z.string().min(10).max(300),
    platform: z.enum(["ios", "android", "web"]).optional(),
    deviceId: z.string().max(200).optional(),
  });

  // ── POST /push-token — register Expo push token ─────────────
  app.post("/push-token", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const parsed = pushTokenSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid push token payload", errors: parsed.error.flatten().fieldErrors });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Service unavailable" });

    const { token, platform, deviceId } = parsed.data;

    const row: Record<string, unknown> = {
      user_id: sub,
      token,
      platform: platform ?? null,
      device_id: deviceId ?? null,
      enabled: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
      .from("push_tokens")
      .upsert(row, { onConflict: "user_id,token" });

    if (error) {
      request.log.error(error, "Failed to register push token");
      return reply.code(500).send({ message: "Failed to register push token" });
    }

    return { message: "Push token registered" };
  });

  app.put("/preferences", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const parsed = preferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid preferences", errors: parsed.error.flatten().fieldErrors });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Service unavailable" });

    const d = parsed.data;
    const row: Record<string, unknown> = {
      user_id: sub,
      updated_at: new Date().toISOString(),
    };
    if (d.emailEnabled !== undefined) row.email_enabled = d.emailEnabled;
    if (d.pushEnabled !== undefined) row.push_enabled = d.pushEnabled;
    if (d.inAppEnabled !== undefined) row.in_app_enabled = d.inAppEnabled;
    if (d.mutedTypes !== undefined) row.muted_types = d.mutedTypes;

    const { error } = await (supabase as any)
      .from("notification_preferences")
      .upsert(row, { onConflict: "user_id" });

    if (error) {
      request.log.error(error, "Failed to update notification preferences");
      return reply.code(500).send({ message: "Failed to update preferences" });
    }

    return { message: "Preferences updated" };
  });
}

function formatNotification(row: any) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data,
    read: row.read,
    createdAt: row.created_at,
  };
}
