# GhanaDeals — Authentication System

## Overview

GhanaDeals uses a custom JWT-based authentication system built on top of Supabase Auth. There are **two separate auth domains**: the public-facing system (buyers and sellers) and the internal admin system. They do not share sessions, cookies, or login flows.

A core design decision: **all accounts start as buyer accounts**. Signing up directly as an agent/seller is blocked. Sellers are buyers who have explicitly upgraded their account, giving them a dual identity — they retain all buyer capabilities while gaining seller capabilities.

---

## Account Roles

### Public Roles

| Role | JWT value | DB records | Capabilities |
|------|-----------|------------|--------------|
| **Buyer** | `"buyer"` | `profiles` row | Browse listings, save properties, send inquiries, message sellers, manage account |
| **Seller (Agent)** | `"agent"` | `profiles` row **+** `agents` row | Everything a buyer can do, plus: create/manage listings, receive inquiries, access the seller dashboard at agents.ghanadeals.com |

> **Dual identity:** When a buyer upgrades to seller, their `profiles` row is kept intact and continues to be used for buyer features (saved properties, search preferences, inbox as buyer). The new `agents` row is created on top and linked via `user_id`. The JWT role field updates from `"buyer"` to `"agent"` but both DB records co-exist. The login response always returns both `profile` and `agent` objects for seller accounts.

### Admin Roles (separate system)

| Role | Permissions |
|------|-------------|
| `super_admin` | Full access — all listings, agents, users, inquiries, metrics, and admin user management |
| `moderator` | Listings (read/moderate/feature/delete), agent verification, stats/metrics |
| `customer_service` | Users (read/update), inquiries (read/update), stats/metrics |

Admin roles are stored in the `admin_users` table and are **read fresh from the database on every request** — not cached in the JWT. This means role changes and deactivations take effect immediately without waiting for a token to expire.

---

## Sign-up Flow (Buyer Only)

New users can only create **buyer** accounts. The `accountType` field in the signup API accepts only `"buyer"` — this is enforced at the schema level (`z.enum(["buyer"])`), not just at the UI layer. There is no way to register directly as a seller.

**Steps:**

1. User submits: `name`, `email`, `phone`, `password`, `accountType: "buyer"`
2. API (`POST /signup`) creates a Supabase `auth.users` entry with `email_confirm: true` and `user_metadata: { role: "buyer" }`
3. A `profiles` row is inserted for the new user
4. A 6-digit OTP is generated, stored in `email_otps` with a 10-minute expiry and a 32-byte random `verification_token`
5. The OTP email is sent to the user
6. The API responds with `needsVerification: true` — **no session cookie is issued yet**

**Email must be verified before any authenticated action.**

---

## Email Verification (OTP)

After signup (and on first login attempt if still unverified):

1. The user enters their 6-digit code at the verification screen
2. `POST /verify-otp` receives the code, `userId`, and `verificationToken`
3. The API checks: code matches, not expired, token matches, not already used
4. On success: `profiles.email_verified` is set to `true`, the OTP row is marked `used: true`
5. A JWT is issued and the session cookie is set — the user is now fully logged in

OTP details:
- **Length:** 6 digits
- **Expiry:** 10 minutes
- **Verification token:** 32 random bytes (hex) — ties the OTP to the specific request and prevents replay
- **Resend:** `POST /send-otp` (rate limited to 5 per minute — previous unused OTP is marked used first)
- **Cancel:** `POST /cancel-verification` deletes the unverified account entirely

---

## Login Flow

`POST /login` accepts `email` and `password`.

The API performs these checks in order:

1. Validates credentials against Supabase Auth
2. Checks `profiles.suspended` — suspended accounts receive a 403 with the suspension reason
3. Checks `profiles.email_verified` — unverified accounts trigger a fresh OTP and receive `needsVerification: true` (403)
4. On success: fetches the user's role from `auth.users.user_metadata.role`
5. If role is `"agent"`, the `agents` table row is also fetched
6. The `profiles` row is always fetched (agents are also buyers)
7. Issues a signed JWT: `{ sub, email, role, name }`, 7-day expiry
8. Sets the `gd_web_session` httpOnly cookie (or `gd_agent_session` for the agents app)
9. Returns `{ token, user, agent, profile }`

---

## Session Management

### Cookies

| App | Cookie name | HttpOnly | Expiry | SameSite |
|-----|------------|----------|--------|----------|
| apps/web (buyer/seller) | `gd_web_session` | Yes | 7 days | Lax |
| apps/agents (seller dashboard) | `gd_agent_session` | Yes | 7 days | Lax |
| apps/admin | `gd_admin_session` | Yes | 8 hours | Lax |
| apps/admin (UI nav) | `gd_admin_role` | **No** | 8 hours | Lax |

`gd_admin_role` is readable by client-side JS solely for rendering the correct sidebar nav items. All actual permission enforcement is server-side.

### JWT Payload

**Buyer / Seller:**
```json
{ "sub": "<uuid>", "email": "user@example.com", "role": "buyer|agent", "name": "Full Name" }
```

**Admin:**
```json
{ "sub": "<uuid>", "email": "admin@example.com", "role": "super_admin|moderator|customer_service" }
```

- Signed with `JWT_SECRET` environment variable (Fastify JWT plugin)
- Verified server-side via `request.jwtVerify()` on all protected routes
- On the web app, session is restored on mount by calling `GET /api/auth/me` (cookie sent automatically)

---

## Seller Upgrade Flow

Buyers can upgrade to seller status at any time from `/sellers/register`. This is a **one-way, permanent upgrade** — once upgraded, the account permanently has seller access.

### Step 1 — Account Info

The user fills in:
- **Company name** (optional)
- **Phone** (optional, falls back to profile phone)
- **Operating regions** (required, at least 1 of Ghana's 16 regions)

`POST /buyer/upgrade-to-seller` (requires valid `gd_web_session` cookie):

1. Checks the user is not already an agent (prevents duplicate upgrades — returns 409 if already has an `agents` row)
2. Reads the buyer's `name`, `email`, `phone` from `profiles`
3. Inserts a new row in `agents` with `user_id`, `name`, `email`, `company`, `phone`, `areas`
4. Updates `auth.users.user_metadata.role` to `"agent"` via Supabase Admin API
5. If the metadata update fails, the new `agents` row is rolled back
6. Issues a new JWT with `role: "agent"`, 7-day expiry
7. Returns `{ token, user, agent }`

The frontend auth context (`useAuth`) updates immediately with the new token and agent data. The user is redirected to step 2.

### Step 2 — KYC Verification

The user uploads identity documents:
- **Ghana Card** (front and back scan) or
- **Passport** (bio-data page)

Documents are uploaded to Wasabi S3 under the `kyc/` folder via `/api/uploads/sign`. The agent's `verification_status` is set to `"pending"`. An admin must review and approve the documents, changing `verification_status` to `"approved"`. Until approved, sellers can still access the dashboard but listings may have limited visibility.

**Verification status values:** `unverified` → `pending` → `approved` / `rejected`

---

## Protected Routes

### Web App (`apps/web`)

`apps/web/middleware.ts` checks for the `gd_web_session` cookie on all `/account/*` routes. If missing, the user is redirected to `/`.

| Protected path | Requires |
|---------------|----------|
| `/account/*` | Valid `gd_web_session` cookie |

All other pages (listings, property detail, home) are publicly accessible.

### API (`apps/api`)

All routes under the buyer and agent namespaces use `request.jwtVerify()` which validates the JWT signature. The agent routes additionally check that `role === "agent"`.

| Route group | Auth required | Role check |
|-------------|--------------|------------|
| `POST /signup`, `POST /login`, `POST /verify-otp`, `POST /send-otp`, `POST /forgot-password`, `POST /reset-password` | None | None |
| `GET /me` | JWT | None |
| `GET /buyer/profile`, `PUT /buyer/profile`, `GET /buyer/saved`, `POST /buyer/saved/:id`, `DELETE /buyer/saved/:id`, `GET /buyer/inquiries` | JWT | None (any authenticated user) |
| `POST /buyer/upgrade-to-seller` | JWT | Role must be `"buyer"` (409 if already agent) |
| `GET /agent/*`, `POST /agent/*` | JWT | `role === "agent"` |
| `POST /admin/auth/login` | None | — |
| `GET /admin/*`, `POST /admin/*` | JWT (admin) | Role looked up from `admin_users` table per-request |

---

## Password Reset

`POST /forgot-password` — accepts `email`. If the email matches a `profiles` record, a Supabase password reset link is sent. The link redirects the user to the reset page.

`POST /reset-password` — accepts `accessToken`, `refreshToken` (from the Supabase link), and `password`. The password is updated via Supabase Auth admin and the tokens are invalidated.

---

## Account Suspension

Admins can suspend any buyer or seller account. The `profiles` table has:
- `suspended` (boolean)
- `suspended_reason` (text, optional)

Suspended accounts are blocked at login — the API returns 403 with the suspension reason. Active sessions are not immediately invalidated (they expire naturally after 7 days), but any API call that requires `jwtVerify()` will still proceed unless routes also check the suspension flag. Suspension is primarily enforced at the login gate.

---

## Database Schema (Auth-Related Tables)

### `profiles` — buyer identity
```
user_id          uuid  (FK → auth.users, unique)
name             text
email            text
phone            text
avatar_url       text
saved_properties uuid[]
search_preferences jsonb
email_verified   boolean  (false until OTP verified)
suspended        boolean
suspended_reason text
```

### `agents` — seller identity
```
id                  uuid  (PK)
user_id             uuid  (FK → auth.users, nullable for legacy agents)
name                text
email               text
company             text
phone               text
color               text  (profile accent colour)
rating              numeric(2,1)
areas               text[]  (operating regions)
years               int  (experience)
verified            boolean  (legacy field)
verification_status enum: unverified | pending | approved | rejected
kyc_documents       jsonb  (S3 URLs of uploaded documents)
avatar_url          text
```

### `email_otps` — verification codes
```
user_id            uuid  (FK → auth.users)
email              text
code               text  (6-digit string)
expires_at         timestamptz
verification_token text  (32-byte random hex)
used               boolean
```

### `admin_users` — admin accounts
```
user_id  uuid  (FK → auth.users)
email    text
name     text
role     enum: super_admin | moderator | customer_service
active   boolean
```

---

## Security Properties

| Property | Implementation |
|----------|---------------|
| Password hashing | Delegated to Supabase Auth (bcrypt) |
| JWT signing | HS256, `JWT_SECRET` env var, enforced at startup |
| Session cookies | httpOnly, secure in production, sameSite=lax |
| OTP replay prevention | `verification_token` ties code to the request; `used` flag prevents reuse |
| Rate limiting | Signup: 10/min · Login: 15/min · OTP send: 5/min |
| Suspended accounts | Blocked at login; reason surfaced to user |
| Admin role staleness | Role read from DB per-request — changes and deactivations are immediate |
| Direct agent signup | Blocked at schema level (`accountType: z.enum(["buyer"])`) |
| CORS | Configured via env var, credentials allowed |
| EXIF / metadata | Not currently stripped from uploaded images |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC AUTH                          │
│                                                         │
│  POST /signup ──► Only "buyer" accepted                 │
│       │                                                 │
│       ▼                                                 │
│  auth.users (Supabase)  +  profiles row                 │
│       │                                                 │
│       ▼                                                 │
│  OTP email sent  ──►  POST /verify-otp                  │
│       │                                                 │
│       ▼                                                 │
│  JWT issued  ──►  gd_web_session cookie (7 days)        │
│                                                         │
│  Role: "buyer"  ──────────────────────────────────────► │
│       │                 Buyer capabilities              │
│       │                 (profiles row)                  │
│       │                                                 │
│  POST /buyer/upgrade-to-seller                          │
│       │                                                 │
│       ▼                                                 │
│  Role: "agent" ◄── new JWT issued                       │
│       │                                                 │
│       ├──► profiles row  (KEPT — buyer capabilities)    │
│       └──► agents row    (NEW — seller capabilities)    │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    ADMIN AUTH (separate)                │
│                                                         │
│  POST /admin/auth/login                                 │
│       │                                                 │
│       ▼                                                 │
│  auth.users  +  admin_users table                       │
│       │                                                 │
│       ▼                                                 │
│  JWT issued  ──►  gd_admin_session cookie (8 hours)     │
│                   gd_admin_role cookie (readable, 8h)   │
│                                                         │
│  Role read from admin_users DB on every request         │
│  (not cached in JWT)                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| [apps/api/src/routes/auth.ts](../apps/api/src/routes/auth.ts) | Signup, login, OTP verification, password reset, `/me` |
| [apps/api/src/routes/buyer.ts](../apps/api/src/routes/buyer.ts) | Buyer profile, saved properties, inquiries, upgrade-to-seller |
| [apps/api/src/routes/admin-auth.ts](../apps/api/src/routes/admin-auth.ts) | Admin login |
| [apps/api/src/lib/permissions.ts](../apps/api/src/lib/permissions.ts) | Admin RBAC — role definitions and permission checks |
| [apps/web/middleware.ts](../apps/web/middleware.ts) | Protects `/account/*` routes on the web app |
| [apps/web/components/auth-provider.tsx](../apps/web/components/auth-provider.tsx) | Frontend auth context — login, signup, upgrade, session restore |
| [apps/web/app/sellers/register/page.tsx](../apps/web/app/sellers/register/page.tsx) | 2-step seller upgrade UI |
| [apps/web/app/api/auth/](../apps/web/app/api/auth/) | Next.js route handlers proxying auth calls to the API |
