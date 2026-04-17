-- GhanaDeals — Email OTP verification
-- Migration 019

-- Track whether email is verified on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- OTP codes table
CREATE TABLE IF NOT EXISTS email_otps (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text NOT NULL,
  code                text NOT NULL,
  verification_token  text NOT NULL,
  expires_at          timestamptz NOT NULL,
  used                boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_user ON email_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON email_otps(user_id, code, used);

-- Clean up expired OTPs periodically (optional cron, or handled in app logic)
-- Auto-expire: app checks expires_at on verification

-- Enable RLS
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on email_otps' AND tablename = 'email_otps') THEN
    CREATE POLICY "Service role full access on email_otps" ON email_otps FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
