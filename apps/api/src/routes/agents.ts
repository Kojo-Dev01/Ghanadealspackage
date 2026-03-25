import type { FastifyInstance } from "fastify";
import { getSupabaseAdminClient } from "../lib/supabase.js";

interface AgentRow {
  id: string;
  name: string;
  company: string;
  phone: string;
  color: string;
  rating: number;
  areas: string[];
  years: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  listing_count?: number;
}

function toApiAgent(row: AgentRow) {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    rating: Number(row.rating),
    areas: row.areas,
    listings: row.listing_count ?? 0,
    years: row.years,
    color: row.color,
    phone: row.phone,
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

    return toApiAgent({ ...row, listing_count: count ?? 0 });
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
      .select("*, agents!inner(id, name, company, phone, color)", { count: "exact" })
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
        color: row.agents.color
      }
    }));

    return { items, total: count ?? 0, page, limit };
  });
}
