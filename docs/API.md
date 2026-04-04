# GhanaDeals API Documentation

> **Base URL:** `https://api.ghanadeals.com/v1` (production) | `http://localhost:4000/v1` (development)

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Responses](#error-responses)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [Properties (Public)](#properties-public)
  - [Agents (Public)](#agents-public)
  - [Inquiries (Public)](#inquiries-public)
  - [Buyer (Authenticated)](#buyer-authenticated)
  - [Agent Dashboard (Agent Auth)](#agent-dashboard-agent-auth)
  - [Uploads](#uploads)
  - [Notifications (Authenticated)](#notifications-authenticated)
- [Data Types & Enums](#data-types--enums)
- [Pagination](#pagination)
- [Mobile Integration Notes](#mobile-integration-notes)

---

## Overview

- **Protocol:** HTTPS (HTTP in development)
- **Format:** JSON request/response bodies
- **Content-Type:** `application/json`
- **Character Encoding:** UTF-8
- **Currency:** GHS (Ghana Cedis)

## Authentication

GhanaDeals uses **JWT Bearer tokens** for authentication. Tokens are issued on signup/login and expire after **7 days**.

### Using tokens

Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### JWT Payload

```json
{
  "sub": "uuid",        // Supabase user ID
  "email": "user@example.com",
  "role": "buyer | agent",
  "name": "User Name",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Auth Levels

| Level | Description |
|-------|-------------|
| **Public** | No token required |
| **Authenticated** | Valid JWT required (any role) |
| **Buyer** | Valid JWT with `role: "buyer"` |
| **Agent** | Valid JWT with `role: "agent"` |

---

## Rate Limiting

| Scope | Limit |
|-------|-------|
| Global | 120 requests/minute per IP |
| Signup | 10 requests/minute per IP |
| Login | 15 requests/minute per IP |

Rate-limited responses return `429 Too Many Requests`.

---

## Error Responses

All errors follow a consistent format:

```json
{
  "message": "Human-readable error description",
  "errors": {                          // Only on 400 validation errors
    "fieldName": ["Error message"]
  }
}
```

### Standard Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Validation error |
| `401` | Not authenticated |
| `403` | Forbidden (wrong role) |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `429` | Rate limited |
| `500` | Server error |
| `503` | Service unavailable |

---

## Endpoints

### Health

#### `GET /v1/health`

Health check endpoint.

**Auth:** Public

**Response:**
```json
{
  "status": "ok"
}
```

---

### Auth

#### `POST /v1/auth/signup`

Create a new account (buyer or agent).

**Auth:** Public  
**Rate Limit:** 10/minute

**Request Body:**
```json
{
  "name": "Kofi Mensah",          // 2-100 chars, required
  "email": "kofi@example.com",    // valid email, required
  "phone": "+233241234567",       // 6-20 chars, required
  "password": "securepass123",    // 8-128 chars, required
  "accountType": "buyer"          // "buyer" | "agent", required
}
```

**Response `201`:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "email": "kofi@example.com",
    "name": "Kofi Mensah",
    "role": "buyer"
  },
  "agent": null,                   // Non-null if accountType is "agent"
  "profile": {                     // Non-null if accountType is "buyer"
    "id": "uuid",
    "name": "Kofi Mensah",
    "email": "kofi@example.com",
    "phone": "+233241234567",
    "avatar_url": null,
    "saved_properties": [],
    "search_preferences": null
  }
}
```

**Agent signup response shape for `agent` field:**
```json
{
  "agent": {
    "id": "uuid",
    "name": "Kofi Mensah",
    "company": "",
    "phone": "+233241234567",
    "verified": false
  }
}
```

**Error `409`:** `"An account with this email already exists"`

---

#### `POST /v1/auth/login`

Authenticate and receive a token.

**Auth:** Public  
**Rate Limit:** 15/minute

**Request Body:**
```json
{
  "email": "kofi@example.com",    // valid email, required
  "password": "securepass123"     // min 1 char, required
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "email": "kofi@example.com",
    "name": "Kofi Mensah",
    "role": "buyer"
  },
  "agent": null,
  "profile": { ... }
}
```

**Error `401`:** `"Invalid email or password"`

---

#### `GET /v1/auth/me`

Get the current user's profile.

**Auth:** Authenticated (any role)

**Response `200`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "kofi@example.com",
    "name": "Kofi Mensah",
    "role": "buyer"
  },
  "agent": null,                  // Non-null for agents
  "profile": {                    // Non-null for buyers
    "id": "uuid",
    "name": "Kofi Mensah",
    "email": "kofi@example.com",
    "phone": "+233241234567",
    "avatar_url": null,
    "saved_properties": ["uuid1", "uuid2"],
    "search_preferences": {}
  }
}
```

---

### Properties (Public)

#### `GET /v1/properties`

List approved properties with search/filter/pagination.

**Auth:** Public

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search title, location, region |
| `listingType` | string | `"sale"` \| `"rent"` \| `"new"` |
| `region` | string | Filter by region (partial match) |
| `type` | string | Filter by property type (e.g. `"Apartment"`, `"House"`, `"Villa"`, `"Townhouse"`, `"Commercial"`, `"Land"`) |
| `minPrice` | number | Minimum price in GHS |
| `maxPrice` | number | Maximum price in GHS |
| `minBeds` | number | Minimum bedrooms |
| `minBaths` | number | Minimum bathrooms |
| `featured` | string | `"true"` to show only featured |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (1-50, default: 12) |

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Modern 3-Bedroom Apartment in East Legon",
      "listingType": "sale",
      "price": 450000,
      "priceFormatted": "GHS 450,000",
      "priceLabel": "/month",            // optional — e.g. for rent
      "region": "Greater Accra",
      "location": "East Legon",
      "type": "Apartment",
      "beds": 3,
      "baths": 2,
      "area": 1500,
      "image": "https://cdn.example.com/img.jpg",
      "imageLg": "https://cdn.example.com/img-lg.jpg",
      "gallery": ["url1", "url2", "url3"],
      "badges": ["Premium", "New"],
      "photos": 8,
      "description": "Beautiful modern apartment...",
      "amenities": ["Pool", "Gym", "Parking"],
      "ref": "GD-M1A2B3C4",
      "added": "2026-03-01T10:00:00Z",
      "furnishing": "Furnished",
      "parking": "2 Spaces",
      "featured": true,
      "moderationStatus": "approved",
      "agent": {
        "id": "uuid",
        "name": "Kwame Asante",
        "company": "Asante Realty",
        "phone": "+233241234567",
        "color": "#3B82F6"
      }
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 12
}
```

---

#### `GET /v1/properties/stats`

Aggregate statistics for the marketplace.

**Auth:** Public

**Response `200`:**
```json
{
  "totalProperties": 156,
  "totalAgents": 24,
  "regions": [
    { "name": "Greater Accra", "count": 78 },
    { "name": "Ashanti", "count": 34 }
  ],
  "types": [
    { "name": "Apartment", "count": 45 },
    { "name": "House", "count": 38 }
  ]
}
```

---

#### `GET /v1/properties/:id`

Get a single property by ID.

**Auth:** Public

**Response `200`:** Same shape as a single item from the list endpoint.

**Error `404`:** `"Property not found"`

---

#### `GET /v1/properties/:id/related`

Get related properties (same region or type).

**Auth:** Public

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Max results (1-12, default: 4) |

**Response `200`:**
```json
{
  "items": [ /* same Property shape as list endpoint */ ]
}
```

---

### Agents (Public)

#### `GET /v1/agents`

List all agents.

**Auth:** Public

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search by name or company |
| `area` | string | Filter by service area |

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Kwame Asante",
      "company": "Asante Realty",
      "rating": 4.8,
      "areas": ["East Legon", "Airport Residential"],
      "listings": 12,
      "years": 8,
      "color": "#3B82F6",
      "phone": "+233241234567",
      "verified": true
    }
  ],
  "total": 24
}
```

---

#### `GET /v1/agents/:id`

Get a single agent's public profile.

**Auth:** Public

**Response `200`:** Same shape as a single item from the list endpoint.

---

#### `GET /v1/agents/:id/listings`

Get an agent's approved listings (paginated).

**Auth:** Public

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (1-50, default: 12) |

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "3-Bed Apartment in Cantonments",
      "listingType": "rent",
      "price": 3500,
      "priceFormatted": "GHS 3,500",
      "region": "Greater Accra",
      "location": "Cantonments",
      "type": "Apartment",
      "beds": 3,
      "baths": 2,
      "area": 1200,
      "image": "https://cdn.example.com/img.jpg",
      "badges": [],
      "photos": 5,
      "agent": {
        "id": "uuid",
        "name": "Kwame Asante",
        "company": "Asante Realty",
        "phone": "+233241234567",
        "color": "#3B82F6"
      }
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 12
}
```

---

### Inquiries (Public)

#### `POST /v1/inquiries`

Submit an inquiry about a property. No auth required.

**Auth:** Public

**Request Body:**
```json
{
  "propertyId": "uuid",                    // required, valid UUID
  "name": "Ama Serwaa",                    // 1-200 chars, required
  "email": "ama@example.com",              // valid email, required
  "phone": "+233551234567",                // max 30 chars, optional
  "message": "I'm interested in viewing…"  // 1-5000 chars, required
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "message": "Inquiry submitted successfully"
}
```

**Notes:**
- Property must exist and have `moderation_status: "approved"`
- The listing agent receives an email notification

---

### Buyer (Authenticated)

All buyer endpoints require a valid JWT token.

#### `GET /v1/buyer/profile`

Get the buyer's profile.

**Auth:** Authenticated

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Ama Serwaa",
  "email": "ama@example.com",
  "phone": "+233551234567",
  "avatar_url": "https://cdn.example.com/avatar.jpg",
  "saved_properties": ["uuid1", "uuid2"],
  "search_preferences": { "region": "Greater Accra" }
}
```

---

#### `PUT /v1/buyer/profile`

Update buyer profile fields.

**Auth:** Authenticated

**Request Body (all fields optional):**
```json
{
  "name": "Ama Serwaa-Mensah",        // 1-100 chars
  "phone": "+233551234567",            // 6-20 chars
  "avatar_url": "https://...",         // valid URL, max 2048 chars
  "search_preferences": {              // arbitrary JSON object
    "region": "Greater Accra",
    "minBeds": 2
  }
}
```

**Response `200`:** Full profile object (same shape as GET).

---

#### `POST /v1/buyer/saved/:propertyId`

Save a property to favorites.

**Auth:** Authenticated

**Response `200`:**
```json
{
  "saved_properties": ["uuid1", "uuid2", "uuid3"],
  "message": "Property saved"
}
```

---

#### `DELETE /v1/buyer/saved/:propertyId`

Remove a property from favorites.

**Auth:** Authenticated

**Response `200`:**
```json
{
  "saved_properties": ["uuid1", "uuid2"],
  "message": "Property removed"
}
```

---

#### `GET /v1/buyer/saved`

Get saved properties with full details.

**Auth:** Authenticated

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "3-Bed Apartment in East Legon",
      "listingType": "sale",
      "price": 450000,
      "priceFormatted": "GHS 450,000",
      "region": "Greater Accra",
      "type": "Apartment",
      "beds": 3,
      "baths": 2,
      "area": 1500,
      "image": "https://cdn.example.com/img.jpg",
      "agentName": "Kwame Asante"
    }
  ],
  "total": 2
}
```

---

### Agent Dashboard (Agent Auth)

All agent dashboard endpoints require a valid JWT with `role: "agent"`. The agent is automatically identified from the token — no agent ID is needed in the URL.

#### `GET /v1/agent/profile`

Get the agent's full profile.

**Auth:** Agent

**Response `200`:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Kwame Asante",
  "email": "kwame@asanterealty.com",
  "company": "Asante Realty",
  "phone": "+233241234567",
  "color": "#3B82F6",
  "rating": 4.8,
  "areas": ["East Legon", "Airport Residential"],
  "years": 8,
  "verified": true,
  "verification_status": "approved",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-03-20T14:30:00Z"
}
```

---

#### `PUT /v1/agent/profile`

Update agent profile.

**Auth:** Agent

**Request Body (all fields optional):**
```json
{
  "name": "Kwame Asante Jr.",       // 2-100 chars
  "company": "Asante Realty Ltd.",   // max 200 chars
  "phone": "+233241234567",         // max 20 chars
  "color": "#E63946",               // max 20 chars (brand color)
  "areas": ["East Legon", "Labone"], // max 20 areas, each max 100 chars
  "years": 10                        // 0-99 integer
}
```

**Response `200`:** Full agent profile object.

---

#### `GET /v1/agent/stats`

Get dashboard overview numbers.

**Auth:** Agent

**Response `200`:**
```json
{
  "totalListings": 15,
  "approvedListings": 12,
  "pendingListings": 2,
  "totalInquiries": 48,
  "newInquiries": 5
}
```

---

#### `GET /v1/agent/listings`

Get agent's own listings (all moderation statuses).

**Auth:** Agent

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `"pending"` \| `"approved"` \| `"flagged"` \| `"archived"` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (1-50, default: 12) |

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Modern 3-Bedroom Apartment",
      "listingType": "sale",
      "price": 450000,
      "priceFormatted": "GHS 450,000",
      "priceLabel": null,
      "region": "Greater Accra",
      "location": "East Legon",
      "type": "Apartment",
      "beds": 3,
      "baths": 2,
      "area": 1500,
      "image": "https://cdn.example.com/img.jpg",
      "imageLg": "https://cdn.example.com/img-lg.jpg",
      "gallery": ["url1", "url2"],
      "badges": [],
      "photos": 3,
      "description": "Beautiful modern apartment...",
      "amenities": ["Pool", "Gym"],
      "ref": "GD-M1A2B3C4",
      "furnishing": "Furnished",
      "parking": "2 Spaces",
      "featured": false,
      "moderationStatus": "approved",
      "createdAt": "2026-03-01T10:00:00Z",
      "updatedAt": "2026-03-15T08:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 12
}
```

---

#### `POST /v1/agent/listings`

Create a new listing. Sets `moderation_status: "pending"` and auto-generates a `ref` code.

**Auth:** Agent

**Request Body:**
```json
{
  "title": "Modern 3-Bedroom Apartment",       // 3-200 chars, required
  "listingType": "sale",                        // "sale" | "rent" | "new", required
  "price": 450000,                              // >= 0, required
  "priceLabel": "/month",                       // max 50 chars, optional
  "region": "Greater Accra",                    // 1-100 chars, required
  "location": "East Legon",                     // max 200 chars, optional
  "type": "Apartment",                          // 1-50 chars, required
  "beds": 3,                                    // 0-99 integer, optional
  "baths": 2,                                   // 0-99 integer, optional
  "area": 1500,                                 // >= 0, optional
  "description": "Beautiful modern apartment…", // max 5000 chars, optional
  "image": "https://cdn.example.com/main.jpg",  // max 500 chars, optional
  "imageLg": "https://cdn.example.com/lg.jpg",  // max 500 chars, optional
  "gallery": ["url1", "url2"],                  // max 20 URLs, each max 500 chars
  "amenities": ["Pool", "Gym", "Parking"],      // max 50 items, each max 100 chars
  "furnishing": "Furnished",                    // max 50 chars, optional
  "parking": "2 Spaces"                         // max 50 chars, optional
}
```

**Response `200`:**
```json
{
  "item": { /* full listing object */ },
  "message": "Listing created and submitted for review"
}
```

---

#### `GET /v1/agent/listings/:id`

Get a single listing (must belong to the authenticated agent).

**Auth:** Agent

**Response `200`:** Full listing object.  
**Error `404`:** `"Listing not found"` (or not owned by this agent)

---

#### `PUT /v1/agent/listings/:id`

Update a listing. **Resets moderation status to "pending".**

**Auth:** Agent

**Request Body:** Same fields as POST, but all are optional (partial update).

**Response `200`:**
```json
{
  "item": { /* updated listing object */ },
  "message": "Listing updated and resubmitted for review"
}
```

---

#### `DELETE /v1/agent/listings/:id`

Delete a listing (must be owned by the authenticated agent).

**Auth:** Agent

**Response `200`:**
```json
{
  "message": "Listing deleted"
}
```

---

#### `GET /v1/agent/inquiries`

Get inquiries received on the agent's listings.

**Auth:** Agent

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `"new"` \| `"read"` \| `"responded"` \| `"closed"` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (1-50, default: 20) |

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "propertyTitle": "Modern 3-Bedroom Apartment",
      "propertyImage": "https://cdn.example.com/img.jpg",
      "name": "Ama Serwaa",
      "email": "ama@example.com",
      "phone": "+233551234567",
      "message": "I'm interested in viewing this property.",
      "status": "new",
      "createdAt": "2026-03-20T14:30:00Z"
    }
  ],
  "total": 48,
  "page": 1,
  "limit": 20
}
```

---

#### `GET /v1/agent/verification`

Check agent's KYC verification status.

**Auth:** Agent

**Response `200`:**
```json
{
  "verificationStatus": "approved",     // "unverified" | "pending" | "approved" | "rejected"
  "kycDocuments": [
    {
      "type": "national_id",
      "url": "https://cdn.example.com/doc.pdf",
      "name": "ghana-card-front.pdf",
      "uploadedAt": "2026-03-10T10:00:00Z"
    }
  ],
  "submittedAt": "2026-03-10T10:00:00Z",
  "verifiedAt": "2026-03-12T08:00:00Z",
  "rejectionReason": null
}
```

---

#### `POST /v1/agent/verification`

Submit KYC documents for verification.

**Auth:** Agent

**Business Rules:**
- Cannot submit if status is `"approved"` → `400 "Agent is already verified"`
- Cannot submit if status is `"pending"` → `400 "Verification is already pending review"`
- Can resubmit if `"rejected"` or `"unverified"`

**Request Body:**
```json
{
  "documents": [
    {
      "type": "national_id",              // "national_id" | "business_registration" | "proof_of_address"
      "url": "https://cdn.example.com/id.pdf",   // valid URL, max 500 chars
      "name": "ghana-card-front.pdf"              // max 200 chars
    }
  ]  // 1-5 documents required
}
```

**Response `200`:**
```json
{
  "message": "Verification submitted for review",
  "verificationStatus": "pending"
}
```

---

### Uploads

#### `POST /v1/uploads/sign`

Get a pre-signed URL for uploading files to Wasabi S3.

**Auth:** Public (consider adding auth in production)

**Request Body:**
```json
{
  "key": "properties/uuid/photo-1.jpg",   // S3 object key
  "contentType": "image/jpeg"              // MIME type
}
```

**Response `200`:**
```json
{
  "uploadUrl": "https://s3.eu-central-1.wasabisys.com/bucket/...",
  "key": "properties/uuid/photo-1.jpg",
  "expiresIn": 60
}
```

**Upload Flow (mobile):**
1. Call `POST /v1/uploads/sign` with the desired key and content type
2. `PUT` the file binary to the returned `uploadUrl` with the matching `Content-Type` header
3. The file is now accessible at `https://<bucket>.<endpoint>/<key>`
4. Use the full URL in listing image/gallery fields

---

### Notifications (Authenticated)

All notification endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

#### List Notifications

```
GET /v1/notifications?page=1&limit=20&unread=true
```

| Query Param | Type    | Default | Description                          |
|-------------|---------|---------|--------------------------------------|
| `page`      | integer | 1       | Page number                          |
| `limit`     | integer | 20      | Items per page (max 50)              |
| `unread`    | boolean | —       | If `true`, return only unread items  |

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "inquiry_received",
      "title": "New Inquiry",
      "body": "John inquired about \"3BR in East Legon\"",
      "data": { "propertyId": "uuid", "inquiryId": "uuid" },
      "read": false,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

#### Unread Count

```
GET /v1/notifications/unread-count
```

**Response `200`:**
```json
{ "count": 5 }
```

---

#### Mark Single Notification as Read

```
PUT /v1/notifications/:id/read
```

**Response `200`:**
```json
{ "message": "Notification marked as read" }
```

---

#### Mark All Notifications as Read

```
PUT /v1/notifications/read-all
```

**Response `200`:**
```json
{ "message": "All notifications marked as read" }
```

---

#### Delete Notification

```
DELETE /v1/notifications/:id
```

**Response `200`:**
```json
{ "message": "Notification deleted" }
```

---

#### Get Notification Preferences

```
GET /v1/notifications/preferences
```

**Response `200`:**
```json
{
  "emailEnabled": true,
  "pushEnabled": true,
  "inAppEnabled": true,
  "mutedTypes": []
}
```

---

#### Update Notification Preferences

```
PUT /v1/notifications/preferences
```

**Request Body:**
```json
{
  "emailEnabled": true,
  "pushEnabled": false,
  "inAppEnabled": true,
  "mutedTypes": ["property_saved"]
}
```

| Field          | Type     | Description                                   |
|----------------|----------|-----------------------------------------------|
| `emailEnabled` | boolean  | Enable/disable email notifications            |
| `pushEnabled`  | boolean  | Enable/disable push notifications             |
| `inAppEnabled` | boolean  | Enable/disable in-app notifications           |
| `mutedTypes`   | string[] | Array of notification types to silence         |

**Response `200`:**
```json
{ "message": "Preferences updated" }
```

---

#### Notification Types

| Type                      | Trigger                          | Recipient |
|---------------------------|----------------------------------|-----------|
| `inquiry_received`        | New inquiry submitted            | Agent     |
| `inquiry_status_changed`  | Agent updates inquiry status     | Buyer     |
| `listing_approved`        | Admin approves a listing         | Agent     |
| `listing_flagged`         | Admin flags a listing            | Agent     |
| `verification_approved`   | Admin approves KYC               | Agent     |
| `verification_rejected`   | Admin rejects KYC                | Agent     |
| `property_saved`          | User saves a property            | Agent     |
| `welcome`                 | User signs up                    | User      |
| `system`                  | System-wide announcements        | All       |

---

## Data Types & Enums

### Listing Type
```
"sale" | "rent" | "new"
```

### Property Type (string, common values)
```
"Apartment" | "House" | "Villa" | "Townhouse" | "Commercial" | "Land"
```

### Moderation Status
```
"pending" | "approved" | "flagged" | "archived"
```

### Inquiry Status
```
"new" | "read" | "responded" | "closed"
```

### Verification Status
```
"unverified" | "pending" | "approved" | "rejected"
```

### KYC Document Type
```
"national_id" | "business_registration" | "proof_of_address"
```

### Account Type / Role
```
"buyer" | "agent"
```

---

## Pagination

Paginated endpoints return:

```json
{
  "items": [],
  "total": 156,     // Total matching records
  "page": 1,        // Current page (1-indexed)
  "limit": 12       // Items per page
}
```

Calculate total pages: `Math.ceil(total / limit)`

Default limits vary by endpoint (12 for listings, 20 for inquiries). Maximum is always 50.

---

## Mobile Integration Notes

### Token Storage
Store the JWT securely using platform-specific secure storage:
- **iOS:** Keychain Services
- **Android:** EncryptedSharedPreferences or Android Keystore

### Image Handling
- `image` — standard resolution thumbnail (use for lists/cards)
- `imageLg` — high resolution (use for detail/gallery views, may be `null`)
- `gallery` — array of image URLs for the property photo gallery
- Images are served from Wasabi S3 CDN; cache aggressively

### Offline Considerations
- Cache property listings and agent data locally for offline browsing
- Queue inquiries for submission when connectivity returns
- Store saved property IDs locally and sync with server

### Search Approach
Use `GET /v1/properties` with query params for all search/filter scenarios:
- **Home screen:** `?featured=true&limit=6`
- **Category browse:** `?listingType=sale&page=1`
- **Full search:** `?q=east+legon&minPrice=100000&maxPrice=500000&minBeds=2`
- **By region:** `?region=Greater+Accra`

### Price Formatting
The API returns both `price` (number) and `priceFormatted` (string like `"GHS 450,000"`). Use `priceFormatted` for display or format locally using:
```
GHS + Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(price)
```

### Push Notifications

In-app persistent notifications are fully implemented. The API stores notifications in the database and exposes endpoints for listing, reading, and managing them. Mobile apps should:

1. **Poll** `GET /v1/notifications/unread-count` periodically (e.g. every 30s) to update badge counts
2. **Fetch** `GET /v1/notifications` when the user opens the notification screen
3. **Mark read** via `PUT /v1/notifications/:id/read` when tapped
4. **Preferences** — let users mute specific notification types via `PUT /v1/notifications/preferences`

For future **push notification** support, add a device token registration endpoint and dispatch push alongside in-app notifications at the existing trigger points.

Notification types: `inquiry_received`, `inquiry_status_changed`, `listing_approved`, `listing_flagged`, `verification_approved`, `verification_rejected`, `property_saved`, `welcome`, `system`

### Agent Colors
Each agent has a `color` field (hex value like `"#3B82F6"`) used as their brand accent. Use this for agent cards, profile headers, and avatars.

### Authentication Flow

```
┌─────────────┐      POST /auth/signup       ┌─────────┐
│  Signup      │ ─────────────────────────▶  │  Server  │
│  Screen      │ ◀─────────────────────────  │          │
│              │     { token, user, ... }     │          │
└─────────────┘                               │          │
                                              │          │
┌─────────────┐      POST /auth/login        │          │
│  Login       │ ─────────────────────────▶  │          │
│  Screen      │ ◀─────────────────────────  │          │
│              │     { token, user, ... }     │          │
└─────────────┘                               │          │
                                              │          │
┌─────────────┐      GET /auth/me            │          │
│  App Launch  │ ─────────────────────────▶  │          │
│  (has token) │ ◀─────────────────────────  │          │
│              │     { user, agent/profile }  │          │
└─────────────┘                               └─────────┘
```

### Suggested Key → Screen Mapping

| Screen | Primary Endpoint(s) |
|--------|-------------------|
| Home | `GET /properties?featured=true&limit=6`, `GET /properties/stats` |
| Search/Listings | `GET /properties?...filters` |
| Property Detail | `GET /properties/:id`, `GET /properties/:id/related` |
| Agent List | `GET /agents` |
| Agent Profile | `GET /agents/:id`, `GET /agents/:id/listings` |
| Send Inquiry | `POST /inquiries` |
| Login/Signup | `POST /auth/login`, `POST /auth/signup` |
| My Profile | `GET /auth/me`, `PUT /buyer/profile` |
| Saved Properties | `GET /buyer/saved`, `POST/DELETE /buyer/saved/:id` |
| Agent Dashboard | `GET /agent/stats`, `GET /agent/listings`, `GET /agent/inquiries` |
| Create/Edit Listing | `POST /agent/listings`, `PUT /agent/listings/:id` |
| KYC Verification | `GET /agent/verification`, `POST /agent/verification` |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/:id/read`, `PUT /notifications/read-all` |
| Notification Settings | `GET /notifications/preferences`, `PUT /notifications/preferences` |
| Agent Reviews | `GET /agents/:id/reviews`, `POST /agents/:id/reviews` |
| Map Search | `GET /properties?swLat=...&swLng=...&neLat=...&neLng=...` |
| Mortgage Calculator | Client-side only (no API) |

---

## Tier 1 Features (v2)

### Map-Based Search

Properties now support optional `latitude` and `longitude` fields. When present, properties can be displayed on maps and filtered by map viewport bounds.

#### New Fields on Property

| Field | Type | Description |
|-------|------|-------------|
| `latitude` | `number \| undefined` | GPS latitude (-90 to 90) |
| `longitude` | `number \| undefined` | GPS longitude (-180 to 180) |
| `floorPlans` | `string[]` | Array of floor plan image URLs |

#### Map Bounds Filter

`GET /v1/properties?swLat={lat}&swLng={lng}&neLat={lat}&neLng={lng}`

All four bounds parameters must be provided together. Only properties with non-null coordinates within the bounding box are returned.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `swLat` | number | Southwest corner latitude |
| `swLng` | number | Southwest corner longitude |
| `neLat` | number | Northeast corner latitude |
| `neLng` | number | Northeast corner longitude |

These can be combined with all existing filters (region, type, price, beds, etc.).

---

### Floor Plans

Properties can now include floor plan images uploaded by agents.

**Agent Dashboard:**
- `POST /v1/agent/listings` — accepts `floorPlans: string[]` (max 10 URLs)
- `PUT /v1/agent/listings/:id` — accepts `floorPlans: string[]`

**Response:** `floorPlans` array included in all property responses.

---

### Agent Reviews

Authenticated users can submit reviews for agents. Each user can leave one review per agent (upsert on conflict).

#### `GET /v1/agents/:id/reviews`

List reviews for an agent.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 50) |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "agentId": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "rating": 5,
      "comment": "Great agent!",
      "createdAt": "2025-01-15T..."
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

#### `POST /v1/agents/:id/reviews`

Submit or update a review. Requires authentication (`Authorization: Bearer <token>`).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rating` | integer | Yes | 1–5 star rating |
| `comment` | string | No | Review text (max 2000 chars) |

**Response:** `{ "message": "Review submitted", "item": { ...review } }`

If user already has a review for this agent, it is updated (upsert).

#### `DELETE /v1/agents/:id/reviews/:reviewId`

Delete a review. Only the review author or admin can delete.

**Response:** `{ "message": "Review deleted" }`

#### Agent Rating Computation

Agent `rating` field is now computed dynamically from the average of all reviews. The `reviewCount` field is also returned. If no reviews exist, the original static `rating` from the agents table is used as fallback.

**Agent Response (updated):**
```json
{
  "id": "uuid",
  "name": "Agent Name",
  "rating": 4.3,
  "reviewCount": 15,
  "listings": 8,
  ...
}
```

---

### Mortgage Calculator

The mortgage calculator is a **client-side only** feature — no API endpoint required.

**Formula:** Standard amortization: `P × [r(1+r)^n] / [(1+r)^n - 1]`

**Defaults for Ghana market:**
- Down payment: 20%
- Interest rate: 27.5% (typical Ghana mortgage rate)
- Term: 15 years

Only shown on **for-sale** property detail pages.
