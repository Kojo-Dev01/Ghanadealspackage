-- 014: Allow direct seller conversations (no property required)

-- Make property_id nullable
ALTER TABLE conversations ALTER COLUMN property_id DROP NOT NULL;

-- The existing UNIQUE(property_id, buyer_id, seller_id) already
-- allows multiple NULLs in property_id (SQL standard: NULL ≠ NULL).
-- Add a partial unique index so each buyer–seller pair gets at most
-- ONE direct (property-less) conversation.
CREATE UNIQUE INDEX idx_conversations_direct
  ON conversations (buyer_id, seller_id)
  WHERE property_id IS NULL;
