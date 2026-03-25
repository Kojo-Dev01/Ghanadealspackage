-- GhanaDeals — Initial database schema
-- Run against your Supabase project via the SQL editor or supabase db push.

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('sale', 'rent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'flagged', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE inquiry_status AS ENUM ('new', 'read', 'responded', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- AGENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS agents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name        text NOT NULL,
  company     text NOT NULL,
  phone       text NOT NULL DEFAULT '',
  color       text NOT NULL DEFAULT '#3B82F6',
  rating      numeric(2,1) NOT NULL DEFAULT 0,
  areas       text[] NOT NULL DEFAULT '{}',
  years       int NOT NULL DEFAULT 0,
  verified    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);

-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title             text NOT NULL,
  listing_type      listing_type NOT NULL DEFAULT 'sale',
  price             numeric(14,2) NOT NULL DEFAULT 0,
  price_label       text,                        -- e.g. "/month"
  region            text NOT NULL DEFAULT '',
  location          text NOT NULL DEFAULT '',
  type              text NOT NULL DEFAULT '',     -- Villa, Apartment, House, …
  beds              int NOT NULL DEFAULT 0,
  baths             int NOT NULL DEFAULT 0,
  area              numeric(10,2) NOT NULL DEFAULT 0,
  description       text NOT NULL DEFAULT '',
  image             text NOT NULL DEFAULT '',
  image_lg          text,
  gallery           text[] NOT NULL DEFAULT '{}',
  badges            text[] NOT NULL DEFAULT '{}',
  photos            int NOT NULL DEFAULT 0,
  amenities         text[] NOT NULL DEFAULT '{}',
  ref               text NOT NULL DEFAULT '',
  furnishing        text NOT NULL DEFAULT '',
  parking           text NOT NULL DEFAULT '',
  featured          boolean NOT NULL DEFAULT false,
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  moderated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_agent     ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing   ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_region    ON properties(region);
CREATE INDEX IF NOT EXISTS idx_properties_status    ON properties(moderation_status);
CREATE INDEX IF NOT EXISTS idx_properties_created   ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_featured  ON properties(featured) WHERE featured = true;

-- ============================================================
-- INQUIRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS inquiries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT '',
  email       text NOT NULL,
  phone       text NOT NULL DEFAULT '',
  message     text NOT NULL DEFAULT '',
  status      inquiry_status NOT NULL DEFAULT 'new',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status   ON inquiries(status);

-- ============================================================
-- AUDIT LOG  (lightweight admin action log)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  target_type text,            -- 'property', 'agent', …
  target_id   uuid,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log  ENABLE ROW LEVEL SECURITY;

-- Public can read approved properties
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read approved properties' AND tablename = 'properties') THEN
    CREATE POLICY "Public read approved properties" ON properties FOR SELECT USING (moderation_status = 'approved');
  END IF;
END $$;

-- Service role (API) can do everything
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on properties' AND tablename = 'properties') THEN
    CREATE POLICY "Service role full access on properties" ON properties FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Public can read agents
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read agents' AND tablename = 'agents') THEN
    CREATE POLICY "Public read agents" ON agents FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on agents' AND tablename = 'agents') THEN
    CREATE POLICY "Service role full access on agents" ON agents FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Inquiries: insert for anyone, select/update for service role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can create inquiries' AND tablename = 'inquiries') THEN
    CREATE POLICY "Anyone can create inquiries" ON inquiries FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on inquiries' AND tablename = 'inquiries') THEN
    CREATE POLICY "Service role full access on inquiries" ON inquiries FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Audit log: service role only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on audit_log' AND tablename = 'audit_log') THEN
    CREATE POLICY "Service role full access on audit_log" ON audit_log FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS properties_updated_at ON properties;
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS agents_updated_at ON agents;
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
