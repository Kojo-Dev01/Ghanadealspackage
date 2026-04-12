-- 017: Fix otherUser.avatar_url returning null for agents
-- The RPC was only reading profiles.avatar_url, but agents store their
-- avatar in the agents table. COALESCE from both tables.

CREATE OR REPLACE FUNCTION get_conversations_for_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t."lastMessageAt" DESC), '[]'::jsonb)
  FROM (
    SELECT
      c.id,
      c.property_id  AS "propertyId",
      -- Property info (null for direct conversations)
      CASE WHEN p.id IS NOT NULL THEN
        jsonb_build_object(
          'id',    p.id,
          'title', p.title,
          'image', p.image
        )
      ELSE NULL
      END AS property,
      -- The other user (buyer sees seller, seller sees buyer)
      CASE
        WHEN c.buyer_id = p_user_id THEN
          jsonb_build_object('user_id', sp.user_id, 'name', sp.name, 'email', sp.email, 'avatar_url', COALESCE(sp.avatar_url, sa.avatar_url))
        ELSE
          jsonb_build_object('user_id', bp.user_id, 'name', bp.name, 'email', bp.email, 'avatar_url', COALESCE(bp.avatar_url, ba.avatar_url))
      END AS "otherUser",
      -- Last message (lateral subquery — constant cost per row)
      lm.last_message AS "lastMessage",
      -- Unread count
      COALESCE(uc.cnt, 0)::int AS "unreadCount",
      c.last_message_at AS "lastMessageAt",
      c.created_at      AS "createdAt"
    FROM conversations c
    LEFT JOIN properties p  ON p.id = c.property_id
    JOIN profiles   bp ON bp.user_id = c.buyer_id
    JOIN profiles   sp ON sp.user_id = c.seller_id
    LEFT JOIN agents ba ON ba.user_id = c.buyer_id
    LEFT JOIN agents sa ON sa.user_id = c.seller_id
    LEFT JOIN LATERAL (
      SELECT jsonb_build_object(
        'id',           m.id,
        'content',      m.content,
        'message_type', m.message_type,
        'sender_id',    m.sender_id,
        'created_at',   m.created_at
      ) AS last_message
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) lm ON true
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS cnt
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.read_at IS NULL
    ) uc ON true
    WHERE c.buyer_id = p_user_id OR c.seller_id = p_user_id
  ) t;
$$;
