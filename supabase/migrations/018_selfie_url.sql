-- Add selfie_url column to agents table for live face verification capture
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS selfie_url text;
