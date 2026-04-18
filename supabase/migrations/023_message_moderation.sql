-- 023: Add soft-delete columns for admin message moderation
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Index for quick filtering of non-deleted messages
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages (deleted_at) WHERE deleted_at IS NOT NULL;
