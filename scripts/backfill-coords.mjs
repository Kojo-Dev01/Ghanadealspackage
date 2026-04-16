/**
 * Backfill latitude/longitude for existing listings using Google Geocoding API.
 *
 * Usage:
 *   1. Run: node scripts/backfill-coords.mjs preview
 *      → geocodes all listings missing coordinates and shows results (dry run)
 *
 *   2. Run: node scripts/backfill-coords.mjs apply
 *      → geocodes and writes coordinates to the database
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function geocode(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:GH&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status === "OK" && json.results.length > 0) {
    const { lat, lng } = json.results[0].geometry.location;
    return { lat, lng, formatted: json.results[0].formatted_address };
  }
  return null;
}

async function getMissingListings() {
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, location, region")
    .is("latitude", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  return data;
}

async function run(dryRun) {
  if (!GOOGLE_API_KEY) {
    console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env");
    process.exit(1);
  }

  const listings = await getMissingListings();
  console.log(`\nFound ${listings.length} listings without coordinates.\n`);

  if (listings.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let success = 0;
  for (const row of listings) {
    const query = [row.location, row.region, "Ghana"].filter(Boolean).join(", ");
    const result = await geocode(query);

    if (!result) {
      console.log(`  ✗ ${row.title} — "${query}" → NO RESULT`);
      continue;
    }

    console.log(
      `  ✓ ${row.title}\n    "${query}" → ${result.lat}, ${result.lng} (${result.formatted})`,
    );

    if (!dryRun) {
      const { error } = await supabase
        .from("properties")
        .update({ latitude: result.lat, longitude: result.lng })
        .eq("id", row.id);

      if (error) {
        console.log(`    ✗ DB update failed: ${error.message}`);
      } else {
        success++;
      }
    }
  }

  if (dryRun) {
    console.log(`\nDry run complete. Run with 'apply' to write to the database.\n`);
  } else {
    console.log(`\nUpdated ${success}/${listings.length} listings.\n`);
  }
}

const cmd = process.argv[2];
if (cmd === "apply") {
  await run(false);
} else {
  await run(true);
}
