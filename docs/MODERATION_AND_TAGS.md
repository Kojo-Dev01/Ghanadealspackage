# Moderation & Tagging Systems

Reference for the mobile team covering two distinct systems:

1. **Property Tagging** — how listings are tagged with badges, featured status, and listing type
2. **Message Moderation** — how admin-deleted messages are stored and displayed to users and agents

---

## Overview

| Feature | Property Tagging | Message Moderation |
|---|---|---|
| DB Columns | `badges text[]`, `featured boolean`, `listing_type enum` | `deleted_at timestamptz`, `deleted_by uuid` |
| Delete strategy | N/A | Soft delete (message stays in DB, marked with timestamp) |
| Who can change | Admin only (featured toggle); badges are set programmatically | Admin only |
| Visible to | Buyers (public) | All chat participants (buyer, agent, admin) |
| Audit trail | `audit_log` table with `toggle_featured` action | `deleted_by` column stores admin UUID |

---

## Part 1 — Property Tagging System

### 1.1 Database Schema

Defined in `supabase/migrations/001_initial_schema.sql`:

```sql
badges            text[] NOT NULL DEFAULT '{}',
featured          boolean NOT NULL DEFAULT false,
listing_type      listing_type NOT NULL DEFAULT 'sale'
```

The `listing_type` is a PostgreSQL enum. Values were added progressively:

| Migration | Values added |
|---|---|
| `001_initial_schema.sql` | `sale`, `rent` |
| `003_add_new_listing_type.sql` | `new` |
| `020_land_uncompleted_listing_types.sql` | `land`, `uncompleted` |

**Indices:**

```sql
CREATE INDEX idx_properties_listing  ON properties(listing_type);
CREATE INDEX idx_properties_featured ON properties(featured) WHERE featured = true;
```

### 1.2 Badge Values

Badges are a free-form `text[]` array. The known values in use are:

| Badge string | Display label | CSS class |
|---|---|---|
| `"verified"` | Verified | `badge badge-verified` |
| `"premium"` | Premium | `badge badge-premium` |

A listing can hold multiple badges, e.g. `["verified", "premium"]`. The card rendering picks the **highest-priority** one to show (premium > verified).

Badges are set programmatically (seed data, agent verification flow). There is no admin UI to edit the `badges` array directly.

### 1.3 Listing Types

```typescript
// shared/types/index.ts
export type ListingType = "sale" | "rent" | "new" | "land" | "uncompleted";
```

| Value | Display label | Usage |
|---|---|---|
| `sale` | "for Sale" | Standard resale property |
| `rent` | "for Rent" | Rental property |
| `new` | "— New Development" | Brand-new builds |
| `land` | "— Land" | Land/plots for sale |
| `uncompleted` | "— Uncompleted" | Under-construction properties |

### 1.4 API — Querying Properties

**Endpoint:** `GET /v1/properties`

Relevant query parameters for tagging:

| Parameter | Type | Effect |
|---|---|---|
| `listingType` | `string` | Filter by `listing_type` enum value |
| `featured` | `"true"` | Return only `featured = true` listings |
| `minBeds` | `string` | Exact match, or `"6+"` for ≥6 |
| `minBaths` | `string` | Exact match, or `"3+"` for ≥3 |

**Response shape** (per listing):

```json
{
  "id": "...",
  "featured": true,
  "badges": ["verified"],
  "listingType": "sale",
  ...
}
```

### 1.5 Admin API — Toggle Featured Status

**Endpoint:** `POST /v1/admin/listings/:id/featured`

**Required permission:** `listings.featured`

**Request:** No body needed — this is a toggle.

**Response:**

```json
{ "featured": true, "message": "Listing is now featured" }
```

An `audit_log` entry is created with `action: "toggle_featured"`.

**Admin client helper** (`apps/admin/lib/api.ts`):

```typescript
await toggleAdminListingFeatured(listingId);
// Returns: { featured: boolean; message: string } | null
```

### 1.6 Card Rendering (Web)

File: `apps/web/components/property-card.tsx`

**Badge rendering logic** — highest priority wins:

```typescript
const badge = property.badges.includes("premium")
  ? { label: "Premium", className: "badge badge-premium" }
  : property.badges.includes("verified")
    ? { label: "Verified", className: "badge badge-verified" }
    : null;

// In JSX:
{badge && <span className={badge.className}>{badge.label}</span>}
```

**Listing type label in title:**

```typescript
{property.type} {({
  sale:        "for Sale",
  rent:        "for Rent",
  new:         "— New Development",
  land:        "— Land",
  uncompleted: "— Uncompleted",
})[property.listingType]}
```

### 1.7 Property @ Tagging in Chat (Message Type: `property_ref`)

Users and agents can attach a property listing to a chat message using `@` mention. This creates a message with `message_type: "property_ref"`.

**Flow:**

1. User types `@` in the chat input.
2. A popup appears listing the seller's properties (fetched from `GET /v1/conversations/:id/seller-properties`).
3. User selects a property → the input shows a preview strip with the property thumbnail, title, and price.
4. User optionally adds a caption and hits Send.
5. The message is sent as `message_type: "property_ref"` with `property_ref_id` set to the selected property's UUID.

**DB columns used:**

```sql
message_type    text   -- value: 'property_ref'
property_ref_id uuid   -- FK → properties.id (SET NULL on delete)
content         text   -- the user's caption (or property title as fallback)
```

**Rendering a `property_ref` message** (`BubbleContent` component in both web and agents chat pages):

```typescript
if (msg.message_type === "property_ref") {
  if (msg.property_ref) {
    return (
      <>
        <PropertyCard prop={msg.property_ref} isMine={isMine} />
        {/* show caption if different from property title */}
        {msg.content && msg.content !== msg.property_ref.title && (
          <p>{msg.content}</p>
        )}
      </>
    );
  }
  // Property was deleted
  return <p style={{ opacity: 0.7, fontStyle: "italic" }}>🏠 {msg.content || "Property no longer available"}</p>;
}
```

The `property_ref` object is enriched by the API at query time:

```json
{
  "message_type": "property_ref",
  "property_ref_id": "abc123",
  "content": "Check this one out",
  "property_ref": {
    "id": "abc123",
    "title": "3-Bed House in East Legon",
    "image": "https://...",
    "price": 350000,
    "location": "East Legon, Accra"
  }
}
```

If the property is deleted after the message was sent, `property_ref` will be `null` (due to `ON DELETE SET NULL` on `property_ref_id`) and the fallback italic text is shown.

---

## Part 2 — Message Moderation (Admin-Deleted Messages)

### 2.1 Database Schema

Base table from `supabase/migrations/012_conversations_messages.sql`, soft-delete columns from `supabase/migrations/023_message_moderation.sql`:

```sql
CREATE TABLE messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL,
  content         text NOT NULL DEFAULT '',
  message_type    text NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'file', 'property_ref')),
  attachment_url  text,
  attachment_name text,
  property_ref_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Added in migration 023:
  deleted_at      timestamptz,   -- NULL = not deleted; non-NULL = soft deleted
  deleted_by      uuid           -- UUID of the admin who deleted it
);

CREATE INDEX idx_messages_deleted ON messages (deleted_at)
  WHERE deleted_at IS NOT NULL;
```

**Key points:**
- Messages are **never hard-deleted** by moderators — only soft-deleted.
- The original `content` and `attachment_url` remain in the DB (for admin audit purposes) but the original content is never sent to clients once `deleted_at` is set.
- `deleted_by` is the admin user's UUID (from the `admin_users` table).

### 2.2 API — Fetching Messages

**Endpoint:** `GET /v1/conversations/:id/messages`

Returns messages including the `deleted_at` field. The API does **not** filter out deleted messages — the `deleted_at` timestamp is sent to the client so the UI can decide how to render them.

```typescript
// Selected fields:
"id, conversation_id, sender_id, content, message_type,
 attachment_url, attachment_name, property_ref_id, read_at,
 created_at, deleted_at"
```

> Note: `content` of deleted messages is still returned but replaced in the UI with the placeholder text. The mobile app should detect `deleted_at !== null` and render the placeholder — do not display `content` in that case.

### 2.3 Admin API — Soft Delete a Message

**Endpoint:** `DELETE /v1/admin/conversations/:id/messages/:msgId`

**Required permission:** `inquiries.update`

**What it does:**

```typescript
await supabase
  .from("messages")
  .update({
    deleted_at: new Date().toISOString(),
    deleted_by: adminUser?.id ?? null,
  })
  .eq("id", msgId);
```

**Response:**

```json
{ "success": true }
```

Returns `400` if the message is already deleted.

**Admin Next.js proxy route:** `apps/admin/app/api/chats/[id]/messages/[msgId]/route.ts`

```typescript
// DELETE handler proxies to API with admin session token
DELETE /api/chats/:id/messages/:msgId → DELETE /v1/admin/conversations/:id/messages/:msgId
```

### 2.4 Admin Chat Viewer UI

File: `apps/admin/app/(dashboard)/chats/[id]/chat-viewer.tsx`

**Delete interaction:**

- A red trash icon button appears on **hover** over any non-deleted message.
- Clicking it opens a confirmation dialog.
- On confirm, `DELETE /api/chats/:id/messages/:msgId` is called.
- On success, the message is **optimistically updated** in local state (`deleted_at` set to current ISO timestamp).

**Rendering deleted messages in admin view:**

```typescript
const isDeleted = !!msg.deleted_at;

// Deleted message bubble:
<div style={{
  border: "1px dashed ...",   // dashed border
  opacity: 0.7,               // reduced opacity
  fontStyle: "italic",        // italic text
  color: "muted",             // muted color
}}>
  <svg>/* circle-slash prohibition icon */</svg>
  This message was removed by a moderator
</div>

// Red "Deleted" badge shown in timestamp area
```

**Admin sees:**
- Prohibition icon (⊘) + italic "This message was removed by a moderator"
- Dashed border, muted colors
- Timestamp still shown
- The delete button is hidden for already-deleted messages

### 2.5 Buyer Chat UI (Web)

File: `apps/web/app/account/messages/[id]/page.tsx`

Buyers see the same placeholder as agents. No original content is shown. No delete button exists.

**Detection:**

```typescript
const isDeleted = !!msg.deleted_at;
```

**Deleted bubble styles (inline):**

```typescript
background: "var(--bg-secondary)",         // neutral gray background (not colored)
color:      "var(--text-tertiary)",         // muted text
border:     "1px dashed var(--border-primary)",  // dashed border
fontStyle:  "italic",
```

**Deleted bubble content:**

```tsx
<div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
  <svg>/* circle-slash icon */</svg>
  This message was removed by a moderator
</div>
```

**Normal bubble state is suppressed:**
- No content rendered (`BubbleContent` is skipped)
- No image thumbnails
- No read receipts (✓✓) for own deleted messages
- Timestamp is still shown (in muted color)

**Behavior is the same regardless of `isMine`** — whether the buyer sent the message or received it, a deleted message looks identical: gray dashed bubble with placeholder text.

### 2.6 Agent Chat UI

File: `apps/agents/app/(dashboard)/messages/[id]/page.tsx`

Identical behavior to the web buyer chat. Agents see:

```tsx
const isDeleted = !!msg.deleted_at;

// Deleted bubble uses Tailwind:
<div className={`px-3.5 py-2.5 bg-panel-alt/50 border border-border border-dashed text-muted rounded-2xl italic`}>
  <div className="flex items-center gap-1.5 text-xs text-muted">
    <svg>/* circle-slash icon */</svg>
    This message was removed by a moderator
  </div>
</div>
```

- Same placeholder text as buyer view
- `bg-panel-alt/50` at 50% opacity (semi-transparent)
- `border-dashed` visual indicator
- No read receipts on deleted messages
- No ability for agents to delete messages (no delete button)

---

## Summary: Deleted Message Rendering Comparison

| Aspect | Buyer (web) | Agent (agents app) | Admin |
|---|---|---|---|
| Detection | `!!msg.deleted_at` | `!!msg.deleted_at` | `!!msg.deleted_at` |
| Placeholder text | "This message was removed by a moderator" | "This message was removed by a moderator" | "This message was removed by a moderator" |
| Visual style | Dashed border, gray bg, muted italic | Dashed border, semi-transparent, italic | Dashed border, reduced opacity, italic |
| Original content shown | No | No | No |
| Delete button | No | No | Yes (hover) + confirmation |
| Read receipts | Hidden | Hidden | Hidden |
| Timestamp | Shown (muted) | Shown (muted) | Shown + "Deleted" badge |
| Prohibition icon | Yes (circle-slash SVG) | Yes (circle-slash SVG) | Yes (circle-slash SVG) |

---

## Mobile Implementation Notes

### Property Badges & Tags

1. **Badge rendering:** Call `GET /v1/properties` — each listing includes `badges: string[]` and `featured: boolean`. Only display one badge per card (priority: `premium` > `verified`).

2. **Listing type label:** Map `listingType` to display strings as shown in §1.6.

3. **Filtering:** Pass `?listingType=sale&featured=true` query params to the properties endpoint.

4. **Property ref messages:** In chat, when `message_type === "property_ref"`, render a property card using the enriched `property_ref` object. If `property_ref` is `null`, show a fallback "Property no longer available" text.

5. **@ tagging UX:** Trigger the property picker when the user types `@` in the chat input. Fetch from `GET /v1/conversations/:id/seller-properties`. Send with `messageType: "property_ref"` and `propertyRefId`.

### Message Moderation

1. **Check `deleted_at` on every message** before rendering. If non-null, render a placeholder — never render the `content` field.

2. **Recommended placeholder UI:**
   - Gray/neutral bubble background (not the sender color)
   - Dashed 1px border
   - Prohibition icon (⊘) + italic text: *"This message was removed by a moderator"*
   - Suppress image previews, file attachments, property cards
   - Suppress read receipts

3. **Real-time deletion:** If using the WebSocket connection, listen for events that update a message to have `deleted_at` set. Update the local message state to show the placeholder immediately without requiring a page reload.

4. **No delete capability for non-admins.** Do not expose any delete UI to buyers or agents.

---

## Key Files

| File | Purpose |
|---|---|
| `supabase/migrations/001_initial_schema.sql` | `badges`, `featured`, `listing_type` columns |
| `supabase/migrations/012_conversations_messages.sql` | `messages` table base schema |
| `supabase/migrations/020_land_uncompleted_listing_types.sql` | Adds `land`, `uncompleted` enum values |
| `supabase/migrations/023_message_moderation.sql` | Adds `deleted_at`, `deleted_by` to messages |
| `shared/types/index.ts` | `ListingType` TypeScript type |
| `apps/api/src/routes/properties.ts` | Properties list endpoint with `featured` + `listingType` filters |
| `apps/api/src/routes/admin.ts` | Featured toggle + message soft-delete endpoints |
| `apps/api/src/routes/conversations.ts` | Messages fetch (returns `deleted_at`) |
| `apps/web/components/property-card.tsx` | Badge + listing type rendering on listing cards |
| `apps/web/app/account/messages/[id]/page.tsx` | Buyer chat view with deleted message placeholder |
| `apps/agents/app/(dashboard)/messages/[id]/page.tsx` | Agent chat view with deleted message placeholder |
| `apps/admin/app/(dashboard)/chats/[id]/chat-viewer.tsx` | Admin chat view with delete button + placeholder |
| `apps/admin/app/api/chats/[id]/messages/[msgId]/route.ts` | Admin Next.js proxy route for message deletion |
| `apps/admin/lib/api.ts` | `toggleAdminListingFeatured()` helper |
