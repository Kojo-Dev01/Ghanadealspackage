import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient } from "../lib/supabase.js";
import type { ModerationStatus } from "./properties.js";
import { notifyAgentListingApproved, notifyAgentListingFlagged, notifyAgentVerificationApproved, notifyAgentVerificationRejected } from "../lib/email.js";
import { hasPermission, ADMIN_ROLES, type AdminRole, type Permission } from "../lib/permissions.js";
import { createNotification } from "../lib/notifications.js";

function formatPrice(price: number): string {
  return `GHS ${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(price)}`;
}

export async function registerAdminRoutes(app: FastifyInstance) {
  // ---- Shared: fresh role lookup from admin_users table on every request ----
  app.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Admin authentication required" });
    }

    const userId = (request.user as { sub?: string }).sub;
    if (!userId) {
      return reply.code(401).send({ message: "Invalid token" });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    // Always read role fresh from DB — never trust the JWT role claim
    const { data: adminRow, error } = await supabase
      .from("admin_users")
      .select("id, role, active")
      .eq("user_id", userId)
      .single();

    if (error || !adminRow) {
      return reply.code(403).send({ message: "Admin access revoked" });
    }

    if (!(adminRow as { active: boolean }).active) {
      return reply.code(403).send({ message: "Admin account deactivated" });
    }

    // Attach to request for downstream handlers
    (request as any).adminRole = (adminRow as { role: AdminRole }).role;
    (request as any).adminId = (adminRow as { id: string }).id;
  });

  /** Guard helper: returns 403 if role lacks the given permission */
  function requirePermission(permission: Permission) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const role = (request as any).adminRole as AdminRole;
      if (!hasPermission(role, permission)) {
        return reply.code(403).send({ message: "Insufficient permissions" });
      }
    };
  }

  app.get("/stats", { preHandler: requirePermission("stats.read") }, async (request, reply) => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    // Parallel stat queries
    const [totalRes, pendingRes, approvedRes, flaggedRes, agentRes, inquiryRes, recentRes, buyersRes, newBuyersRes, verifiedAgentsRes] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("moderation_status", "pending"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("moderation_status", "approved"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("moderation_status", "flagged"),
      supabase.from("agents").select("id", { count: "exact", head: true }),
      supabase.from("inquiries").select("id", { count: "exact", head: true }),
      supabase.from("audit_log").select("action, detail, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("agents").select("id", { count: "exact", head: true }).eq("verified", true)
    ]);

    const auditRows = (recentRes.data ?? []) as unknown as { action: string; detail: { summary?: string } | null; created_at: string }[];
    const recentActivity = auditRows.map((row) => ({
      time: new Date(row.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      item: String(row.detail?.summary ?? row.action)
    }));

    return {
      totals: {
        listings: totalRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        approved: approvedRes.count ?? 0,
        flagged: flaggedRes.count ?? 0,
        agents: agentRes.count ?? 0,
        verifiedAgents: verifiedAgentsRes.count ?? 0,
        inquiries: inquiryRes.count ?? 0,
        buyers: buyersRes.count ?? 0,
        newBuyersThisWeek: newBuyersRes.count ?? 0
      },
      recentActivity
    };
  });

  // ---- Metrics ----
  app.get("/metrics", { preHandler: requirePermission("metrics.read") }, async (request, reply) => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    const [
      totalListings, approvedListings, pendingListings, flaggedListings,
      totalAgents, verifiedAgents,
      totalBuyers, newBuyersWeek, newBuyersMonth,
      totalInquiries, newInquiriesWeek, respondedInquiries,
      newListingsWeek, newListingsMonth,
      newAgentsWeek,
      listingsByType, listingsByRegion,
      recentInquiries,
      listingDates, buyerDates, inquiryDates
    ] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("moderation_status", "approved"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("moderation_status", "pending"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("moderation_status", "flagged"),
      supabase.from("agents").select("id", { count: "exact", head: true }),
      supabase.from("agents").select("id", { count: "exact", head: true }).eq("verified", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
      supabase.from("inquiries").select("id", { count: "exact", head: true }),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "responded"),
      supabase.from("properties").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("properties").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
      supabase.from("agents").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("properties").select("type").eq("moderation_status", "approved"),
      supabase.from("properties").select("region").eq("moderation_status", "approved"),
      supabase.from("inquiries").select("id, name, email, status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("properties").select("created_at").gte("created_at", monthAgo),
      supabase.from("profiles").select("created_at").gte("created_at", monthAgo),
      supabase.from("inquiries").select("created_at").gte("created_at", monthAgo)
    ]);

    // Build daily trend data for last 30 days
    function buildDailyTrend(rows: { created_at: string }[]): Array<{ date: string; count: number }> {
      const counts: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        counts[d.toISOString().slice(0, 10)] = 0;
      }
      for (const row of rows) {
        const key = row.created_at.slice(0, 10);
        if (key in counts) counts[key]++;
      }
      return Object.entries(counts).map(([date, count]) => ({ date, count }));
    }

    const listingTrend = buildDailyTrend((listingDates.data ?? []) as { created_at: string }[]);
    const buyerTrend = buildDailyTrend((buyerDates.data ?? []) as { created_at: string }[]);
    const inquiryTrend = buildDailyTrend((inquiryDates.data ?? []) as { created_at: string }[]);

    // Aggregate listings by type
    const typeMap: Record<string, number> = {};
    for (const row of (listingsByType.data ?? []) as { type: string }[]) {
      typeMap[row.type] = (typeMap[row.type] ?? 0) + 1;
    }

    // Aggregate listings by region
    const regionMap: Record<string, number> = {};
    for (const row of (listingsByRegion.data ?? []) as { region: string }[]) {
      regionMap[row.region] = (regionMap[row.region] ?? 0) + 1;
    }

    // Sort by count descending and take top entries
    const byType = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    const byRegion = Object.entries(regionMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

    const inquiryTotal = totalInquiries.count ?? 0;
    const respondedTotal = respondedInquiries.count ?? 0;
    const responseRate = inquiryTotal > 0 ? Math.round((respondedTotal / inquiryTotal) * 100) : 0;

    return {
      listings: {
        total: totalListings.count ?? 0,
        approved: approvedListings.count ?? 0,
        pending: pendingListings.count ?? 0,
        flagged: flaggedListings.count ?? 0,
        newThisWeek: newListingsWeek.count ?? 0,
        newThisMonth: newListingsMonth.count ?? 0,
        byType,
        byRegion,
        trend: listingTrend
      },
      agents: {
        total: totalAgents.count ?? 0,
        verified: verifiedAgents.count ?? 0,
        newThisWeek: newAgentsWeek.count ?? 0
      },
      buyers: {
        total: totalBuyers.count ?? 0,
        newThisWeek: newBuyersWeek.count ?? 0,
        newThisMonth: newBuyersMonth.count ?? 0,
        trend: buyerTrend
      },
      inquiries: {
        total: inquiryTotal,
        newThisWeek: newInquiriesWeek.count ?? 0,
        responded: respondedTotal,
        responseRate,
        trend: inquiryTrend,
        recent: ((recentInquiries.data ?? []) as { id: string; name: string; email: string; status: string; created_at: string }[]).map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          status: r.status,
          createdAt: r.created_at
        }))
      }
    };
  });

  app.get("/listings", { preHandler: requirePermission("listings.read") }, async (request, reply) => {
    const query = request.query as {
      status?: ModerationStatus;
      q?: string;
      page?: string;
      limit?: string;
    };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? "10") || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let qb = supabase
      .from("properties")
      .select("id, title, listing_type, price, region, type, moderation_status, created_at, agents!inner(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query.status && ["pending", "approved", "flagged", "archived"].includes(query.status)) {
      qb = qb.eq("moderation_status", query.status);
    }
    if (query.q) {
      qb = qb.or(`title.ilike.%${query.q}%,region.ilike.%${query.q}%`);
    }

    const { data, count, error } = await qb;
    if (error) {
      app.log.error(error, "Failed to fetch admin listings");
      return { items: [], total: 0, page, limit };
    }

    const items = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title,
      listingType: row.listing_type,
      region: row.region,
      type: row.type,
      priceFormatted: formatPrice(Number(row.price)),
      submittedAt: String(row.created_at),
      moderationStatus: row.moderation_status,
      agentName: (row.agents as { name: string })?.name ?? "Unknown"
    }));

    return { items, total: count ?? 0, page, limit };
  });

  // ---- Single listing detail ----

  app.get("/listings/:id", { preHandler: requirePermission("listings.read") }, async (request, reply) => {
    const { id } = request.params as { id?: string };
    if (!id) return reply.code(400).send({ message: "Listing id is required" });

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    const { data, error } = await supabase
      .from("properties")
      .select("*, agents!inner(id, name, company, phone, color)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return reply.code(404).send({ message: "Listing not found" });
    }

    const row = data as Record<string, unknown>;
    const agent = row.agents as { id: string; name: string; company: string; phone: string; color: string };

    return {
      item: {
        id: row.id,
        title: row.title,
        listingType: row.listing_type,
        price: Number(row.price),
        priceFormatted: formatPrice(Number(row.price)),
        priceLabel: row.price_label ?? null,
        region: row.region,
        location: row.location,
        type: row.type,
        beds: Number(row.beds ?? 0),
        baths: Number(row.baths ?? 0),
        area: Number(row.area ?? 0),
        description: row.description,
        image: row.image,
        imageLg: row.image_lg ?? null,
        gallery: row.gallery ?? [],
        amenities: row.amenities ?? [],
        ref: row.ref,
        furnishing: row.furnishing,
        parking: row.parking,
        latitude: row.latitude != null ? Number(row.latitude) : null,
        longitude: row.longitude != null ? Number(row.longitude) : null,
        floorPlans: (row.floor_plans as string[] | null) ?? [],
        featured: !!row.featured,
        moderationStatus: row.moderation_status,
        moderatedAt: row.moderated_at ?? null,
        submittedAt: String(row.created_at),
        agent: {
          id: agent.id,
          name: agent.name,
          company: agent.company,
          phone: agent.phone,
          color: agent.color,
        },
      },
    };
  });

  app.post("/listings/:id/moderate", { preHandler: requirePermission("listings.moderate") }, async (request, reply) => {
    const params = request.params as { id?: string };
    const moderateSchema = z.object({ status: z.enum(["pending", "approved", "flagged", "archived"]) });
    const parsed = moderateSchema.safeParse(request.body);

    if (!params.id) {
      return reply.code(400).send({ message: "Listing id is required" });
    }

    if (!parsed.success) {
      return reply.code(400).send({ message: "Valid moderation status is required" });
    }

    const nextStatus = parsed.data.status;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const userId = (request.user as { sub?: string }).sub ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawData, error } = await (supabase
      .from("properties") as any)
      .update({
        moderation_status: nextStatus,
        moderated_by: userId,
        moderated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select("id, title, moderation_status, agent_id")
      .single();

    if (error || !rawData) {
      return reply.code(404).send({ message: "Listing not found" });
    }

    const updated = rawData as unknown as { id: string; title: string; moderation_status: string; agent_id: string };

    // Write audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("audit_log") as any).insert({
      user_id: userId,
      action: "moderate_listing",
      target_type: "property",
      target_id: params.id,
      detail: { status: nextStatus, summary: `Listing "${updated.title}" marked as ${nextStatus}` }
    });

    // Send email notification to agent (fire-and-forget)
    if (nextStatus === "approved" || nextStatus === "flagged") {
      const { data: agentRow } = await (supabase as any)
        .from("agents")
        .select("id, user_id, name, email")
        .eq("id", updated.agent_id)
        .single();

      if (agentRow?.email) {
        const notify = nextStatus === "approved" ? notifyAgentListingApproved : notifyAgentListingFlagged;
        notify(
          { email: agentRow.email, name: agentRow.name },
          { title: updated.title, id: updated.id }
        ).catch((err) => app.log.error(err, "Failed to send moderation email"));

        // In-app notification
        if (agentRow.user_id) {
          createNotification({
            userId: agentRow.user_id,
            type: nextStatus === "approved" ? "listing_approved" : "listing_flagged",
            title: nextStatus === "approved" ? "Listing Approved" : "Listing Flagged",
            body: `Your listing "${updated.title}" has been ${nextStatus}`,
            data: { propertyId: updated.id },
          }).catch((err) => app.log.error(err, "Failed to create moderation notification"));
        }
      }
    }

    return {
      item: updated,
      message: `Listing marked as ${nextStatus}`
    };
  });

  // ---- Toggle featured ----

  app.post("/listings/:id/featured", { preHandler: requirePermission("listings.featured") }, async (request, reply) => {
    const { id } = request.params as { id?: string };
    if (!id) return reply.code(400).send({ message: "Listing id is required" });

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    // Fetch current featured state
    const { data: current, error: fetchErr } = await supabase
      .from("properties")
      .select("id, title, featured")
      .eq("id", id)
      .single();

    if (fetchErr || !current) {
      return reply.code(404).send({ message: "Listing not found" });
    }

    const nextFeatured = !(current as { featured: boolean }).featured;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase.from("properties") as any)
      .update({ featured: nextFeatured })
      .eq("id", id);

    if (updateErr) {
      return reply.code(500).send({ message: "Failed to update featured status" });
    }

    const userId = (request.user as { sub?: string }).sub ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("audit_log") as any).insert({
      user_id: userId,
      action: "toggle_featured",
      target_type: "property",
      target_id: id,
      detail: { featured: nextFeatured, summary: `Listing "${(current as { title: string }).title}" ${nextFeatured ? "featured" : "unfeatured"}` }
    });

    return {
      featured: nextFeatured,
      message: nextFeatured ? "Listing is now featured" : "Listing removed from featured"
    };
  });

  // ---- Inquiries management ----

  app.get("/inquiries", { preHandler: requirePermission("inquiries.read") }, async (request, reply) => {
    const query = request.query as {
      status?: string;
      q?: string;
      page?: string;
      limit?: string;
    };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? "10") || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let qb = supabase
      .from("inquiries")
      .select("*, properties!inner(id, title)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query.status && ["new", "read", "responded", "closed"].includes(query.status)) {
      qb = qb.eq("status", query.status);
    }
    if (query.q) {
      qb = qb.or(`name.ilike.%${query.q}%,email.ilike.%${query.q}%`);
    }

    const { data, count, error } = await qb;
    if (error) {
      app.log.error(error, "Failed to fetch inquiries");
      return { items: [], total: 0, page, limit };
    }

    const items = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      property: {
        id: (row.properties as { id: string; title: string })?.id,
        title: (row.properties as { id: string; title: string })?.title
      }
    }));

    return { items, total: count ?? 0, page, limit };
  });

  app.post("/inquiries/:id/status", { preHandler: requirePermission("inquiries.update") }, async (request, reply) => {
    const params = request.params as { id?: string };
    const inquiryStatusSchema = z.object({ status: z.enum(["new", "read", "responded", "closed"]) });
    const parsed = inquiryStatusSchema.safeParse(request.body);

    if (!params.id || !parsed.success) {
      return reply.code(400).send({ message: "Valid inquiry id and status required" });
    }

    const body = parsed.data;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("inquiries") as any)
      .update({ status: body.status })
      .eq("id", params.id);

    if (error) {
      app.log.error(error, "Failed to update inquiry status");
      return reply.code(500).send({ message: "Failed to update inquiry" });
    }

    return { message: `Inquiry marked as ${body.status}` };
  });

  // ---- Users (buyer profiles) management ----

  app.get("/users", { preHandler: requirePermission("users.read") }, async (request, reply) => {
    const query = request.query as {
      q?: string;
      page?: string;
      limit?: string;
    };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? "10") || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let qb = (supabase as any)
      .from("profiles")
      .select("id, user_id, name, email, phone, avatar_url, saved_properties, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query.q) {
      qb = qb.or(`name.ilike.%${query.q}%,email.ilike.%${query.q}%,phone.ilike.%${query.q}%`);
    }

    const { data, count, error } = await qb;
    if (error) {
      app.log.error(error, "Failed to fetch users");
      return { items: [], total: 0, page, limit };
    }

    const items = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      savedCount: Array.isArray(row.saved_properties) ? (row.saved_properties as unknown[]).length : 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { items, total: count ?? 0, page, limit };
  });

  // ---- Agents verification management ----

  app.get("/agents", { preHandler: requirePermission("agents.read") }, async (request, reply) => {
    const query = request.query as {
      q?: string;
      area?: string;
      verification?: string;
      page?: string;
      limit?: string;
    };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? "12") || 12));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let qb = (supabase as any)
      .from("agents")
      .select("*, properties(id)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query.q) {
      qb = qb.or(`name.ilike.%${query.q}%,company.ilike.%${query.q}%`);
    }
    if (query.area) {
      qb = qb.contains("areas", [query.area]);
    }
    if (query.verification && ["unverified", "pending", "approved", "rejected"].includes(query.verification)) {
      qb = qb.eq("verification_status", query.verification);
    }

    const { data, count, error } = await qb;
    if (error) {
      app.log.error(error, "Failed to fetch agents");
      return { items: [], total: 0, page, limit };
    }

    const items = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      company: row.company,
      phone: row.phone,
      color: row.color,
      rating: Number(row.rating ?? 0),
      areas: row.areas ?? [],
      years: row.years ?? 0,
      verified: row.verified ?? false,
      verificationStatus: row.verification_status ?? "unverified",
      kycDocuments: row.kyc_documents ?? [],
      verificationSubmittedAt: row.verification_submitted_at ?? null,
      verifiedAt: row.verified_at ?? null,
      rejectionReason: row.rejection_reason ?? null,
      listings: Array.isArray(row.properties) ? (row.properties as unknown[]).length : 0,
      createdAt: row.created_at,
    }));

    return { items, total: count ?? 0, page, limit };
  });

  app.get("/agents/:id", { preHandler: requirePermission("agents.read") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!id) return reply.code(400).send({ message: "Agent id is required" });

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    const { data: agent, error } = await (supabase as any)
      .from("agents")
      .select("*, properties(id, title, moderation_status)")
      .eq("id", id)
      .single();

    if (error || !agent) {
      return reply.code(404).send({ message: "Agent not found" });
    }

    return {
      item: {
        id: agent.id,
        name: agent.name,
        company: agent.company,
        phone: agent.phone,
        color: agent.color,
        rating: Number(agent.rating ?? 0),
        areas: agent.areas ?? [],
        years: agent.years ?? 0,
        verified: agent.verified ?? false,
        verificationStatus: agent.verification_status ?? "unverified",
        kycDocuments: agent.kyc_documents ?? [],
        verificationSubmittedAt: agent.verification_submitted_at ?? null,
        verifiedAt: agent.verified_at ?? null,
        verifiedBy: agent.verified_by ?? null,
        rejectionReason: agent.rejection_reason ?? null,
        listings: (agent.properties ?? []).map((p: any) => ({
          id: p.id,
          title: p.title,
          moderationStatus: p.moderation_status,
        })),
        createdAt: agent.created_at,
      },
    };
  });

  const verifyAgentSchema = z.object({
    action: z.enum(["approve", "reject"]),
    reason: z.string().max(500).optional(),
  });

  app.post("/agents/:id/verify", { preHandler: requirePermission("agents.verify") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!id) return reply.code(400).send({ message: "Agent id is required" });

    const parsed = verifyAgentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid verification data" });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    const userId = (request.user as { sub?: string }).sub ?? null;
    const { action, reason } = parsed.data;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (action === "approve") {
      updates.verification_status = "approved";
      updates.verified = true;
      updates.verified_at = new Date().toISOString();
      updates.verified_by = userId;
      updates.rejection_reason = null;
    } else {
      updates.verification_status = "rejected";
      updates.verified = false;
      updates.verified_at = null;
      updates.verified_by = null;
      updates.rejection_reason = reason ?? "Verification documents not sufficient";
    }

    const { data: agent, error } = await (supabase as any)
      .from("agents")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, verification_status, verified")
      .single();

    if (error || !agent) {
      return reply.code(404).send({ message: "Agent not found" });
    }

    // Write audit log
    await (supabase.from("audit_log") as any).insert({
      user_id: userId,
      action: action === "approve" ? "verify_agent" : "reject_agent",
      target_type: "agent",
      target_id: id,
      detail: {
        status: agent.verification_status,
        reason: reason ?? null,
        summary: `Agent "${agent.name}" ${action === "approve" ? "verified" : "rejected"}`,
      },
    });

    // Send email notification to agent (fire-and-forget)
    if (agent.email) {
      const notify = action === "approve"
        ? () => notifyAgentVerificationApproved({ email: agent.email, name: agent.name })
        : () => notifyAgentVerificationRejected({ email: agent.email, name: agent.name }, reason ?? "Verification documents not sufficient");
      notify().catch((err) => app.log.error(err, "Failed to send verification email"));
    }

    // In-app notification for agent — need user_id from agents table
    const { data: agentFull } = await (supabase as any)
      .from("agents")
      .select("user_id")
      .eq("id", id)
      .single();

    if (agentFull?.user_id) {
      createNotification({
        userId: agentFull.user_id,
        type: action === "approve" ? "verification_approved" : "verification_rejected",
        title: action === "approve" ? "Verification Approved" : "Verification Rejected",
        body: action === "approve"
          ? "Your agent account has been verified"
          : `Your verification was rejected: ${reason ?? "Documents not sufficient"}`,
        data: { agentId: id },
      }).catch((err) => app.log.error(err, "Failed to create verification notification"));
    }

    return {
      item: agent,
      message: `Agent ${action === "approve" ? "approved" : "rejected"} successfully`,
    };
  });

  // ---- Current admin user info ----
  app.get("/me", async (request, reply) => {
    const userId = (request.user as { sub?: string }).sub;
    const supabase = getSupabaseAdminClient();
    if (!supabase || !userId) return reply.code(503).send({ message: "Database not configured" });

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, name, role, active")
      .eq("user_id", userId)
      .single();

    if (error || !data) return reply.code(404).send({ message: "Admin user not found" });

    return { user: data };
  });

  // ---- Admin team management ----

  app.get("/team", { preHandler: requirePermission("admin_users.read") }, async (request, reply) => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, user_id, email, name, role, active, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) {
      app.log.error(error, "Failed to fetch admin team");
      return reply.code(500).send({ message: "Failed to fetch team" });
    }

    return { items: data ?? [] };
  });

  const createAdminSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    password: z.string().min(8).max(72),
    role: z.enum(["super_admin", "moderator", "customer_service"]),
  });

  app.post("/team", { preHandler: requirePermission("admin_users.create") }, async (request, reply) => {
    const parsed = createAdminSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
    }

    const { email, name, password, role } = parsed.data;
    const creatorAdminId = (request as any).adminId as string;

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    // Prevent non-super_admin from creating super_admin users
    const creatorRole = (request as any).adminRole as AdminRole;
    if (role === "super_admin" && creatorRole !== "super_admin") {
      return reply.code(403).send({ message: "Only super admins can create other super admins" });
    }

    // Check if email already exists in admin_users
    const { data: existing } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return reply.code(409).send({ message: "An admin user with this email already exists" });
    }

    // Create Supabase auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr || !authUser.user) {
      // If user already exists in Supabase auth, try to use their ID
      if (authErr?.message?.includes("already been registered")) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users?.find((u) => u.email === email);
        if (existingUser) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: adminRow, error: insertErr } = await (supabase.from("admin_users") as any)
            .insert({
              user_id: existingUser.id,
              email,
              name,
              role,
              created_by: creatorAdminId,
            })
            .select("id, user_id, email, name, role, active, created_at")
            .single();

          if (insertErr) {
            app.log.error(insertErr, "Failed to create admin user record");
            return reply.code(500).send({ message: "Failed to create admin user" });
          }

          return reply.code(201).send({ item: adminRow, message: "Admin user created" });
        }
      }
      app.log.error(authErr, "Failed to create auth user");
      return reply.code(500).send({ message: "Failed to create user account" });
    }

    // Insert admin_users record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adminRow, error: insertErr } = await (supabase.from("admin_users") as any)
      .insert({
        user_id: authUser.user.id,
        email,
        name,
        role,
        created_by: creatorAdminId,
      })
      .select("id, user_id, email, name, role, active, created_at")
      .single();

    if (insertErr) {
      app.log.error(insertErr, "Failed to create admin user record");
      return reply.code(500).send({ message: "Failed to create admin user" });
    }

    return reply.code(201).send({ item: adminRow, message: "Admin user created" });
  });

  const updateAdminSchema = z.object({
    role: z.enum(["super_admin", "moderator", "customer_service"]).optional(),
    name: z.string().min(1).max(100).optional(),
  });

  app.put("/team/:id", { preHandler: requirePermission("admin_users.update") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!id) return reply.code(400).send({ message: "Admin user id required" });

    const parsed = updateAdminSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid data" });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    const currentAdminId = (request as any).adminId as string;
    const currentRole = (request as any).adminRole as AdminRole;

    // Cannot change own role
    if (id === currentAdminId && parsed.data.role) {
      return reply.code(403).send({ message: "Cannot change your own role" });
    }

    // Only super_admin can assign super_admin role
    if (parsed.data.role === "super_admin" && currentRole !== "super_admin") {
      return reply.code(403).send({ message: "Only super admins can assign super admin role" });
    }

    // Only super_admin can modify another super_admin
    if (currentRole !== "super_admin") {
      const { data: targetRow } = await supabase
        .from("admin_users")
        .select("role")
        .eq("id", id)
        .single();
      if ((targetRow as any)?.role === "super_admin") {
        return reply.code(403).send({ message: "Only super admins can modify super admin users" });
      }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.role) updates.role = parsed.data.role;
    if (parsed.data.name) updates.name = parsed.data.name;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase.from("admin_users") as any)
      .update(updates)
      .eq("id", id)
      .select("id, user_id, email, name, role, active, created_at, updated_at")
      .single();

    if (error || !updated) {
      return reply.code(404).send({ message: "Admin user not found" });
    }

    return { item: updated, message: "Admin user updated" };
  });

  app.post("/team/:id/deactivate", { preHandler: requirePermission("admin_users.deactivate") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!id) return reply.code(400).send({ message: "Admin user id required" });

    const supabase = getSupabaseAdminClient();
    if (!supabase) return reply.code(503).send({ message: "Database not configured" });

    const currentAdminId = (request as any).adminId as string;

    // Cannot deactivate self
    if (id === currentAdminId) {
      return reply.code(403).send({ message: "Cannot deactivate your own account" });
    }

    const currentRole = (request as any).adminRole as AdminRole;

    // Only super_admin can deactivate another super_admin
    if (currentRole !== "super_admin") {
      const { data: targetRow } = await supabase
        .from("admin_users")
        .select("role")
        .eq("id", id)
        .single();
      if ((targetRow as any)?.role === "super_admin") {
        return reply.code(403).send({ message: "Only super admins can deactivate super admin users" });
      }
    }

    // Toggle active status
    const { data: current } = await supabase
      .from("admin_users")
      .select("active")
      .eq("id", id)
      .single();

    if (!current) {
      return reply.code(404).send({ message: "Admin user not found" });
    }

    const nextActive = !(current as { active: boolean }).active;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase.from("admin_users") as any)
      .update({ active: nextActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, email, name, role, active")
      .single();

    if (error || !updated) {
      return reply.code(500).send({ message: "Failed to update admin user" });
    }

    return {
      item: updated,
      message: nextActive ? "Admin user reactivated" : "Admin user deactivated",
    };
  });
}
