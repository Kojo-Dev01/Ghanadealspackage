import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getSupabaseAdminClient } from "../lib/supabase.js";

interface AgentRow {
  id: string;
  name: string;
  company: string;
  phone: string;
  color: string;
  avatar_url?: string | null;
  rating: number;
  areas: string[];
  years: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  listing_count?: number;
  avg_rating?: number;
  review_count?: number;
}

function toApiAgent(row: AgentRow) {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    rating: row.avg_rating ?? Number(row.rating),
    reviewCount: row.review_count ?? 0,
    areas: row.areas,
    listings: row.listing_count ?? 0,
    years: row.years,
    color: row.color,
    phone: row.phone,
    avatar_url: row.avatar_url ?? null,
    verified: row.verified
  };
}

export async function registerAgentRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const query = request.query as { q?: string; area?: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return { items: [], total: 0 };
    }

    let qb = supabase.from("agents").select("*", { count: "exact" }).order("rating", { ascending: false });

    if (query.q) {
      qb = qb.or(`name.ilike.%${query.q}%,company.ilike.%${query.q}%`);
    }
    if (query.area) {
      qb = qb.contains("areas", [query.area]);
    }

    const { data: rawData, count, error } = await qb;
    if (error) {
      app.log.error(error, "Failed to fetch agents");
      return { items: [], total: 0 };
    }

    const rows = (rawData ?? []) as unknown as AgentRow[];

    // Get listing counts per agent
    const agentIds = rows.map((a) => a.id);
    const countMap: Record<string, number> = {};
    if (agentIds.length > 0) {
      const { data: countRows } = await supabase
        .from("properties")
        .select("agent_id")
        .in("agent_id", agentIds)
        .eq("moderation_status", "approved");

      if (countRows) {
        for (const row of countRows as unknown as { agent_id: string }[]) {
          countMap[row.agent_id] = (countMap[row.agent_id] ?? 0) + 1;
        }
      }
    }

    const agents = rows.map((row) => toApiAgent({ ...row, listing_count: countMap[row.id] ?? 0 }));

    // Fetch review stats for all agents
    if (agentIds.length > 0) {
      const { data: reviewRows } = await supabase
        .from("agent_reviews")
        .select("agent_id, rating")
        .in("agent_id", agentIds);

      if (reviewRows) {
        const reviewMap: Record<string, { sum: number; count: number }> = {};
        for (const r of reviewRows as { agent_id: string; rating: number }[]) {
          if (!reviewMap[r.agent_id]) reviewMap[r.agent_id] = { sum: 0, count: 0 };
          reviewMap[r.agent_id].sum += r.rating;
          reviewMap[r.agent_id].count += 1;
        }
        for (const agent of agents) {
          const stats = reviewMap[agent.id];
          if (stats && stats.count > 0) {
            agent.rating = Math.round((stats.sum / stats.count) * 10) / 10;
            agent.reviewCount = stats.count;
          }
        }
      }
    }

    return {
      items: agents,
      total: count ?? 0
    };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const { data: rawData, error } = await supabase.from("agents").select("*").eq("id", id).single();

    if (error || !rawData) {
      return reply.code(404).send({ message: "Agent not found" });
    }

    const row = rawData as unknown as AgentRow;

    // Get listing count for this agent
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", id)
      .eq("moderation_status", "approved");

    // Get review stats
    const { data: reviewRows } = await supabase
      .from("agent_reviews")
      .select("rating")
      .eq("agent_id", id);

    let avgRating: number | undefined;
    let reviewCount = 0;
    if (reviewRows && reviewRows.length > 0) {
      const sum = (reviewRows as { rating: number }[]).reduce((a, r) => a + r.rating, 0);
      reviewCount = reviewRows.length;
      avgRating = Math.round((sum / reviewCount) * 10) / 10;
    }

    return toApiAgent({ ...row, listing_count: count ?? 0, avg_rating: avgRating, review_count: reviewCount });
  });

  app.get("/:id/listings", async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { page?: string; limit?: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? "12") || 12));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from("properties")
      .select("*, agents!inner(id, name, company, phone, color, avatar_url)", { count: "exact" })
      .eq("agent_id", id)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      app.log.error(error, "Failed to fetch agent listings");
      return { items: [], total: 0, page, limit };
    }

    // Re-use property formatting from properties route
    const items = ((data ?? []) as unknown as import("./properties.js").PropertyWithAgent[]).map((row) => ({
      id: row.id,
      title: row.title,
      listingType: row.listing_type,
      price: Number(row.price),
      priceFormatted: `GHS ${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(Number(row.price))}`,
      region: row.region,
      location: row.location,
      type: row.type,
      beds: row.beds,
      baths: row.baths,
      area: Number(row.area),
      image: row.image,
      badges: row.badges,
      photos: row.photos,
      agent: {
        id: row.agents.id,
        name: row.agents.name,
        company: row.agents.company,
        phone: row.agents.phone,
        color: row.agents.color,
        avatar_url: row.agents.avatar_url ?? null
      }
    }));

    return { items, total: count ?? 0, page, limit };
  });

  // ── GET /:id/reviews — list reviews for an agent ───────────
  app.get("/:id/reviews", async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as { page?: string; limit?: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return { items: [], total: 0, page: 1, limit: 20 };
    }

    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? "20") || 20));
    const from = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("agent_reviews")
      .select("*", { count: "exact" })
      .eq("agent_id", id)
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      app.log.error(error, "Failed to fetch reviews");
      return { items: [], total: 0, page, limit };
    }

    // Look up user names from profiles table
    const userIds = [...new Set(((data ?? []) as any[]).map((r: any) => r.user_id))];
    const nameMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);
      if (profiles) {
        for (const p of profiles as { user_id: string; name: string }[]) {
          if (p.name) nameMap[p.user_id] = p.name;
        }
      }
    }

    const items = ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      agentId: r.agent_id,
      userId: r.user_id,
      userName: nameMap[r.user_id] ?? "Anonymous",
      rating: r.rating,
      comment: r.comment ?? "",
      createdAt: r.created_at,
    }));

    return { items, total: count ?? 0, page, limit };
  });

  // ── POST /:id/reviews — submit a review ─────────────────────
  const reviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  });

  app.post("/:id/reviews", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Authentication required" });
    }

    const user = request.user as { sub: string; role: string };

    const body = reviewSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Invalid review data", errors: body.error.flatten().fieldErrors });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Service unavailable" });
    }

    // Verify agent exists
    const { data: agent } = await supabase.from("agents").select("id").eq("id", id).single();
    if (!agent) {
      return reply.code(404).send({ message: "Agent not found" });
    }

    const { data: review, error } = await (supabase as any)
      .from("agent_reviews")
      .upsert(
        {
          agent_id: id,
          user_id: user.sub,
          rating: body.data.rating,
          comment: body.data.comment ?? "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "agent_id,user_id" }
      )
      .select("*")
      .single();

    if (error) {
      request.log.error(error, "Failed to submit review");
      return reply.code(500).send({ message: "Failed to submit review" });
    }

    // Recalculate agent's average rating
    const { data: allReviews } = await supabase
      .from("agent_reviews")
      .select("rating")
      .eq("agent_id", id);

    if (allReviews && allReviews.length > 0) {
      const sum = (allReviews as { rating: number }[]).reduce((a, r) => a + r.rating, 0);
      const avg = Math.round((sum / allReviews.length) * 10) / 10;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("agents") as any).update({ rating: avg }).eq("id", id);
    }

    // Look up the user's name for the response
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.sub)
      .single();

    return {
      message: "Review submitted",
      item: {
        id: review.id,
        agentId: review.agent_id,
        userId: review.user_id,
        userName: (profile as any)?.name || "Anonymous",
        rating: review.rating,
        comment: review.comment ?? "",
        createdAt: review.created_at,
      },
    };
  });

  // ── DELETE /:id/reviews/:reviewId — delete a review ─────────
  app.delete("/:id/reviews/:reviewId", async (request, reply) => {
    const { id, reviewId } = request.params as { id: string; reviewId: string };

    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "Authentication required" });
    }

    const user = request.user as { sub: string; role: string };
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Service unavailable" });
    }

    // Only the review author or admin can delete
    const isAdmin = user.role === "admin";
    let qb = (supabase as any).from("agent_reviews").delete().eq("id", reviewId).eq("agent_id", id);
    if (!isAdmin) {
      qb = qb.eq("user_id", user.sub);
    }

    const { error, count } = await qb;
    if (error) {
      request.log.error(error, "Failed to delete review");
      return reply.code(500).send({ message: "Failed to delete review" });
    }

    if (count === 0) {
      return reply.code(404).send({ message: "Review not found" });
    }

    // Recalculate agent's average rating after deletion
    const { data: remaining } = await supabase
      .from("agent_reviews")
      .select("rating")
      .eq("agent_id", id);

    if (remaining && remaining.length > 0) {
      const sum = (remaining as { rating: number }[]).reduce((a, r) => a + r.rating, 0);
      const avg = Math.round((sum / remaining.length) * 10) / 10;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("agents") as any).update({ rating: avg }).eq("id", id);
    } else {
      // No reviews left — reset to 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("agents") as any).update({ rating: 0 }).eq("id", id);
    }

    return { message: "Review deleted" };
  });
}
