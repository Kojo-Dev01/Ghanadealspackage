import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient } from "../lib/supabase.js";
import { notifyAgentNewInquiry } from "../lib/email.js";

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
      .select("id, title, agent_id, agents!inner(id, name, email)")
      .eq("id", body.propertyId)
      .eq("moderation_status", "approved")
      .single();

    if (!property) {
      return reply.code(404).send({ message: "Property not found" });
    }

    const prop = property as { id: string; title: string; agent_id: string; agents: { id: string; name: string; email: string } };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("inquiries") as any).insert({
      property_id: body.propertyId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message
    }).select("id").single();

    if (error) {
      app.log.error(error, "Failed to create inquiry");
      return reply.code(500).send({ message: "Failed to submit inquiry" });
    }

    // Send email notification to agent (fire-and-forget)
    if (prop.agents?.email) {
      notifyAgentNewInquiry(
        { email: prop.agents.email, name: prop.agents.name },
        { name: body.name, email: body.email, phone: body.phone, message: body.message },
        { title: prop.title, id: prop.id }
      ).catch((err) => app.log.error(err, "Failed to send inquiry email"));
    }

    return reply.code(201).send({
      id: (data as { id: string }).id,
      message: "Inquiry submitted successfully"
    });
  });
}
