-- ============================================================
-- Cleanup script: Remove all agents (and their listings) except
-- the agent with email dotunolaiya62@gmail.com
--
-- The dual-role restructuring means old agent records are
-- incompatible. This script:
--   1. Identifies the agent to keep
--   2. Collects property IDs that will be deleted (for cleanup)
--   3. Removes stale saved_properties references from profiles
--   4. Deletes conversations where the seller is a removed agent
--   5. Deletes agent_reviews for removed agents
--   6. Deletes the agents (properties + inquiries cascade automatically)
--   7. Demotes removed agents' auth role back to 'buyer'
-- ============================================================

BEGIN;

-- 1. Identify the agent to keep
DO $$
DECLARE
  keep_id uuid;
BEGIN
  SELECT id INTO keep_id FROM agents WHERE email = 'dotunolaiya62@gmail.com';
  IF keep_id IS NULL THEN
    RAISE EXCEPTION 'Agent with email dotunolaiya62@gmail.com not found — aborting';
  END IF;
  RAISE NOTICE 'Keeping agent: %', keep_id;
END $$;

-- 2. Preview what will be deleted (informational)
SELECT 'Agents to delete' AS action, count(*) FROM agents WHERE email != 'dotunolaiya62@gmail.com';
SELECT 'Properties to delete' AS action, count(*) FROM properties WHERE agent_id IN (SELECT id FROM agents WHERE email != 'dotunolaiya62@gmail.com');
SELECT 'Conversations to delete' AS action, count(*) FROM conversations WHERE seller_id IN (SELECT user_id FROM agents WHERE email != 'dotunolaiya62@gmail.com' AND user_id IS NOT NULL);

-- 3. Collect property IDs being removed (for saved_properties cleanup)
CREATE TEMP TABLE doomed_properties AS
  SELECT id FROM properties
  WHERE agent_id IN (SELECT id FROM agents WHERE email != 'dotunolaiya62@gmail.com');

-- 4. Clean stale saved_properties arrays in profiles
UPDATE profiles
SET saved_properties = array(
  SELECT unnest(saved_properties)
  EXCEPT
  SELECT id FROM doomed_properties
)
WHERE saved_properties && (SELECT array_agg(id) FROM doomed_properties);

-- 5. Delete conversations where seller is a removed agent
--    (messages cascade via conversation ON DELETE CASCADE)
DELETE FROM conversations
WHERE seller_id IN (
  SELECT user_id FROM agents
  WHERE email != 'dotunolaiya62@gmail.com' AND user_id IS NOT NULL
);

-- 6. Delete notifications for removed agents' user_ids
DELETE FROM notifications
WHERE user_id IN (
  SELECT user_id FROM agents
  WHERE email != 'dotunolaiya62@gmail.com' AND user_id IS NOT NULL
);

-- 7. Delete the agents (properties, inquiries, reviews cascade automatically)
DELETE FROM agents WHERE email != 'dotunolaiya62@gmail.com';

-- 8. Demote removed users' role back to 'buyer' in auth metadata
--    (their user_ids were collected before agents were deleted,
--     so we use profiles + the fact that they no longer have an agent record)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "buyer"}'::jsonb
WHERE id NOT IN (SELECT user_id FROM agents WHERE user_id IS NOT NULL)
  AND raw_user_meta_data->>'role' = 'agent';

-- 9. Cleanup
DROP TABLE doomed_properties;

COMMIT;
