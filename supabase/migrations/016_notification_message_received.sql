-- 016: Add 'message_received' to notification_type enum
-- The conversations route creates notifications with type 'message_received'
-- but it was missing from the original enum definition.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'message_received';
