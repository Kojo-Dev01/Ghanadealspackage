-- Add a column to store the reason when a listing is rejected/flagged
ALTER TABLE properties ADD COLUMN IF NOT EXISTS moderation_reason text;
