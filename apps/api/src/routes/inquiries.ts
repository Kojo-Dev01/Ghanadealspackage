import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient } from "../lib/supabase.js";
import { notifyAgentNewInquiry } from "../lib/email.js";
import { createNotification } from "../lib/notifications.js";

const inquirySchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(200).transform((s) => s.trim()),
  email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
  phone: z.string().max(30).optional().default("").transform((s) => s.trim()),
  message: z.string().min(1).max(5000).transform((s) => s.trim())
});

export async function registerInquiryRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const parsed = inquirySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid inquiry data", errors: parsed.error.flatten().fieldErrors });
    }

    const body = parsed.data;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    // Verify property exists and is approved, fetch agent info for notification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: property } = await (supabase as any)
      .from("properties")
      .select("id, title, agent_id, agents!inner(id, user_id, name, email)")
      .eq("id", body.propertyId)
      .eq("moderation_status", "approved")
      .single();

    if (!property) {
      return reply.code(404).send({ message: "Property not found" });
    }

    const prop = property as { id: string; title: string; agent_id: string; agents: { id: string; user_id: string; name: string; email: string } };
    const agentUserId = prop.agents?.user_id ?? null;

    // Fallback profile lookup to keep notifications/emails working when agent.email/name is stale.
    let profileName: string | null = null;
    let profileEmail: string | null = null;
    if (agentUserId) {
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("name, email")
        .eq("user_id", agentUserId)
        .single();
      profileName = profile?.name ?? null;
      profileEmail = profile?.email ?? null;
    }

    const agentName = (prop.agents?.name || profileName || "Agent").trim();
    const agentEmail = (prop.agents?.email || profileEmail || "").trim();

    // If the caller is logged in, capture their user_id for "my enquiries"
    let userId: string | null = null;
    try {
      await request.jwtVerify();
      userId = (request.user as { sub: string }).sub ?? null;
    } catch {
      // anonymous inquiry — that's fine
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertPayload: Record<string, unknown> = {
      property_id: body.propertyId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
    };
    if (userId) insertPayload.user_id = userId;

    const { data, error } = await (supabase.from("inquiries") as any)
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      app.log.error(error, "Failed to create inquiry");
      return reply.code(500).send({ message: "Failed to submit inquiry" });
    }

    // Send email notification to agent (fire-and-forget)
    if (agentEmail) {
      notifyAgentNewInquiry(
        { email: agentEmail, name: agentName },
        { name: body.name, email: body.email, phone: body.phone, message: body.message },
        { title: prop.title, id: prop.id }
      ).catch((err) => app.log.error(err, "Failed to send inquiry email"));
    } else {
      app.log.warn({ propertyId: prop.id, agentUserId }, "Skipping inquiry email: agent email is missing");
    }

    // In-app notification for agent
    if (agentUserId) {
      createNotification({
        userId: agentUserId,
        type: "inquiry_received",
        title: "New Inquiry",
        body: `${body.name} inquired about "${prop.title}"`,
        data: { propertyId: prop.id, inquiryId: (data as { id: string }).id },
      }).catch((err) => app.log.error(err, "Failed to create inquiry notification"));
    } else {
      app.log.warn({ propertyId: prop.id, agentId: prop.agent_id }, "Skipping inquiry notification: agent user_id is missing");
    }

    return reply.code(201).send({
      id: (data as { id: string }).id,
      message: "Inquiry submitted successfully"
    });
  });
}
