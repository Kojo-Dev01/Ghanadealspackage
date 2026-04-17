import type { FastifyInstance } from "fastify";
import { getSupabaseAdminClient } from "../lib/supabase.js";

// ---- Types ----

export type ListingType = "sale" | "rent" | "new";
export type ModerationStatus = "pending" | "approved" | "flagged" | "archived";

export interface PropertyRow {
  id: string;
  agent_id: string;
  title: string;
  listing_type: ListingType;
  price: number;
  price_label: string | null;
  region: string;
  location: string;
  type: string;
  beds: number;
  baths: number;
  area: number;
  description: string;
  image: string;
  image_lg: string | null;
  gallery: string[];
  badges: string[];
  photos: number;
  amenities: string[];
  ref: string;
  furnishing: string;
  parking: string;
  featured: boolean;
  moderation_status: ModerationStatus;
  latitude: number | null;
  longitude: number | null;
  floor_plans: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentEmbed {
  id: string;
  name: string;
  company: string;
  phone: string;
  color: string;
  avatar_url?: string | null;
}

export interface PropertyWithAgent extends PropertyRow {
  agents: AgentEmbed;
}

// ---- Helpers ----

function formatPrice(price: number): string {
  return `GHS ${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(price)}`;
}

function toApiProperty(row: PropertyWithAgent) {
  return {
    id: row.id,
    title: row.title,
    listingType: row.listing_type,
    price: Number(row.price),
    priceFormatted: formatPrice(Number(row.price)),
    priceLabel: row.price_label ?? undefined,
    region: row.region,
    location: row.location,
    type: row.type,
    beds: row.beds,
    baths: row.baths,
    area: Number(row.area),
    image: row.image,
    imageLg: row.image_lg ?? undefined,
    gallery: row.gallery,
    badges: row.badges,
    photos: (row.gallery?.length ?? 0) + (row.image ? 1 : 0),
    description: row.description,
    amenities: row.amenities,
    ref: row.ref,
    added: row.created_at,
    furnishing: row.furnishing,
    parking: row.parking,
    featured: row.featured,
    moderationStatus: row.moderation_status,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    floorPlans: row.floor_plans ?? [],
    agent: {
      id: row.agents.id,
      name: row.agents.name,
      company: row.agents.company,
      phone: row.agents.phone,
      color: row.agents.color,
      avatar_url: row.agents.avatar_url ?? null
    }
  };
}

// ---- Routes ----

export async function registerPropertyRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    const query = request.query as {
      listingType?: ListingType;
      region?: string;
      type?: string;
      q?: string;
      minPrice?: string;
      maxPrice?: string;
      minBeds?: string;
      minBaths?: string;
      page?: string;
      limit?: string;
      featured?: string;
      swLat?: string;
      swLng?: string;
      neLat?: string;
      neLng?: string;
    };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return { items: [], total: 0, page: 1, limit: 12 };
    }

    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? "12") || 12));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let qb = supabase
      .from("properties")
      .select("*, agents!inner(id, name, company, phone, color, avatar_url)", { count: "exact" })
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query.listingType) {
      qb = qb.eq("listing_type", query.listingType);
    }
    if (query.region) {
      qb = qb.ilike("region", `%${query.region}%`);
    }
    if (query.type) {
      qb = qb.ilike("type", query.type);
    }
    if (query.q) {
      qb = qb.or(`title.ilike.%${query.q}%,location.ilike.%${query.q}%,region.ilike.%${query.q}%`);
    }
    const minPrice = Number(query.minPrice ?? "0");
    const maxPrice = Number(query.maxPrice ?? "0");
    if (!Number.isNaN(minPrice) && minPrice > 0) {
      qb = qb.gte("price", minPrice);
    }
    if (!Number.isNaN(maxPrice) && maxPrice > 0) {
      qb = qb.lte("price", maxPrice);
    }
    // Beds filter: supports comma-separated values like "1,3,6+"
    // "6+" means 6 or more; exact values match exactly
    if (query.minBeds) {
      const bedValues = query.minBeds.split(",").map((v) => v.trim()).filter(Boolean);
      if (bedValues.length > 0) {
        const exactBeds = bedValues.filter((v) => v !== "6+").map(Number).filter((n) => !Number.isNaN(n) && n > 0);
        const hasSixPlus = bedValues.includes("6+");
        const orParts: string[] = [];
        for (const b of exactBeds) orParts.push(`beds.eq.${b}`);
        if (hasSixPlus) orParts.push("beds.gte.6");
        if (orParts.length > 0) qb = qb.or(orParts.join(","));
      }
    }
    // Baths filter: same logic as beds
    if (query.minBaths) {
      const bathValues = query.minBaths.split(",").map((v) => v.trim()).filter(Boolean);
      if (bathValues.length > 0) {
        const exactBaths = bathValues.filter((v) => v !== "6+").map(Number).filter((n) => !Number.isNaN(n) && n > 0);
        const hasSixPlus = bathValues.includes("6+");
        const orParts: string[] = [];
        for (const b of exactBaths) orParts.push(`baths.eq.${b}`);
        if (hasSixPlus) orParts.push("baths.gte.6");
        if (orParts.length > 0) qb = qb.or(orParts.join(","));
      }
    }
    if (query.featured === "true") {
      qb = qb.eq("featured", true);
    }

    // Map bounds filter
    const swLat = Number(query.swLat);
    const swLng = Number(query.swLng);
    const neLat = Number(query.neLat);
    const neLng = Number(query.neLng);
    if (!Number.isNaN(swLat) && !Number.isNaN(swLng) && !Number.isNaN(neLat) && !Number.isNaN(neLng)) {
      qb = qb
        .gte("latitude", swLat)
        .lte("latitude", neLat)
        .gte("longitude", swLng)
        .lte("longitude", neLng)
        .not("latitude", "is", null)
        .not("longitude", "is", null);
    }

    const { data, count, error } = await qb;
    if (error) {
      app.log.error(error, "Failed to fetch properties");
      return { items: [], total: 0, page, limit };
    }

    return {
      items: (data as PropertyWithAgent[]).map(toApiProperty),
      total: count ?? 0,
      page,
      limit
    };
  });

  app.get("/stats", async () => {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return { totalProperties: 0, totalAgents: 0, regions: [], types: [] };
    }

    // Count approved properties
    const { count: totalProperties } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "approved");

    // Count agents
    const { count: totalAgents } = await supabase
      .from("agents")
      .select("id", { count: "exact", head: true });

    // Count by region
    const { data: regionRows } = await supabase
      .from("properties")
      .select("region")
      .eq("moderation_status", "approved");

    const regionMap = new Map<string, number>();
    for (const row of (regionRows ?? []) as { region: string }[]) {
      regionMap.set(row.region, (regionMap.get(row.region) ?? 0) + 1);
    }
    const regions = Array.from(regionMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Count by type
    const { data: typeRows } = await supabase
      .from("properties")
      .select("type")
      .eq("moderation_status", "approved");

    const typeMap = new Map<string, number>();
    for (const row of (typeRows ?? []) as { type: string }[]) {
      typeMap.set(row.type, (typeMap.get(row.type) ?? 0) + 1);
    }
    const types = Array.from(typeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalProperties: totalProperties ?? 0,
      totalAgents: totalAgents ?? 0,
      regions,
      types,
    };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return reply.code(503).send({ message: "Database not configured" });
    }

    const { data, error } = await supabase
      .from("properties")
      .select("*, agents!inner(id, name, company, phone, color, avatar_url)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return reply.code(404).send({ message: "Property not found" });
    }

    return toApiProperty(data as PropertyWithAgent);
  });

  app.get("/:id/related", async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as { limit?: string };

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return { items: [] };
    }

    // Fetch the source property's region and type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: source } = await (supabase as any)
      .from("properties")
      .select("region, type")
      .eq("id", id)
      .single();

    if (!source) {
      return { items: [] };
    }

    const src = source as { region: string; type: string };
    const limit = Math.min(12, Math.max(1, Number(query.limit ?? "4") || 4));

    // Find properties with matching region or type, excluding source
    const { data } = await supabase
      .from("properties")
      .select("*, agents!inner(id, name, company, phone, color, avatar_url)")
      .eq("moderation_status", "approved")
      .neq("id", id)
      .or(`region.eq.${src.region},type.eq.${src.type}`)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    return {
      items: ((data ?? []) as PropertyWithAgent[]).map(toApiProperty),
    };
  });
}
