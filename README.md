# GhanaDeals Monorepo (Next.js + Fastify)

This workspace includes:
- `apps/web`: Next.js web frontend (App Router, TypeScript)
- `apps/api`: Fastify backend API (TypeScript)
- `shared/types`: shared contracts for web, api, and Expo mobile

## Quick Start
1. Copy `.env.example` to `.env` and set values.
2. Install dependencies: `npm install`
3. Run web and api: `npm run dev`

## Individual apps
- Web: `npm run dev:web`
- API: `npm run dev:api`

## Build
- `npm run build`

## Notes
- API is versioned under `/v1` for Expo mobile compatibility.
