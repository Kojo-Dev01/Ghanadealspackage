# GhanaDeals Chat System — Mobile Implementation Guide

> Complete specification for the real-time messaging system used in both the buyer and seller web dashboards.  
> Use this document to implement an identical chat experience in React Native / Flutter / SwiftUI / Kotlin that talks to the **same API server**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication](#2-authentication)
3. [REST API Endpoints](#3-rest-api-endpoints)
4. [WebSocket Protocol](#4-websocket-protocol)
5. [Image Uploads](#5-image-uploads)
6. [Database Schema](#6-database-schema)
7. [Data Types](#7-data-types)
8. [Client Implementation Guide](#8-client-implementation-guide)
9. [Push Notifications](#9-push-notifications)

---

## 1. Architecture Overview

```
┌──────────────┐       REST / WS        ┌──────────────────┐     Postgres     ┌───────────────┐
│  Mobile App  │ ─────────────────────▶  │  Fastify API     │ ──────────────▶  │  Supabase DB  │
│  (iOS/Andr.) │ ◀─ WS (real-time) ───  │  :4000           │                  │               │
└──────────────┘                         │  JWT auth         │                  └───────────────┘
                                         │  @fastify/ws      │
                                         │  Redis pub/sub    │ ──▶ ┌──────────┐
                                         └──────────────────┘     │  Redis   │ (multi-instance fanout)
                                                │                  └──────────┘
                                                │ S3 upload
                                                ▼
                                         ┌──────────────────┐
                                         │  Wasabi S3       │ (chat image storage)
                                         └──────────────────┘
```

**Key points:**
- API base URL: `https://your-domain.com` (port 4000 in development)
- All REST endpoints are under `/v1/conversations`
- WebSocket endpoint: `wss://your-domain.com/v1/ws?token=<jwt>`
- Authentication: Bearer JWT in `Authorization` header
- Image storage: Wasabi S3 via `POST /v1/uploads/chat-image`

---

## 2. Authentication

### 2.1 Roles & Dual-Role Model

The system has a **singular `role` field** — either `"buyer"` or `"agent"`.  
An **agent is implicitly also a buyer**. When a buyer upgrades to agent:
- Their `profiles` row is kept (buyer data).
- A new `agents` row is created (seller data).
- Their `user_metadata.role` and JWT `role` change to `"agent"`.
- They can use **both** buyer features (browsing, saving, messaging as buyer) and agent features (listing properties, seller dashboard).

The login endpoint **always** returns both `agent` and `profile` records when applicable.

### 2.2 Signup

```
POST /v1/auth/signup
Content-Type: application/json
```

**Request body:**
```json
{
  "name": "Kofi Mensah",
  "email": "user@example.com",
  "phone": "+233244000000",
  "password": "securePassword123",
  "accountType": "buyer"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | 2–100 chars. |
| `email` | string | Yes | Valid email. |
| `phone` | string | Yes | 6–20 chars. |
| `password` | string | Yes | 8–128 chars. |
| `accountType` | enum | Yes | `"buyer"` or `"agent"`. |

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Kofi Mensah",
    "role": "buyer"
  },
  "agent": null,
  "profile": {
    "id": "uuid",
    "name": "Kofi Mensah",
    "email": "user@example.com",
    "phone": "+233244000000",
    "avatar_url": null,
    "saved_properties": [],
    "search_preferences": null
  }
}
```

- If `accountType === "buyer"` → creates a `profiles` row. `agent` is `null`.
- If `accountType === "agent"` → creates an `agents` row. `profile` is `null`.
- **409** if email already exists.

**Rate limit:** 10 requests/minute.

### 2.3 Login

```
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200) — Buyer:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Kofi Mensah",
    "role": "buyer"
  },
  "agent": null,
  "profile": {
    "id": "uuid",
    "name": "Kofi Mensah",
    "email": "user@example.com",
    "phone": "+233244000000",
    "avatar_url": "https://...",
    "saved_properties": ["uuid1", "uuid2"],
    "search_preferences": {}
  }
}
```

**Response (200) — Agent (dual-role):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "ama@example.com",
    "name": "Ama Osei",
    "role": "agent"
  },
  "agent": {
    "id": "uuid",
    "name": "Ama Osei",
    "company": "Osei Realty",
    "phone": "+233244000001",
    "verified": true,
    "rating": 4.5,
    "areas": ["Greater Accra", "Ashanti"],
    "years": 5,
    "color": "#3B82F6"
  },
  "profile": {
    "id": "uuid",
    "name": "Ama Osei",
    "email": "ama@example.com",
    "phone": "+233244000001",
    "avatar_url": "https://...",
    "saved_properties": [],
    "search_preferences": null
  }
}
```

**Key points:**
- `agent` is non-null only when `role === "agent"`.
- `profile` is **always** fetched (agents keep their buyer profile after upgrade).
- `profile` can be `null` for agents who signed up directly as agents (no buyer profile was created).
- **401** for invalid credentials.

**Rate limit:** 15 requests/minute.

### 2.4 Get Current User

```
GET /v1/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Kofi Mensah",
    "role": "buyer"
  },
  "agent": null,
  "profile": { "..." }
}
```

Same shape as login response but without `token`. Use this to validate a stored token on app launch.

### 2.5 Upgrade Buyer → Agent

Allows a buyer to add seller capabilities without losing their buyer profile.

```
POST /v1/buyer/upgrade-to-seller
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "company": "Mensah Properties",
  "phone": "+233244000000",
  "areas": ["Greater Accra", "Ashanti"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `company` | string | No | Up to 200 chars. Defaults to `""`. |
| `phone` | string | No | Override phone from profile. |
| `areas` | string[] | Yes | 1–20 regions/areas the agent covers. |

**Response (200):**
```json
{
  "token": "eyJ...(new JWT with role=agent)...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Kofi Mensah",
    "role": "agent"
  },
  "agent": {
    "id": "uuid",
    "name": "Kofi Mensah",
    "company": "Mensah Properties",
    "phone": "+233244000000",
    "verified": false,
    "rating": 0,
    "areas": ["Greater Accra", "Ashanti"],
    "years": 0,
    "color": "#3B82F6"
  }
}
```

**Important:** The response contains a **new JWT** with `role: "agent"`. The mobile app must replace its stored token with this new one immediately.

- **409** if already an agent.
- **404** if profile not found.

### 2.6 Password Reset

```
POST /v1/auth/forgot-password          →  { message: "If an account..." }
POST /v1/auth/reset-password            →  { message: "Password updated" }
```

`forgot-password` body: `{ "email": "..." }` — always returns success (prevents enumeration).  
`reset-password` body: `{ "accessToken": "...", "refreshToken": "...", "password": "..." }` — uses Supabase recovery tokens.

**Rate limit:** 5 requests/minute for both.

### 2.7 JWT Token

The `token` is a JWT signed with HS256, valid for **7 days**. Payload:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "buyer",
  "name": "Kofi Mensah",
  "iat": 1713000000,
  "exp": 1713604800
}
```

| Field | Type | Values |
|-------|------|--------|
| `sub` | UUID | Supabase `auth.users.id` — the universal user identifier |
| `email` | string | User's email |
| `role` | string | `"buyer"` or `"agent"` |
| `name` | string | Display name |
| `iat` | number | Issued-at (Unix timestamp) |
| `exp` | number | Expiry (7 days from `iat`) |

**No refresh tokens** — the JWT is the only session token. Re-authenticate when expired.

### 2.8 Using the Token

**REST:** Include in every request header:
```
Authorization: Bearer <token>
```

**WebSocket:** Pass as query parameter:
```
wss://api.example.com/v1/ws?token=<token>
```

### 2.9 Mobile Auth Strategy

```
1. On signup/login: store the JWT securely (Keychain on iOS, EncryptedSharedPreferences on Android)
2. On app launch: call GET /v1/auth/me to validate the token
   - 200 → token is valid, proceed
   - 401 → token expired/invalid, redirect to login
3. On upgrade-to-seller: replace stored token with the new one from the response
4. Include Authorization header on every API request
5. On 401 from any endpoint: clear stored token, redirect to login
6. Use user.role to determine UI:
   - "buyer" → show buyer-only features (browse, save, message)
   - "agent" → show both buyer features AND seller features (listings, dashboard)
```

---

## 3. REST API Endpoints

All endpoints require `Authorization: Bearer <token>`.

### 3.1 Start or Resume Conversation

There are **two types** of conversations:

1. **Property conversation** — initiated from a property listing page. Scoped to a specific property.
2. **Direct message (DM)** — initiated from a user's profile or contact button. No property attached.

The server **automatically deduplicates** — it will never create a second conversation for the same parties + property combo. If one already exists, it reuses it and just sends the message.

```
POST /v1/conversations
Content-Type: application/json
```

> **⚠️ CRITICAL: `sellerId` must be the user's auth UUID (`user_id`), NOT the agent record ID (`agents.id`).**
>
> The system has two different IDs for agents:
>
> | ID | Source | Example |
> |----|--------|---------|
> | `agents.id` | Agent record primary key | `"a1b2c3d4-..."` |
> | `agents.user_id` | Supabase auth user UUID | `"x9y8z7w6-..."` |
>
> - `properties.agent_id` → references `agents.id` (the agent record PK)
> - `conversations.seller_id` → references `profiles.user_id` (the auth UUID)
> - `JWT.sub` → is the auth UUID
>
> **These are different UUIDs!** If you pass `agents.id` as `sellerId`, the conversation will be created with the wrong user and messages won't route correctly.
>
> **For property conversations:** Don't pass `sellerId` at all — the server auto-resolves it correctly by joining `properties → agents → agents.user_id`.
>
> **For direct messages:** Use the `user_id` field from the agent/user data, NOT the agent record `id`. The login response's `user.id` and conversation list's `otherUser.user_id` are both the correct auth UUID.

#### Property Conversation

```json
{
  "propertyId": "property-uuid",
  "message": "Hi, is this property still available?"
}
```

- `sellerId` is **auto-resolved** from the property's agent — you don't need to provide it.
- The server looks up the property, finds its `agents.user_id` (not `agents.id`), and uses that as `sellerId`.
- If a conversation already exists for `(buyer_id, seller_id, property_id)` → reuses it.
- If not → creates a new one with `property_id` set.
- **Recommended approach:** Always omit `sellerId` for property conversations — let the server resolve it.

#### Direct Message (DM)

```json
{
  "sellerId": "seller-auth-user-uuid",
  "message": "Hello, I'm interested in your listings"
}
```

- No `propertyId` — the conversation has `property_id = NULL`.
- `sellerId` is **required** for direct messages (the server can't auto-resolve without a property).
- **Must be the auth `user_id`**, not `agents.id`. Get this from:
  - `otherUser.user_id` in the conversation list
  - `user.id` from the login/me response
  - `agents.user_id` if you have the full agent record
- If a conversation already exists for `(buyer_id, seller_id, property_id=NULL)` → reuses it.
- If not → creates a new one.

#### Where to Get the Correct `sellerId`

| Source | Field | Correct for `sellerId`? |
|--------|-------|------------------------|
| Login response | `user.id` | ✅ Yes — this is auth UUID |
| `/v1/auth/me` | `user.id` | ✅ Yes |
| Conversation list | `otherUser.user_id` | ✅ Yes |
| Conversation detail | `seller.user_id` | ✅ Yes |
| Agent record from login | `agent.id` | ❌ **NO** — this is the agent table PK |
| Property listing data | `agent_id` | ❌ **NO** — this references `agents.id` |

#### Full Parameter Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `propertyId` | UUID | No | Property to discuss. Omit for direct messages. |
| `sellerId` | UUID | No | **Auth user UUID** of the seller. Required for DMs. Auto-resolved from property if `propertyId` is provided. |
| `message` | string | Yes | First message text (1–5000 chars). |

#### Deduplication Logic

```
if propertyId is provided:
  → find conversation WHERE buyer_id = me AND seller_id = seller AND property_id = propertyId
else:
  → find conversation WHERE buyer_id = me AND seller_id = seller AND property_id IS NULL

if found → reuse it (send message into existing conversation)
if not found → create new conversation, then send message
```

This is enforced at both the **application level** (query before insert) and the **database level** (unique constraints prevent duplicates even under race conditions).

#### Response (201)

```json
{
  "conversationId": "uuid",
  "message": {
    "id": "uuid",
    "content": "Hi, is this property still available?",
    "message_type": "text",
    "sender_id": "buyer-uuid",
    "created_at": "2026-04-12T10:30:00.000Z"
  }
}
```

#### Validation Errors

| HTTP | Condition |
|------|-----------|
| 400 | Missing `sellerId` when no `propertyId` provided |
| 400 | Trying to message yourself (`sellerId === your user id`) |
| 404 | `propertyId` doesn't exist |

#### Mobile Implementation

```
Property listing page:
  → "Message Seller" button
  → POST /v1/conversations { propertyId: "...", message: "..." }
  → Navigate to chat screen with returned conversationId

User profile / agent page:
  → "Send Message" button
  → POST /v1/conversations { sellerId: "...", message: "..." }
  → Navigate to chat screen with returned conversationId

No need to check for existing conversations client-side — the server handles deduplication.
```

---

### 3.2 List Conversations

```
GET /v1/conversations
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "propertyId": "uuid | null",
    "property": {
      "id": "uuid",
      "title": "3 Bedroom House in Cantonments",
      "image": "https://..."
    },
    "otherUser": {
      "user_id": "uuid",
      "name": "Ama Osei",
      "email": "ama@example.com",
      "avatar_url": "https://..."
    },
    "lastMessage": {
      "id": "uuid",
      "content": "Yes, it's available!",
      "message_type": "text",
      "sender_id": "seller-uuid",
      "created_at": "2026-04-12T14:00:00.000Z"
    },
    "unreadCount": 2,
    "lastMessageAt": "2026-04-12T14:00:00.000Z",
    "createdAt": "2026-04-10T09:00:00.000Z"
  }
]
```

**Notes:**
- Sorted by `lastMessageAt` descending (most recent first).
- `otherUser` is the other party — buyers see the seller, sellers see the buyer.
- `otherUser.avatar_url` is coalesced from both `profiles.avatar_url` and `agents.avatar_url` — so agents who only have an avatar in the agents table will still show their picture.
- `property` is `null` for direct conversations.
- Uses an optimized Postgres RPC function (single query, no N+1).

---

### 3.3 Get Unread Count

```
GET /v1/conversations/unread-count
```

**Response (200):**
```json
{
  "count": 5
}
```

Total unread messages across all conversations (messages sent by others, not yet read).

---

### 3.4 Get Conversation Detail

```
GET /v1/conversations/:id
```

**Response (200):**
```json
{
  "id": "uuid",
  "propertyId": "uuid | null",
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "property": {
    "id": "uuid",
    "title": "3 Bedroom House",
    "image": "https://...",
    "price": 450000,
    "location": "Cantonments, Accra"
  },
  "buyer": {
    "user_id": "uuid",
    "name": "Kofi Mensah",
    "email": "kofi@example.com",
    "avatar_url": "https://..."
  },
  "seller": {
    "user_id": "uuid",
    "name": "Ama Osei",
    "email": "ama@example.com",
    "avatar_url": "https://..."
  },
  "lastMessageAt": "2026-04-12T14:00:00.000Z",
  "createdAt": "2026-04-10T09:00:00.000Z"
}
```

**Authorization:** Returns 403 if the current user is not the buyer or seller.

---

### 3.5 Get Messages (Paginated)

```
GET /v1/conversations/:id/messages?cursor=<ISO8601>&limit=<number>
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | ISO 8601 datetime | none | Fetch messages older than this timestamp. Omit for latest. |
| `limit` | integer (1–100) | 50 | Number of messages to return. |

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "buyer-uuid",
      "content": "Hi, is this available?",
      "message_type": "text",
      "attachment_url": null,
      "attachment_name": null,
      "property_ref_id": null,
      "property_ref": null,
      "read_at": "2026-04-12T10:31:00.000Z",
      "created_at": "2026-04-12T10:30:00.000Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "seller-uuid",
      "content": "Check out this listing",
      "message_type": "property_ref",
      "attachment_url": null,
      "attachment_name": null,
      "property_ref_id": "property-uuid",
      "property_ref": {
        "id": "property-uuid",
        "title": "3 Bedroom House",
        "image": "https://...",
        "price": 450000,
        "location": "Cantonments",
        "listingType": "sale"
      },
      "read_at": null,
      "created_at": "2026-04-12T10:35:00.000Z"
    }
  ],
  "hasMore": true
}
```

**Notes:**
- Messages are returned in **ascending** order (oldest first within the page).
- To load older messages, pass the `created_at` of the oldest loaded message as `cursor`.
- `hasMore` is `true` when exactly `limit` messages were returned.
- `property_ref` is enriched server-side when `message_type === "property_ref"`.

---

### 3.6 Send Message

```
POST /v1/conversations/:id/messages
Content-Type: application/json
```

**Request body:**
```json
{
  "content": "Here's a photo of the kitchen",
  "messageType": "image",
  "attachmentUrl": "https://s3.wasabisys.com/bucket/chat/1713000000-abc.jpg",
  "attachmentName": "kitchen.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Message text (1–5000 chars). |
| `messageType` | enum | No | `"text"` (default), `"image"`, `"file"`, `"property_ref"`. |
| `attachmentUrl` | URL string | No | Required for `image` / `file` types. Must be a Wasabi S3 URL. |
| `attachmentName` | string | No | Original filename for file attachments. |
| `propertyRefId` | UUID | No | Required for `property_ref` type. References a property. |

**Response (201):**
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "sender_id": "buyer-uuid",
  "content": "Here's a photo of the kitchen",
  "message_type": "image",
  "attachment_url": "https://s3.wasabisys.com/bucket/chat/1713000000-abc.jpg",
  "attachment_name": "kitchen.jpg",
  "property_ref_id": null,
  "property_ref": null,
  "read_at": null,
  "created_at": "2026-04-12T15:00:00.000Z"
}
```

**Server-side effects:**
1. Inserts message into `messages` table.
2. Updates `conversations.last_message_at`.
3. Sends WebSocket `new_message` event to the **other** user.
4. Creates a `message_received` notification for the other user.

---

### 3.7 Mark Messages as Read

```
PATCH /v1/conversations/:id/read
```

**No request body required.**

**Response (200):**
```json
{
  "ok": true
}
```

**Behavior:**
- Marks all messages in the conversation that were **not sent by the current user** and have `read_at = null` as read.
- Sends a WebSocket `messages_read` event to the other user (so they see ✓✓ read receipts).

---

### 3.8 Get Seller Properties (for @ Tagging)

```
GET /v1/conversations/:id/seller-properties
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "3 Bedroom House in Cantonments",
    "image": "https://...",
    "price": 450000,
    "location": "Cantonments, Accra",
    "listingType": "sale"
  }
]
```

Returns up to 50 approved properties owned by the seller in this conversation. Used for the `@` property mention/tagging feature.

---

## 4. WebSocket Protocol

### 4.1 Connecting

```
wss://api.example.com/v1/ws?token=<jwt>
```

The server authenticates the token immediately. Invalid tokens get:
- `4001` — Missing token
- `4003` — Invalid/expired token
- `4008` — Too many connections (max 10 per user)

### 4.2 Heartbeat

**Client sends** every 30 seconds:
```json
{ "type": "ping" }
```

**Server responds:**
```json
{ "type": "pong" }
```

The server also sends its own WebSocket protocol-level `ping` frames every 30 seconds. If no `pong` is received within 10 seconds, the socket is terminated.

### 4.3 Server → Client Events

#### `new_message`

Received when someone sends you a message in any conversation:

```json
{
  "type": "new_message",
  "conversationId": "conversation-uuid",
  "message": {
    "id": "message-uuid",
    "conversation_id": "conversation-uuid",
    "sender_id": "other-user-uuid",
    "content": "Hello!",
    "message_type": "text",
    "attachment_url": null,
    "attachment_name": null,
    "property_ref_id": null,
    "property_ref": {
      "id": "...", "title": "...", "image": "...",
      "price": 450000, "location": "...", "listingType": "sale"
    },
    "read_at": null,
    "created_at": "2026-04-12T15:00:00.000Z"
  }
}
```

`property_ref` is `null` unless `message_type === "property_ref"`.

#### `messages_read`

Received when the other user reads your messages:

```json
{
  "type": "messages_read",
  "conversationId": "conversation-uuid",
  "readBy": "other-user-uuid"
}
```

**Client action:** Update all messages in that conversation where `sender_id === currentUserId` and `read_at === null` → set `read_at` to `now()`. This shows ✓✓ double-check marks.

### 4.4 Reconnection Strategy

Use exponential backoff:

```
delay = min(1000ms × 2^attempt, 30000ms)
```

| Attempt | Delay |
|---------|-------|
| 0 | 1s |
| 1 | 2s |
| 2 | 4s |
| 3 | 8s |
| 4 | 16s |
| 5+ | 30s (capped) |

Reset the attempt counter to 0 on successful connection.

---

## 5. Image Uploads

### Upload a Chat Image

```
POST /v1/uploads/chat-image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form data:**
- `file` — The image file (JPEG, PNG, WebP, or AVIF only)

**Response (200):**
```json
{
  "url": "https://s3.wasabisys.com/bucket/chat/1713000000-abc123.jpg",
  "key": "chat/1713000000-abc123.jpg"
}
```

**Flow:**
1. Upload the image to `POST /v1/uploads/chat-image`.
2. Use the returned `url` as `attachmentUrl` when sending the message.
3. Send the message with `messageType: "image"` and the URL.

**Limits:**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
- Any authenticated user can upload chat images.

---

## 6. Database Schema

### `conversations` table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `property_id` | UUID → properties | Yes | — | Property being discussed (null for direct messages) |
| `buyer_id` | UUID → profiles | No | — | The buyer/initiator |
| `seller_id` | UUID → profiles | No | — | The seller/agent |
| `last_message_at` | timestamptz | No | `now()` | Updated on every new message |
| `created_at` | timestamptz | No | `now()` | — |

**Constraints:**
- `UNIQUE (property_id, buyer_id, seller_id)` — one conversation per property+buyer+seller triple.
- Partial unique index on `(buyer_id, seller_id) WHERE property_id IS NULL` — one direct conversation per pair.

### `messages` table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `conversation_id` | UUID → conversations | No | — | Foreign key (CASCADE delete) |
| `sender_id` | UUID | No | — | Who sent it |
| `content` | text | No | `''` | Message text |
| `message_type` | text | No | `'text'` | `text`, `image`, `file`, `property_ref` |
| `attachment_url` | text | Yes | — | URL for images/files |
| `attachment_name` | text | Yes | — | Original filename |
| `property_ref_id` | UUID → properties | Yes | — | Referenced property (for `property_ref` type) |
| `read_at` | timestamptz | Yes | — | When the recipient read it (null = unread) |
| `created_at` | timestamptz | No | `now()` | — |

**Indexes:**
- `(conversation_id, created_at)` — message list pagination
- `(conversation_id, read_at) WHERE read_at IS NULL` — unread count
- `(property_ref_id) WHERE property_ref_id IS NOT NULL` — property reference lookup

---

## 7. Data Types

### ConversationListItem

```typescript
{
  id: string;                    // Conversation UUID
  propertyId: string | null;     // Property UUID (null for direct)
  property: {                    // null for direct conversations
    id: string;
    title: string;
    image: string | null;
  } | null;
  otherUser: {                   // The other participant
    user_id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    message_type: string;        // "text" | "image" | "file" | "property_ref"
    sender_id: string;
    created_at: string;          // ISO 8601
  } | null;
  unreadCount: number;
  lastMessageAt: string;         // ISO 8601
  createdAt: string;             // ISO 8601
}
```

### ConversationDetail

```typescript
{
  id: string;
  propertyId: string | null;
  buyerId: string;
  sellerId: string;
  property: {
    id: string;
    title: string;
    image: string | null;
    price: number;
    location: string;
  } | null;
  buyer: {
    user_id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  seller: {
    user_id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  lastMessageAt: string;
  createdAt: string;
}
```

### ChatMessage

```typescript
{
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;          // "text" | "image" | "file" | "property_ref"
  attachment_url: string | null;
  attachment_name: string | null;
  property_ref_id: string | null;
  property_ref: {                // Enriched server-side, null unless property_ref type
    id: string;
    title: string;
    image: string | null;
    price: number;
    location: string;
    listingType: string;         // "sale" | "rent"
  } | null;
  read_at: string | null;       // ISO 8601, null = unread
  created_at: string;            // ISO 8601
}
```

### PropertyRefData

```typescript
{
  id: string;
  title: string;
  image: string | null;
  price: number;
  location: string;
  listingType: string;           // "sale" | "rent"
}
```

---

## 8. Client Implementation Guide

### 8.1 Conversation List Screen

```
1. GET /v1/conversations → display list sorted by lastMessageAt
2. GET /v1/conversations/unread-count → badge on tab bar
3. Poll every 15 seconds OR rely on WebSocket for real-time updates
4. On new_message WS event:
   - If conversation is in list: move to top, update lastMessage, increment unreadCount
   - If not in list: re-fetch the full list
5. On "gd:messages-read" (after opening a conversation):
   - Decrement unreadCount for that conversation to 0
```

### 8.2 Chat Screen

```
1. GET /v1/conversations/:id → header info (names, avatars, property)
2. GET /v1/conversations/:id/messages → initial messages
3. PATCH /v1/conversations/:id/read → mark as read immediately on open
4. Scroll to bottom instantly on load
5. Connect WebSocket and subscribe to events for this conversationId:
   - new_message: append to bottom, auto-scroll if near bottom, debounced mark-read
   - messages_read: update read_at on your sent messages (show ✓✓)
6. Load older: GET /v1/conversations/:id/messages?cursor=<oldest.created_at>
```

### 8.3 Sending Messages

#### Text Message
```json
POST /v1/conversations/:id/messages
{ "content": "Hello!", "messageType": "text" }
```

#### Image Message
```
1. POST /v1/uploads/chat-image (multipart form with "file" field)
   → { "url": "https://...", "key": "..." }
2. POST /v1/conversations/:id/messages
   { "content": "Photo", "messageType": "image", "attachmentUrl": "https://..." }
```

#### Property Reference (@ Mention)
```
1. GET /v1/conversations/:id/seller-properties → list for autocomplete
2. User selects a property
3. POST /v1/conversations/:id/messages
   {
     "content": "Check out this property",
     "messageType": "property_ref",
     "propertyRefId": "property-uuid"
   }
```

### 8.4 Mark-as-Read Strategy

```
- Immediately on opening a conversation: PATCH /:id/read
- While conversation is open and a new message arrives:
  - Debounce 500ms, then PATCH /:id/read
- This ensures rapid incoming messages don't spam the server
```

### 8.5 Read Receipts

- ✓ Single check = message sent (exists in local state)
- ✓✓ Double check = message read by recipient (`read_at !== null`)
- When you receive `messages_read` WS event for a conversation:
  - Set `read_at = now()` on all your messages in that conversation where `read_at === null`

### 8.6 WebSocket Connection Management

```
Mobile-specific considerations:
1. Connect WebSocket when app is in foreground
2. Disconnect when app goes to background (save battery)
3. Reconnect with exponential backoff on network failures
4. Re-fetch conversations list on reconnect (catch missed messages)
5. Send { type: "ping" } every 30 seconds to keep connection alive
6. Handle both protocol-level pings AND application-level pings
```

### 8.7 Optimistic Sending

For the best UX:
1. On send, immediately add message to local list with a temporary ID
2. Send the API request
3. On success: replace temporary message with server response
4. On failure: show retry button on that message

### 8.8 Message Grouping

Group messages by date for display:
- `Today`, `Yesterday`, or `12 Apr 2026`
- Within each group, messages are chronological (ascending)

---

## 9. Push Notifications

When a message is sent, the server creates a notification record:

```json
{
  "userId": "recipient-uuid",
  "type": "message_received",
  "title": "New Message",
  "body": "New message about \"3 Bedroom House in Cantonments\"",
  "data": {
    "conversationId": "uuid",
    "propertyId": "uuid"
  }
}
```

**Mobile integration:**
- Register device push token with the server
- On receiving a push notification with `type: "message_received"`:
  - If app is in foreground and on the same conversation: suppress (already handled by WS)
  - If app is in foreground but different screen: show in-app notification
  - If app is in background: show system notification, deep link to `/messages/:conversationId`

---

## Error Codes

| HTTP | Meaning | Handling |
|------|---------|----------|
| 400 | Bad request (validation) | Show field errors |
| 401 | Not authenticated | Redirect to login |
| 403 | Not authorized for this conversation | Show error |
| 404 | Conversation/property not found | Navigate back |
| 500 | Server error | Retry with backoff |
| 503 | Database not configured | Show maintenance banner |

---

## Quick Reference: All Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/auth/signup` | Create account (buyer or agent) |
| POST | `/v1/auth/login` | Login, get JWT |
| GET | `/v1/auth/me` | Validate token, get current user |
| POST | `/v1/auth/forgot-password` | Request password reset email |
| POST | `/v1/auth/reset-password` | Reset password with recovery tokens |
| POST | `/v1/buyer/upgrade-to-seller` | Upgrade buyer to agent (dual-role) |
| POST | `/v1/conversations` | Start/resume conversation |
| GET | `/v1/conversations` | List all conversations |
| GET | `/v1/conversations/unread-count` | Total unread count |
| GET | `/v1/conversations/:id` | Conversation detail |
| GET | `/v1/conversations/:id/messages` | Paginated messages |
| POST | `/v1/conversations/:id/messages` | Send message |
| PATCH | `/v1/conversations/:id/read` | Mark messages as read |
| GET | `/v1/conversations/:id/seller-properties` | Seller's properties (for @ tagging) |
| POST | `/v1/uploads/chat-image` | Upload chat image |
| WS | `/v1/ws?token=<jwt>` | Real-time WebSocket |
