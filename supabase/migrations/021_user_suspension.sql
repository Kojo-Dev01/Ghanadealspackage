-- GhanaDeals — User account suspension
-- Migration 021

-- Add suspended flag and optional reason to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;
