-- GhanaDeals — Single-use SSO tokens for cross-app authentication
-- Migration 022

CREATE TABLE IF NOT EXISTS sso_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,               -- SHA-256 hash of the token (never store plaintext)
  target_app  text NOT NULL DEFAULT 'agents', -- which app this token is for
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,                 -- set on exchange, prevents replay
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by hash (single-use exchange)
CREATE INDEX IF NOT EXISTS idx_sso_tokens_hash ON sso_tokens(token_hash) WHERE used_at IS NULL;

-- Auto-cleanup: purge expired/used tokens older than 1 hour
-- (run periodically or rely on app-level cleanup)
CREATE INDEX IF NOT EXISTS idx_sso_tokens_expires ON sso_tokens(expires_at);
