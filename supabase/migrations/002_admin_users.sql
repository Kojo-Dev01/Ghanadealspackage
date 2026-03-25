-- GhanaDeals — Admin users & role-based access control
-- Run after 001_initial_schema.sql

-- ============================================================
-- ADMIN ROLE ENUM
-- ============================================================

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'moderator', 'customer_service');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- ADMIN USERS TABLE
-- ============================================================
-- Links a Supabase auth user to an admin role.
-- The role is stored HERE (not in JWT or user_metadata) and is
-- read fresh from the DB on every request so that revocations
-- take effect immediately.

CREATE TABLE IF NOT EXISTS admin_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  name        text NOT NULL DEFAULT '',
  role        admin_role NOT NULL DEFAULT 'customer_service',
  active      boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role    ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active  ON admin_users(active) WHERE active = true;

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on admin_users' AND tablename = 'admin_users') THEN
    CREATE POLICY "Service role full access on admin_users" ON admin_users FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
