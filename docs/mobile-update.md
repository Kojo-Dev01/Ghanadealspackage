# GhanaDeals — Mobile App Feature Update

> **Last Updated:** April 2026
> This document tracks all new features added to the web/API platform that need to be replicated in the mobile application.

---

## Table of Contents

- [Tier 1 Features](#tier-1-features)
  - [1. Map-Based Property Search](#1-map-based-property-search)
  - [2. Mortgage Calculator](#2-mortgage-calculator)
  - [3. Floor Plan Support](#3-floor-plan-support)
  - [4. Agent Reviews & Response Time](#4-agent-reviews--response-time)
- [Previously Implemented Features](#previously-implemented-features)
  - [Persistent Notifications](#persistent-notifications)
  - [Password Reset Flow](#password-reset-flow)
  - [Inquiry Status Tracking](#inquiry-status-tracking)
  - [Image Gallery Lightbox](#image-gallery-lightbox)

---

## Tier 1 Features

### 1. Map-Based Property Search

**API Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/properties?swLat=...&swLng=...&neLat=...&neLng=...` | Fetch properties within map viewport bounds |
| `GET` | `/v1/properties/:id` | Now returns `latitude`, `longitude`, and `floorPlans` fields |

**New Fields on Property:**
```json
{
  "latitude": 5.6037,
  "longitude": -0.1870,
  "floorPlans": ["https://cdn.example.com/fp1.jpg"],
  "...existing fields"
}
```

**Mobile Implementation:**
- Add a **Map/List toggle** on the property search screen
- Map view renders property pins using `latitude`/`longitude` — use native map SDK (Google Maps for Android, MapKit for iOS, or React Native Maps)
- Tapping a pin shows a mini property card (image, title, price) — tapping the card navigates to property detail
- On property detail screen, show an embedded map below the photo gallery with a single pin at the property location
- When the user pans/zooms the map, fetch properties using individual bounds query parameters: `?swLat=5.5&swLng=-0.3&neLat=5.7&neLng=-0.1`
- Cluster pins when zoomed out (many properties in view) — switch to individual pins when zoomed in
- If `latitude`/`longitude` are null, that property won't appear on the map but still appears in list view

**UX Notes:**
- Default map center: Accra (5.6037, -0.1870)
- Preserve existing search filters (price, beds, region, type) while in map view
- Show a "Search this area" button when the user moves the map (don't auto-fetch on every pan)

---

### 2. Mortgage Calculator

**API Endpoints:**
None required — this is a pure client-side calculation.

**Calculation Formula:**
```
Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]

Where:
  P = Loan amount (property price - down payment)
  r = Monthly interest rate (annual rate / 12 / 100)
  n = Total number of payments (loan term in years × 12)
```

**Default Values for Ghana:**
```json
{
  "defaultDownPaymentPercent": 20,
  "defaultInterestRate": 27.5,
  "defaultLoanTermYears": 15,
  "minDownPaymentPercent": 10,
  "maxLoanTermYears": 25
}
```

**Mobile Implementation:**
- Add a **"Mortgage Calculator"** section on the property detail screen, below the property details
- Pre-populate with the property's price
- Inputs:
  - Property price (pre-filled, editable)
  - Down payment (% slider or input, default 20%)
  - Interest rate (% input, default 27.5% — Ghana avg.)
  - Loan term (years selector: 5, 10, 15, 20, 25)
- Output:
  - Monthly payment amount (formatted as GHS)
  - Total interest paid over loan term
  - Total amount paid
  - Simple breakdown chart (principal vs. interest)
- Also accessible as a standalone tool from a "Tools" section or menu

**UX Notes:**
- Format all currency values as `GHS X,XXX`
- Update calculations in real-time as user adjusts inputs
- Consider adding a note: "Rates are indicative. Contact your bank for exact rates."

---

### 3. Floor Plan Support

**API Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/properties/:id` | Now returns `floorPlans` field |
| `PUT` | `/v1/agent/listings/:id` | Accepts `floorPlans` array in body |
| `POST` | `/v1/agent/listings` | Accepts `floorPlans` array in body |

**New Fields on Property:**
```json
{
  "floorPlans": [
    "https://cdn.example.com/properties/floor-plan-1.jpg",
    "https://cdn.example.com/properties/floor-plan-2.jpg"
  ],
  "...existing fields"
}
```

**Mobile Implementation:**
- On property detail screen, add a **"Floor Plans"** tab/section between the photo gallery and property details
- Display floor plan images in a scrollable gallery (similar to property photos)
- Tapping a floor plan opens it in a full-screen zoomable viewer (pinch-to-zoom is critical for floor plans)
- If `floorPlans` is empty/null, hide the section entirely
- For agent users creating/editing listings in the mobile app: add a floor plan upload section in the listing creation flow (separate from property photos)

---

### 4. Agent Reviews & Response Time

**API Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/v1/agents/:id/reviews?page=1&limit=10` | Public | Get paginated reviews for an agent |
| `POST` | `/v1/agents/:id/reviews` | Buyer JWT | Submit a review for an agent |
| `DELETE` | `/v1/agents/:id/reviews/:reviewId` | Author/Admin JWT | Delete a review (author or admin) |
| `GET` | `/v1/agents/:id` | Public | Now returns `rating` (computed avg), `reviewCount` |

**New Fields on Agent:**
```json
{
  "rating": 4.3,
  "reviewCount": 17,
  "...existing fields"
}
```

> Note: `rating` is now dynamically computed from the average of all reviews. Falls back to the static DB value if no reviews exist.
```

**Review Object:**
```json
{
  "id": "uuid",
  "rating": 5,
  "comment": "Very professional and responsive agent.",
  "userName": "Kofi A.",
  "createdAt": "2026-03-15T10:30:00Z"
}
```

**Submit Review Request:**
```json
{
  "rating": 5,
  "comment": "Great experience working with this agent."
}
```

**Mobile Implementation:**
- **Agent profile screen**: Show `rating` (star display) and `reviewCount` in the agent header
- **Reviews section**: Paginated list of reviews below agent listings — each review shows star rating, comment, reviewer name, and date
- **Submit review**: Authenticated buyers can write a review. Show 1–5 star selector + optional comment textarea. Use `POST /v1/agents/:id/reviews` with JWT token. Upsert behavior — submitting again updates the existing review.
- **Agent card** (on property detail screen): Show compact rating stars + review count ("4.3 ★ (17 reviews)")

**Validation Rules:**
- Rating: 1–5 integer, required
- Comment: max 1000 characters, optional
- One review per agent per user (upsert behavior — user can update their review)

---

## Previously Implemented Features

### Persistent Notifications

Full in-app notification system. See [API Documentation](./API.md#notifications-authenticated) for all endpoints.

**Key endpoints for mobile:**
- `GET /v1/notifications?page=1&limit=20&unread=true` — list notifications
- `GET /v1/notifications/unread-count` — badge count (poll every 30s)
- `PUT /v1/notifications/:id/read` — mark as read
- `PUT /v1/notifications/read-all` — mark all read
- `GET /v1/notifications/preferences` — get notification settings
- `PUT /v1/notifications/preferences` — update settings

### Password Reset Flow

- `POST /v1/auth/forgot-password` — sends reset email
- `POST /v1/auth/reset-password` — resets password with access/refresh tokens from email link

### Inquiry Status Tracking

- `PUT /v1/agent/inquiries/:id/status` — agents update inquiry status (new → read → responded → closed)
- Status field returned on `GET /v1/agent/inquiries`

### Image Gallery Lightbox

- Property detail returns `gallery: string[]` — implement a full-screen swipeable gallery with pinch-to-zoom
- First image in gallery is the main/hero image
