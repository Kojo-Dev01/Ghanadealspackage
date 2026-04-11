import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient } from "../lib/supabase.js";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).transform((s) => s.trim()).optional(),
  phone: z.string().min(6).max(20).transform((s) => s.trim()).optional(),
  avatar_url: z.string().url().max(2048).optional(),
  search_preferences: z.record(z.unknown()).optional()
});

export async function registerBuyerRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Authentication required" });
    }
  });

  // GET /profile — fetch buyer profile
  app.get("/profile", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, name, email, phone, avatar_url, saved_properties, search_preferences")
      .eq("user_id", sub)
      .single();

    if (error || !data) {
      return reply.code(404).send({ message: "Profile not found" });
    }

    return data;
  });

  // PUT /profile — update buyer profile
  app.put("/profile", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid profile data", errors: parsed.error.flatten().fieldErrors });
    }

    const body = parsed.data;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.search_preferences !== undefined) updates.search_preferences = body.search_preferences;

    const { data, error } = await (supabase as any)
      .from("profiles")
      .update(updates)
      .eq("user_id", sub)
      .select("id, name, email, phone, avatar_url, saved_properties, search_preferences")
      .single();

    if (error || !data) {
      return reply.code(500).send({ message: "Failed to update profile" });
    }

    return data;
  });

  // POST /saved/:propertyId — save a property
  app.post("/saved/:propertyId", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { propertyId } = request.params as { propertyId: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    // Get current saved list
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("saved_properties")
      .eq("user_id", sub)
      .single();

    if (!profile) {
      return reply.code(404).send({ message: "Profile not found" });
    }

    const saved: string[] = profile.saved_properties ?? [];
    if (saved.includes(propertyId)) {
      return { saved_properties: saved, message: "Already saved" };
    }

    const updated = [...saved, propertyId];
    await (supabase as any)
      .from("profiles")
      .update({ saved_properties: updated, updated_at: new Date().toISOString() })
      .eq("user_id", sub);

    return { saved_properties: updated, message: "Property saved" };
  });

  // DELETE /saved/:propertyId — unsave a property
  app.delete("/saved/:propertyId", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { propertyId } = request.params as { propertyId: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("saved_properties")
      .eq("user_id", sub)
      .single();

    if (!profile) {
      return reply.code(404).send({ message: "Profile not found" });
    }

    const saved: string[] = profile.saved_properties ?? [];
    const updated = saved.filter((id) => id !== propertyId);

    await (supabase as any)
      .from("profiles")
      .update({ saved_properties: updated, updated_at: new Date().toISOString() })
      .eq("user_id", sub);

    return { saved_properties: updated, message: "Property removed" };
  });

  // GET /saved — get saved properties with details
  app.get("/saved", async (request, reply) => {
    const { sub } = request.user as { sub: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("saved_properties")
      .eq("user_id", sub)
      .single();

    if (!profile || !profile.saved_properties?.length) {
      return { items: [], total: 0 };
    }

    const { data: properties } = await (supabase as any)
      .from("properties")
      .select("id, title, listing_type, price, region, type, beds, baths, area, image, agents!inner(name, company)")
      .in("id", profile.saved_properties)
      .eq("moderation_status", "approved");

    const items = (properties ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title,
      listingType: row.listing_type,
      price: Number(row.price),
      priceFormatted: `GHS ${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(Number(row.price))}`,
      region: row.region,
      type: row.type,
      beds: row.beds,
      baths: row.baths,
      area: row.area,
      image: row.image,
      agentName: (row.agents as { name: string })?.name ?? "Unknown",
    }));

    return { items, total: items.length };
  });

  // GET /inquiries — list enquiries the buyer has sent
  app.get("/inquiries", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { page = "1", limit = "20", status } = request.query as Record<string, string>;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const from = (pageNum - 1) * limitNum;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    // Also get buyer email for matching older inquiries made before user_id was stored
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("email")
      .eq("user_id", sub)
      .single();

    const email = profile?.email as string | undefined;

    // Build query: match by user_id OR by email (for legacy inquiries)
    let query = (supabase as any)
      .from("inquiries")
      .select("*, properties!inner(id, title, image, region, type)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + limitNum - 1);

    if (email) {
      query = query.or(`user_id.eq.${sub},email.eq.${email}`);
    } else {
      query = query.eq("user_id", sub);
    }

    if (status && ["new", "read", "responded", "closed"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: inquiries, count, error } = await query;

    if (error) {
      request.log.error(error, "Failed to fetch buyer inquiries");
      return reply.code(500).send({ message: "Failed to fetch enquiries" });
    }

    return {
      items: (inquiries ?? []).map((inq: any) => ({
        id: inq.id,
        propertyId: inq.property_id,
        propertyTitle: inq.properties?.title ?? "",
        propertyImage: inq.properties?.image ?? "",
        propertyRegion: inq.properties?.region ?? "",
        propertyType: inq.properties?.type ?? "",
        name: inq.name,
        email: inq.email,
        phone: inq.phone,
        message: inq.message,
        status: inq.status,
        createdAt: inq.created_at,
      })),
      total: count ?? 0,
      page: pageNum,
      limit: limitNum,
    };
  });

  // POST /upgrade-to-seller — upgrade a buyer account to dual buyer+seller
  const upgradeSchema = z.object({
    company: z.string().max(200).transform((s) => s.trim()).optional().default(""),
    phone: z.string().max(20).transform((s) => s.trim()).optional(),
    areas: z.array(z.string().max(100)).min(1, "Select at least one region").max(20),
  });

  app.post("/upgrade-to-seller", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const parsed = upgradeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    // Check if already an agent
    const { data: existing } = await (supabase as any)
      .from("agents")
      .select("id")
      .eq("user_id", sub)
      .single();

    if (existing) {
      return reply.code(409).send({ message: "Account already has seller access" });
    }

    // Get buyer profile for name/email/phone
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("name, email, phone")
      .eq("user_id", sub)
      .single();

    if (!profile) {
      return reply.code(404).send({ message: "Profile not found" });
    }

    const body = parsed.data;

    // Create agents row
    const { data: agent, error: agentError } = await (supabase as any)
      .from("agents")
      .insert({
        user_id: sub,
        name: profile.name,
        email: profile.email,
        company: body.company,
        phone: body.phone || profile.phone,
        areas: body.areas,
      })
      .select("id, name, company, phone, verified, rating, areas, years, color")
      .single();

    if (agentError) {
      request.log.error(agentError, "Failed to create agent record during upgrade");
      return reply.code(500).send({ message: "Failed to upgrade account" });
    }

    // Update Supabase auth user_metadata role to "agent"
    const { error: metaError } = await supabase.auth.admin.updateUserById(sub, {
      user_metadata: { role: "agent" },
    });

    if (metaError) {
      request.log.error(metaError, "Failed to update user role metadata");
      // Rollback agent row
      await (supabase as any).from("agents").delete().eq("user_id", sub);
      return reply.code(500).send({ message: "Failed to upgrade account" });
    }

    // Re-sign JWT with new role
    const token = app.jwt.sign(
      { sub, email: profile.email, role: "agent", name: profile.name },
      { expiresIn: "7d" },
    );

    return {
      token,
      user: { id: sub, email: profile.email, name: profile.name, role: "agent" },
      agent,
    };
  });
}
