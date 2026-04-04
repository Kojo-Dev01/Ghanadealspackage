-- GhanaDeals — Persistent Notification System
-- Run against your Supabase project via the SQL editor.

-- ============================================================
-- NOTIFICATION TYPE ENUM
-- ============================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'inquiry_received',        -- Agent receives a new inquiry on their listing
    'inquiry_status_changed',  -- Buyer's inquiry status was updated
    'listing_approved',        -- Agent's listing was approved by admin
    'listing_flagged',         -- Agent's listing was flagged by admin
    'verification_approved',   -- Agent's KYC was approved
    'verification_rejected',   -- Agent's KYC was rejected
    'property_saved',          -- Agent notified that someone saved their listing
    'welcome',                 -- Welcome notification on signup
    'system'                   -- General system announcements
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL DEFAULT 'system',
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  data        jsonb NOT NULL DEFAULT '{}',   -- Flexible payload (property_id, inquiry_id, etc.)
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_user       ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read  ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created    ON notifications(created_at DESC);

-- ============================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled   boolean NOT NULL DEFAULT true,
  push_enabled    boolean NOT NULL DEFAULT true,
  in_app_enabled  boolean NOT NULL DEFAULT true,
  -- Per-type opt-outs (types listed here are disabled)
  muted_types     notification_type[] NOT NULL DEFAULT '{}',
  updated_at      timestamptz NOT NULL DEFAULT now()
);
