-- 015: Add property reference to messages for @ property tagging
-- Also widen message_type CHECK to include 'property_ref'

-- Drop old CHECK and add wider one
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'file', 'property_ref'));

-- Add nullable property reference column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS property_ref_id uuid REFERENCES properties(id) ON DELETE SET NULL;

-- Index for quick lookup of property references in a conversation
CREATE INDEX IF NOT EXISTS idx_messages_property_ref ON messages (property_ref_id) WHERE property_ref_id IS NOT NULL;
