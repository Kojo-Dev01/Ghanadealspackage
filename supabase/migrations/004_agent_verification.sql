-- Agent verification / KYC workflow
-- Adds verification status, KYC document storage, and audit fields to agents table

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new verification columns
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS kyc_documents       jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at         timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason    text;

-- Keep the existing `verified` boolean in sync:
-- verified = true when verification_status = 'approved'
-- We update existing verified agents to 'approved' status
UPDATE agents SET verification_status = 'approved', verified_at = now()
  WHERE verified = true AND verification_status = 'unverified';

CREATE INDEX IF NOT EXISTS idx_agents_verification ON agents(verification_status);
