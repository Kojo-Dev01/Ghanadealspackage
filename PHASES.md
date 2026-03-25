Phase 1 — Property Creation Flow (High Priority)
Agents currently can view their listings but can't create or edit them. This is the core missing workflow:

POST /v1/properties — create listing endpoint
PUT /v1/properties/:id — edit listing endpoint
DELETE /v1/properties/:id — delete listing endpoint
Agent dashboard "Add Listing" page — form with image upload via Wasabi signed URLs
Agent dashboard "Edit Listing" page
Phase 2 — Save Property UX (Quick Win)
The saved properties API exists but there's no heart/bookmark button on property cards and detail pages for logged-in buyers.

Phase 3 — Production Hardening
Rate limiting (@fastify/rate-limit)
Helmet security headers (@fastify/helmet)
Input validation with Zod schemas
Proper CORS allowlist by environment
Error tracking (Sentry)
Phase 4 — Polish & Features
Email notifications (inquiry received, listing approved/flagged)
Enhanced search (price range, beds/baths filters)
Related properties endpoint
Agent verification workflow
Phase 5 — Deployment
Docker/compose production config (files exist but need wiring)
Environment-specific configs
CDN for media URLs