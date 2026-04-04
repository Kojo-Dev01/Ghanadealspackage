-- ============================================================
-- Migration 007: Tier 1 Features
-- Map search (lat/lng), Floor plans, Agent reviews
-- ============================================================

-- 1. Add latitude/longitude to properties for map-based search
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS latitude  numeric(10, 7),
  ADD COLUMN IF NOT EXISTS longitude numeric(10, 7);

-- 2. Add floor_plans array to properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS floor_plans text[] DEFAULT '{}';

-- 3. Create agent_reviews table
CREATE TABLE IF NOT EXISTS agent_reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, user_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng
  ON properties (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent
  ON agent_reviews (agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_reviews_user
  ON agent_reviews (user_id);

-- 5. Enable RLS on agent_reviews
ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read of reviews
CREATE POLICY "Anyone can read reviews"
  ON agent_reviews FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own reviews
CREATE POLICY "Users can insert own reviews"
  ON agent_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reviews
CREATE POLICY "Users can update own reviews"
  ON agent_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON agent_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Trigger to auto-update updated_at on agent_reviews
CREATE TRIGGER set_agent_reviews_updated_at
  BEFORE UPDATE ON agent_reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
