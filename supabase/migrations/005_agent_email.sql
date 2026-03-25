-- Add email column to agents for notification delivery

ALTER TABLE agents ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

-- Backfill from auth.users where possible
UPDATE agents
SET email = u.email
FROM auth.users u
WHERE agents.user_id = u.id
  AND agents.email = '';
