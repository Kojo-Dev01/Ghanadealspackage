/**
 * Seed runner — loads `supabase/migrations/002_seed_data.sql` and executes
 * it against the configured Supabase project via the admin client.
 *
 * Usage:  npx tsx apps/api/src/seed.ts
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.
 */

import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dir, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// ---- Agent seed data ----
const agents = [
  { id: "a1000000-0000-0000-0000-000000000001", name: "Kwame Asante", company: "Asante Premier Properties", phone: "+233241234567", color: "#E63946", rating: 4.9, areas: ["East Legon", "Cantonments", "Airport"], years: 12, verified: true },
  { id: "a1000000-0000-0000-0000-000000000002", name: "Ama Mensah", company: "Mensah Realty", phone: "+233242345678", color: "#3B82F6", rating: 4.8, areas: ["Airport Residential", "Ridge", "Osu"], years: 8, verified: true },
  { id: "a1000000-0000-0000-0000-000000000003", name: "Kofi Adjei", company: "Adjei Real Estate", phone: "+233243456789", color: "#10B981", rating: 4.7, areas: ["Cantonments", "East Legon Hills"], years: 10, verified: true },
  { id: "a1000000-0000-0000-0000-000000000004", name: "Abena Osei", company: "Prestige Ghana", phone: "+233244567890", color: "#8B5CF6", rating: 4.6, areas: ["Trasacco Valley", "East Legon"], years: 15, verified: true },
  { id: "a1000000-0000-0000-0000-000000000005", name: "Efua Asiedu", company: "Asiedu Rentals", phone: "+233246789012", color: "#EC4899", rating: 4.5, areas: ["Osu", "Labone", "Cantonments"], years: 6, verified: true },
  { id: "a1000000-0000-0000-0000-000000000006", name: "Yaw Darko", company: "Darko Luxury", phone: "+233247890123", color: "#6366F1", rating: 4.4, areas: ["Ridge", "Airport Residential"], years: 9, verified: true },
  { id: "a1000000-0000-0000-0000-000000000007", name: "Akua Boateng", company: "Boateng & Co", phone: "+233248901234", color: "#14B8A6", rating: 4.3, areas: ["Nhyiaeso", "Ahodwo", "Kumasi"], years: 7, verified: true }
];

// ---- Property seed data ----
const properties = [
  {
    id: "b1000000-0000-0000-0000-000000000001", agent_id: "a1000000-0000-0000-0000-000000000001",
    title: "Luxury 4-Bedroom Villa in East Legon", listing_type: "sale", price: 2800000,
    region: "Greater Accra", location: "East Legon, Accra", type: "Villa", beds: 4, baths: 4, area: 450,
    image: "/legacy/assets/properties/property-villa-1.jpg", image_lg: "/legacy/assets/properties/large_property-villa-1.jpg",
    gallery: ["/legacy/assets/properties/large_property-villa-1.jpg", "/legacy/assets/properties/large_property-interior-1.jpg", "/legacy/assets/properties/large_property-bedroom-1.jpg"],
    badges: ["verified", "premium"], photos: 24,
    description: "This stunning 4-bedroom villa in East Legon features premium finishes, a modern kitchen, private pool, and landscaped gardens.",
    amenities: ["Pool", "Garden", "Security", "Generator", "CCTV", "Parking"],
    ref: "GD-VL-001", furnishing: "Furnished", parking: "2 Covered", featured: true, moderation_status: "approved", created_at: "2026-02-15T00:00:00Z"
  },
  {
    id: "b1000000-0000-0000-0000-000000000002", agent_id: "a1000000-0000-0000-0000-000000000002",
    title: "Modern 3-Bedroom Apartment, Airport Residential", listing_type: "sale", price: 850000,
    region: "Greater Accra", location: "Airport Residential, Accra", type: "Apartment", beds: 3, baths: 2, area: 185,
    image: "/legacy/assets/properties/property-apartment-1.jpg", image_lg: "/legacy/assets/properties/large_property-apartment-1.jpg",
    gallery: ["/legacy/assets/properties/large_property-apartment-1.jpg", "/legacy/assets/properties/large_property-kitchen-1.jpg", "/legacy/assets/properties/large_property-bedroom-1.jpg"],
    badges: ["verified"], photos: 18,
    description: "A beautifully designed 3-bedroom apartment in Airport Residential with premium fittings and excellent accessibility.",
    amenities: ["Security", "Generator", "CCTV", "Parking", "Elevator"],
    ref: "GD-AP-002", furnishing: "Semi-Furnished", parking: "1 Covered", featured: false, moderation_status: "approved", created_at: "2026-02-18T00:00:00Z"
  },
  {
    id: "b1000000-0000-0000-0000-000000000003", agent_id: "a1000000-0000-0000-0000-000000000004",
    title: "Executive 5-Bedroom Mansion, Trasacco Valley", listing_type: "sale", price: 5500000,
    region: "Greater Accra", location: "Trasacco Valley, Accra", type: "House", beds: 5, baths: 6, area: 650,
    image: "/legacy/assets/properties/property-house-2.jpg", image_lg: "/legacy/assets/properties/large_property-house-2.jpg",
    gallery: ["/legacy/assets/properties/large_property-house-2.jpg", "/legacy/assets/properties/large_property-interior-1.jpg", "/legacy/assets/properties/large_property-kitchen-1.jpg"],
    badges: ["premium", "verified"], photos: 32,
    description: "An exceptional 5-bedroom executive mansion in Trasacco Valley with expansive spaces and luxury finishes.",
    amenities: ["Pool", "Garden", "Security", "Gym", "Borehole", "Parking"],
    ref: "GD-HS-003", furnishing: "Furnished", parking: "4 Covered", featured: true, moderation_status: "approved", created_at: "2026-01-28T00:00:00Z"
  },
  {
    id: "b1000000-0000-0000-0000-000000000004", agent_id: "a1000000-0000-0000-0000-000000000005",
    title: "2-Bedroom Apartment in Osu", listing_type: "rent", price: 4500, price_label: "/month",
    region: "Greater Accra", location: "Osu, Accra", type: "Apartment", beds: 2, baths: 2, area: 120,
    image: "/legacy/assets/properties/property-interior-1.jpg", image_lg: "/legacy/assets/properties/large_property-interior-1.jpg",
    gallery: ["/legacy/assets/properties/large_property-interior-1.jpg", "/legacy/assets/properties/large_property-bedroom-1.jpg", "/legacy/assets/properties/large_property-kitchen-1.jpg"],
    badges: ["verified"], photos: 14,
    description: "A stylish 2-bedroom rental in Osu with great access to restaurants, nightlife, and business districts.",
    amenities: ["Security", "Generator", "Parking", "Fitted Kitchen"],
    ref: "GD-RT-004", furnishing: "Furnished", parking: "1 Covered", featured: false, moderation_status: "pending", created_at: "2026-02-20T00:00:00Z"
  },
  {
    id: "b1000000-0000-0000-0000-000000000005", agent_id: "a1000000-0000-0000-0000-000000000006",
    title: "Luxury Penthouse, Ridge", listing_type: "rent", price: 8000, price_label: "/month",
    region: "Greater Accra", location: "Ridge, Accra", type: "Apartment", beds: 3, baths: 3, area: 250,
    image: "/legacy/assets/properties/property-apartment-2.jpg", image_lg: "/legacy/assets/properties/large_property-apartment-2.jpg",
    gallery: ["/legacy/assets/properties/large_property-apartment-2.jpg", "/legacy/assets/properties/large_property-interior-1.jpg", "/legacy/assets/properties/large_property-bedroom-1.jpg"],
    badges: ["premium", "verified"], photos: 22,
    description: "An extraordinary penthouse in Ridge featuring panoramic views and premium finishing throughout.",
    amenities: ["Pool", "Security", "Generator", "CCTV", "Gym", "Elevator"],
    ref: "GD-RT-005", furnishing: "Furnished", parking: "2 Covered", featured: true, moderation_status: "approved", created_at: "2026-02-22T00:00:00Z"
  },
  {
    id: "b1000000-0000-0000-0000-000000000006", agent_id: "a1000000-0000-0000-0000-000000000007",
    title: "Furnished 2-Bed Apartment, Kumasi", listing_type: "rent", price: 2500, price_label: "/month",
    region: "Ashanti", location: "Nhyiaeso, Kumasi", type: "Apartment", beds: 2, baths: 1, area: 95,
    image: "/legacy/assets/properties/property-apartment-1.jpg", image_lg: "/legacy/assets/properties/large_property-apartment-1.jpg",
    gallery: ["/legacy/assets/properties/large_property-apartment-1.jpg", "/legacy/assets/properties/large_property-interior-1.jpg", "/legacy/assets/properties/large_property-kitchen-1.jpg"],
    badges: [], photos: 11,
    description: "A well-furnished 2-bedroom apartment in Nhyiaeso, Kumasi, suitable for professionals and families.",
    amenities: ["Security", "Parking", "Fitted Kitchen"],
    ref: "GD-RT-006", furnishing: "Furnished", parking: "1 Open", featured: false, moderation_status: "pending", created_at: "2026-02-25T00:00:00Z"
  },
  {
    id: "b1000000-0000-0000-0000-000000000007", agent_id: "a1000000-0000-0000-0000-000000000003",
    title: "3-Bedroom Townhouse, East Legon Hills", listing_type: "sale", price: 1200000,
    region: "Greater Accra", location: "East Legon Hills, Accra", type: "House", beds: 3, baths: 3, area: 280,
    image: "/legacy/assets/properties/property-house-2.jpg", image_lg: "/legacy/assets/properties/large_property-house-2.jpg",
    gallery: ["/legacy/assets/properties/large_property-house-2.jpg", "/legacy/assets/properties/large_property-bedroom-1.jpg"],
    badges: ["verified"], photos: 16,
    description: "A modern 3-bedroom townhouse in the growing East Legon Hills community with excellent amenities.",
    amenities: ["Garden", "Security", "Parking", "Borehole"],
    ref: "GD-HS-007", furnishing: "Semi-Furnished", parking: "2 Covered", featured: false, moderation_status: "flagged", created_at: "2026-03-01T00:00:00Z"
  },
  {
    id: "b1000000-0000-0000-0000-000000000008", agent_id: "a1000000-0000-0000-0000-000000000001",
    title: "Premium 4-Bed Duplex, Cantonments", listing_type: "sale", price: 3200000,
    region: "Greater Accra", location: "Cantonments, Accra", type: "House", beds: 4, baths: 5, area: 520,
    image: "/legacy/assets/properties/property-villa-1.jpg", image_lg: "/legacy/assets/properties/large_property-villa-1.jpg",
    gallery: ["/legacy/assets/properties/large_property-villa-1.jpg", "/legacy/assets/properties/large_property-kitchen-1.jpg"],
    badges: ["premium", "verified"], photos: 28,
    description: "A premium duplex in Cantonments with spacious interiors, modern design, and top-tier finishes.",
    amenities: ["Pool", "Garden", "Security", "Generator", "CCTV", "Gym", "Parking"],
    ref: "GD-HS-008", furnishing: "Furnished", parking: "3 Covered", featured: true, moderation_status: "approved", created_at: "2026-03-05T00:00:00Z"
  }
];

async function seed() {
  console.log("Seeding agents...");
  const { error: agentError } = await supabase.from("agents").upsert(agents, { onConflict: "id" });
  if (agentError) {
    console.error("Failed to seed agents:", agentError.message);
    process.exit(1);
  }
  console.log(`  ✓ ${agents.length} agents upserted`);

  console.log("Seeding properties...");
  const { error: propError } = await supabase.from("properties").upsert(properties, { onConflict: "id" });
  if (propError) {
    console.error("Failed to seed properties:", propError.message);
    process.exit(1);
  }
  console.log(`  ✓ ${properties.length} properties upserted`);

  console.log("Done!");
}

seed();
