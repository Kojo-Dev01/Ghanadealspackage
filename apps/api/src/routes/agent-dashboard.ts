import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient } from "../lib/supabase.js";

type JwtPayload = { sub: string; email: string; role: string; name: string };

async function requireAgent(request: any, reply: any): Promise<{ payload: JwtPayload; agentId: string } | null> {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ message: "Not authenticated" });
    return null;
  }

  const payload = request.user as JwtPayload;
  if (payload.role !== "agent") {
    reply.code(403).send({ message: "Agent access required" });
    return null;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    reply.code(503).send({ message: "Service unavailable" });
    return null;
  }

  const { data: agent } = await (supabase as any)
    .from("agents")
    .select("id")
    .eq("user_id", payload.sub)
    .single();

  if (!agent) {
    reply.code(404).send({ message: "Agent profile not found" });
    return null;
  }

  return { payload, agentId: agent.id };
}

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  color: z.string().max(20).optional(),
  areas: z.array(z.string().max(100)).max(20).optional(),
  years: z.number().int().min(0).max(99).optional()
});

const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  listingType: z.enum(["sale", "rent", "new"]),
  price: z.number().min(0),
  priceLabel: z.string().max(50).optional(),
  region: z.string().min(1).max(100),
  location: z.string().max(200).optional(),
  type: z.string().min(1).max(50),
  beds: z.number().int().min(0).max(99).optional(),
  baths: z.number().int().min(0).max(99).optional(),
  area: z.number().min(0).optional(),
  description: z.string().max(5000).optional(),
  image: z.string().max(500).optional(),
  imageLg: z.string().max(500).optional(),
  gallery: z.array(z.string().max(500)).max(20).optional(),
  amenities: z.array(z.string().max(100)).max(50).optional(),
  furnishing: z.string().max(50).optional(),
  parking: z.string().max(50).optional(),
});

const updateListingSchema = createListingSchema.partial();

export async function registerAgentDashboardRoutes(app: FastifyInstance) {
  // ── GET /profile ────────────────────────────────────────────
  app.get("/profile", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const supabase = getSupabaseAdminClient()!;
    const { data: agent, error } = await (supabase as any)
      .from("agents")
      .select("*")
      .eq("id", auth.agentId)
      .single();

    if (error || !agent) {
      return reply.code(404).send({ message: "Agent not found" });
    }

    return agent;
  });

  // ── PUT /profile ────────────────────────────────────────────
  app.put("/profile", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const body = updateProfileSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid profile data", errors: body.error.flatten().fieldErrors });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.data.name !== undefined) updates.name = body.data.name;
    if (body.data.company !== undefined) updates.company = body.data.company;
    if (body.data.phone !== undefined) updates.phone = body.data.phone;
    if (body.data.color !== undefined) updates.color = body.data.color;
    if (body.data.areas !== undefined) updates.areas = body.data.areas;
    if (body.data.years !== undefined) updates.years = body.data.years;

    const supabase = getSupabaseAdminClient()!;
    const { data: agent, error } = await (supabase as any)
      .from("agents")
      .update(updates)
      .eq("id", auth.agentId)
      .select("*")
      .single();

    if (error) {
      request.log.error(error, "Failed to update agent profile");
      return reply.code(500).send({ message: "Failed to update profile" });
    }

    return agent;
  });

  // ── GET /listings — agent's own properties ──────────────────
  app.get("/listings", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const { status, page, limit } = request.query as { status?: string; page?: string; limit?: string };
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
    const from = (pageNum - 1) * limitNum;

    const supabase = getSupabaseAdminClient()!;
    let query = (supabase as any)
      .from("properties")
      .select("*", { count: "exact" })
      .eq("agent_id", auth.agentId)
      .order("created_at", { ascending: false })
      .range(from, from + limitNum - 1);

    if (status && ["pending", "approved", "flagged", "archived"].includes(status)) {
      query = query.eq("moderation_status", status);
    }

    const { data: properties, count, error } = await query;

    if (error) {
      request.log.error(error, "Failed to fetch agent listings");
      return reply.code(500).send({ message: "Failed to fetch listings" });
    }

    return {
      items: (properties ?? []).map(formatProperty),
      total: count ?? 0,
      page: pageNum,
      limit: limitNum
    };
  });

  // ── GET /inquiries — inquiries on agent's properties ────────
  app.get("/inquiries", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const { status, page, limit } = request.query as { status?: string; page?: string; limit?: string };
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const from = (pageNum - 1) * limitNum;

    const supabase = getSupabaseAdminClient()!;

    // Get agent's property IDs first
    const { data: propRows } = await (supabase as any)
      .from("properties")
      .select("id")
      .eq("agent_id", auth.agentId);

    const propertyIds = (propRows ?? []).map((p: any) => p.id);

    if (propertyIds.length === 0) {
      return { items: [], total: 0, page: pageNum, limit: limitNum };
    }

    let query = (supabase as any)
      .from("inquiries")
      .select("*, properties!inner(id, title, image)", { count: "exact" })
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })
      .range(from, from + limitNum - 1);

    if (status && ["new", "read", "responded", "closed"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: inquiries, count, error } = await query;

    if (error) {
      request.log.error(error, "Failed to fetch agent inquiries");
      return reply.code(500).send({ message: "Failed to fetch inquiries" });
    }

    return {
      items: (inquiries ?? []).map((inq: any) => ({
        id: inq.id,
        propertyId: inq.property_id,
        propertyTitle: inq.properties?.title ?? "",
        propertyImage: inq.properties?.image ?? "",
        name: inq.name,
        email: inq.email,
        phone: inq.phone,
        message: inq.message,
        status: inq.status,
        createdAt: inq.created_at
      })),
      total: count ?? 0,
      page: pageNum,
      limit: limitNum
    };
  });

  // ── GET /stats — overview numbers ───────────────────────────
  app.get("/stats", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const supabase = getSupabaseAdminClient()!;

    const [propertiesResult, inquiriesResult] = await Promise.all([
      (supabase as any)
        .from("properties")
        .select("moderation_status", { count: "exact" })
        .eq("agent_id", auth.agentId),
      (supabase as any)
        .from("inquiries")
        .select("status, property_id, properties!inner(agent_id)", { count: "exact" })
        .eq("properties.agent_id", auth.agentId)
    ]);

    const properties = propertiesResult.data ?? [];
    const totalListings = propertiesResult.count ?? properties.length;
    const approvedListings = properties.filter((p: any) => p.moderation_status === "approved").length;
    const pendingListings = properties.filter((p: any) => p.moderation_status === "pending").length;

    const inquiries = inquiriesResult.data ?? [];
    const totalInquiries = inquiriesResult.count ?? inquiries.length;
    const newInquiries = inquiries.filter((i: any) => i.status === "new").length;

    return {
      totalListings,
      approvedListings,
      pendingListings,
      totalInquiries,
      newInquiries
    };
  });

  // ── POST /listings — create a new listing ───────────────────
  app.post("/listings", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const body = createListingSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid listing data", errors: body.error.flatten().fieldErrors });
    }

    const supabase = getSupabaseAdminClient()!;
    const d = body.data;

    const ref = `GD-${Date.now().toString(36).toUpperCase()}`;

    const { data: created, error } = await (supabase as any)
      .from("properties")
      .insert({
        agent_id: auth.agentId,
        title: d.title,
        listing_type: d.listingType,
        price: d.price,
        price_label: d.priceLabel ?? null,
        region: d.region,
        location: d.location ?? "",
        type: d.type,
        beds: d.beds ?? 0,
        baths: d.baths ?? 0,
        area: d.area ?? 0,
        description: d.description ?? "",
        image: d.image ?? "",
        image_lg: d.imageLg ?? null,
        gallery: d.gallery ?? [],
        amenities: d.amenities ?? [],
        furnishing: d.furnishing ?? "",
        parking: d.parking ?? "",
        ref,
        photos: Math.max(d.gallery?.length ?? 0, d.image ? 1 : 0),
        moderation_status: "pending",
      })
      .select("*")
      .single();

    if (error || !created) {
      request.log.error(error, "Failed to create listing");
      return reply.code(500).send({ message: "Failed to create listing" });
    }

    return { item: formatProperty(created), message: "Listing created and submitted for review" };
  });

  // ── GET /listings/:id — get single listing ──────────────────
  app.get("/listings/:id", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const supabase = getSupabaseAdminClient()!;

    const { data: property, error } = await (supabase as any)
      .from("properties")
      .select("*")
      .eq("id", id)
      .eq("agent_id", auth.agentId)
      .single();

    if (error || !property) {
      return reply.code(404).send({ message: "Listing not found" });
    }

    return formatProperty(property);
  });

  // ── PUT /listings/:id — update a listing ────────────────────
  app.put("/listings/:id", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const body = updateListingSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid listing data", errors: body.error.flatten().fieldErrors });
    }

    const supabase = getSupabaseAdminClient()!;

    // Verify ownership
    const { data: existing } = await (supabase as any)
      .from("properties")
      .select("id")
      .eq("id", id)
      .eq("agent_id", auth.agentId)
      .single();

    if (!existing) {
      return reply.code(404).send({ message: "Listing not found" });
    }

    const d = body.data;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (d.title !== undefined) updates.title = d.title;
    if (d.listingType !== undefined) updates.listing_type = d.listingType;
    if (d.price !== undefined) updates.price = d.price;
    if (d.priceLabel !== undefined) updates.price_label = d.priceLabel;
    if (d.region !== undefined) updates.region = d.region;
    if (d.location !== undefined) updates.location = d.location;
    if (d.type !== undefined) updates.type = d.type;
    if (d.beds !== undefined) updates.beds = d.beds;
    if (d.baths !== undefined) updates.baths = d.baths;
    if (d.area !== undefined) updates.area = d.area;
    if (d.description !== undefined) updates.description = d.description;
    if (d.image !== undefined) updates.image = d.image;
    if (d.imageLg !== undefined) updates.image_lg = d.imageLg;
    if (d.gallery !== undefined) {
      updates.gallery = d.gallery;
      updates.photos = Math.max(d.gallery.length, d.image ? 1 : (updates.image ? 1 : 0));
    }
    if (d.amenities !== undefined) updates.amenities = d.amenities;
    if (d.furnishing !== undefined) updates.furnishing = d.furnishing;
    if (d.parking !== undefined) updates.parking = d.parking;

    // Re-submit for moderation on edit
    updates.moderation_status = "pending";

    const { data: updated, error } = await (supabase as any)
      .from("properties")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      request.log.error(error, "Failed to update listing");
      return reply.code(500).send({ message: "Failed to update listing" });
    }

    return { item: formatProperty(updated), message: "Listing updated and resubmitted for review" };
  });

  // ── DELETE /listings/:id — delete a listing ─────────────────
  app.delete("/listings/:id", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const { id } = request.params as { id: string };
    const supabase = getSupabaseAdminClient()!;

    // Verify ownership
    const { data: existing } = await (supabase as any)
      .from("properties")
      .select("id, title")
      .eq("id", id)
      .eq("agent_id", auth.agentId)
      .single();

    if (!existing) {
      return reply.code(404).send({ message: "Listing not found" });
    }

    const { error } = await (supabase as any)
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) {
      request.log.error(error, "Failed to delete listing");
      return reply.code(500).send({ message: "Failed to delete listing" });
    }

    return { message: "Listing deleted" };
  });

  // ── GET /verification — check verification status ───────────
  app.get("/verification", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const supabase = getSupabaseAdminClient()!;
    const { data: agent, error } = await (supabase as any)
      .from("agents")
      .select("verification_status, kyc_documents, verification_submitted_at, verified_at, rejection_reason")
      .eq("id", auth.agentId)
      .single();

    if (error || !agent) {
      return reply.code(404).send({ message: "Agent not found" });
    }

    return {
      verificationStatus: agent.verification_status ?? "unverified",
      kycDocuments: agent.kyc_documents ?? [],
      submittedAt: agent.verification_submitted_at ?? null,
      verifiedAt: agent.verified_at ?? null,
      rejectionReason: agent.rejection_reason ?? null,
    };
  });

  // ── POST /verification — submit KYC documents ──────────────
  const kycSubmitSchema = z.object({
    documents: z.array(z.object({
      type: z.enum(["national_id", "business_registration", "proof_of_address"]),
      url: z.string().url().max(500),
      name: z.string().max(200),
    })).min(1).max(5),
  });

  app.post("/verification", async (request, reply) => {
    const auth = await requireAgent(request, reply);
    if (!auth) return;

    const body = kycSubmitSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid KYC data", errors: body.error.flatten().fieldErrors });
    }

    const supabase = getSupabaseAdminClient()!;

    // Check current status — cannot resubmit if already pending or approved
    const { data: current } = await (supabase as any)
      .from("agents")
      .select("verification_status")
      .eq("id", auth.agentId)
      .single();

    if (current?.verification_status === "approved") {
      return reply.code(400).send({ message: "Agent is already verified" });
    }
    if (current?.verification_status === "pending") {
      return reply.code(400).send({ message: "Verification is already pending review" });
    }

    const documents = body.data.documents.map((d) => ({
      type: d.type,
      url: d.url,
      name: d.name,
      uploadedAt: new Date().toISOString(),
    }));

    const { error } = await (supabase as any)
      .from("agents")
      .update({
        verification_status: "pending",
        kyc_documents: documents,
        verification_submitted_at: new Date().toISOString(),
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.agentId);

    if (error) {
      request.log.error(error, "Failed to submit KYC");
      return reply.code(500).send({ message: "Failed to submit verification" });
    }

    return { message: "Verification submitted for review", verificationStatus: "pending" };
  });
}

function formatProperty(row: any) {
  const price = Number(row.price ?? 0);
  return {
    id: row.id,
    title: row.title ?? "",
    listingType: row.listing_type ?? "sale",
    price,
    priceFormatted: `GHS ${price.toLocaleString("en-GH")}`,
    priceLabel: row.price_label ?? undefined,
    region: row.region ?? "",
    location: row.location ?? "",
    type: row.type ?? "",
    beds: row.beds ?? 0,
    baths: row.baths ?? 0,
    area: Number(row.area ?? 0),
    image: row.image ?? "",
    imageLg: row.image_lg ?? undefined,
    gallery: row.gallery ?? [],
    badges: row.badges ?? [],
    photos: row.photos ?? 0,
    description: row.description ?? "",
    amenities: row.amenities ?? [],
    ref: row.ref ?? "",
    furnishing: row.furnishing ?? "",
    parking: row.parking ?? "",
    featured: row.featured ?? false,
    moderationStatus: row.moderation_status ?? "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
