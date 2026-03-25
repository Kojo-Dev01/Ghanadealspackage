# GhanaDeals Migration Plan: Next.js + Fastify + Supabase + Wasabi

## 1. Objective
Migrate GhanaDeals from vanilla HTML/CSS/JS + Python CGI to modern:
- Frontend: Next.js (App Router + TypeScript)
- Backend API: Fastify (TypeScript)
- Database: Supabase (PostgreSQL)
- File storage: Wasabi (S3 compatible)
- Authentication: Supabase Auth (recommended)
- Mobile app: Expo using same `/v1` API

## 2. Architecture Decisions
- Use Next.js for rendering, UX, SEO, and light web-only endpoints.
- Use Fastify for all business/domain APIs used by web and mobile.
- Use Supabase for Postgres + Auth + RLS policies.
- Use Wasabi for media storage through short-lived signed URLs.

## 3. Auth Choice
### Recommended: Supabase Auth
- Native integration with Supabase and RLS.
- Lower complexity than Clerk + sync.
- Supports email/password, magic links, social auth.

### Optional later: Clerk
- Evaluate only if advanced auth UX/workflows exceed Supabase needs.

## 4. Security Standards (Must Adhere)

### 4.1 Authentication & Authorization
- JWT access + refresh token flow.
- RBAC roles: `buyer`, `agent`, `admin`.
- Per-endpoint authorization checks for ownership/admin rights.
- Enforce Supabase RLS on all user-owned data.

### 4.2 API Security
- Strict CORS allowlist by environment.
- Rate limiting for auth/search/write endpoints.
- Security headers via Helmet.
- Input validation with schema validation.
- Parameterized DB calls only.
- Request body size limits.

### 4.3 Secrets & Storage Security
- No secrets in source control.
- Use environment variables and secret managers.
- Wasabi uploads via signed URL from API only.
- Signed URLs short-lived (60-300s).

### 4.4 Monitoring & Incident Response
- Structured logging with request IDs.
- Error tracking (Sentry recommended).
- API health endpoint and metrics.
- Audit logs for admin actions.

## 5. Low Latency Plan
- Keep Fastify endpoints thin and indexed queries in Postgres.
- Add DB indexes on commonly filtered fields: `listing_type`, `region`, `price`, `created_at`.
- Use pagination and selective fields for list endpoints.
- Cache public read endpoints where safe.
- Use CDN-backed media URLs for Wasabi objects.
- Use ISR/SSR strategy in Next.js for key pages.

## 6. Endpoint Ownership Split

## 6.1 Next.js endpoints (web edge layer)
- `GET /api/health-web` web runtime health.
- `GET /api/config` non-sensitive public config.
- UI routing and server rendering only.

## 6.2 Fastify endpoints (source of truth)
All production business endpoints under `/v1`:

### Auth
- `POST /v1/auth/signup`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`

### Properties
- `GET /v1/properties`
- `GET /v1/properties/:id`
- `POST /v1/properties` (agent/admin)
- `PUT /v1/properties/:id` (owner/admin)
- `DELETE /v1/properties/:id` (owner/admin)
- `GET /v1/properties/:id/related`

### Agents
- `GET /v1/agents`
- `GET /v1/agents/:id`
- `POST /v1/agents` (admin)
- `PUT /v1/agents/:id` (admin)

### Inquiries
- `POST /v1/inquiries`
- `GET /v1/inquiries` (admin/agent scoped)
- `PUT /v1/inquiries/:id/status` (admin/agent scoped)

### User profile/favorites
- `GET /v1/users/me`
- `PUT /v1/users/me`
- `GET /v1/users/me/favorites`
- `POST /v1/users/me/favorites/:propertyId`
- `DELETE /v1/users/me/favorites/:propertyId`

### Uploads
- `POST /v1/uploads/sign`

### Admin metrics
- `GET /v1/admin/metrics`
- `GET /v1/admin/trends`

## 7. Expo Mobile Integration Standards
- Mobile app uses same Fastify `/v1` endpoints.
- Keep response contracts versioned and stable.
- Share TypeScript DTOs in `shared/types`.
- Use token auth via `Authorization: Bearer <token>`.
- Use secure token storage in Expo Secure Store.
- Provide compact mobile list endpoints if needed (e.g., quick cards payload).

## 8. Package Recommendations

### Web (Next.js)
- `next`, `react`, `react-dom`, `typescript`
- `@supabase/supabase-js`
- `swr` (or `@tanstack/react-query`)
- `chart.js`, `react-chartjs-2`
- `clsx`

### API (Fastify)
- `fastify`
- `@fastify/cors`
- `@fastify/helmet`
- `@fastify/jwt`
- `@fastify/rate-limit`
- `zod`
- `@supabase/supabase-js`
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `dotenv`

### Ops/Quality
- `eslint`, `prettier`
- `tsx` for dev runtime
- `typescript`

## 9. Implementation Phases
1. Monorepo scaffold and environment config.
2. Fastify security baseline + health/auth/property endpoints.
3. Supabase schema + RLS + seed migration.
4. Next.js page migration (home, listings, property, agents, admin).
5. Wasabi upload flow with signed URLs.
6. Expo app integration using shared contracts.
7. Observability, load tests, and hardening.

## 10. Immediate Next Step
- Install dependencies and run:
  - `npm run dev:web`
  - `npm run dev:api`
- Then wire Supabase client + first real `GET /v1/properties` query.
