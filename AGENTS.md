# AGENTS.md

Current development guide for this repository.

## Product and runtime

This is a Galgame nomination/voting and screening-history application for three community groups. It originated from FlareStarter, but the supported runtime is now:

- TanStack Start + React 19 on Node.js 22
- PostgreSQL 16 through postgres.js and Drizzle `pg-core`
- local filesystem storage through `UPLOAD_DIR` (a Docker volume in production)
- Docker Compose / 1Panel deployment

Cloudflare Worker, Wrangler, D1, R2, and Workers-pool test files are legacy migration artifacts. Do not build new functionality on them.

## Structure

- `src/features/screening/`: current product domain: group identity, nominations, votes, screenings, reviews, analytics, and Bangumi search.
- `src/features/*`: vertical feature slices for auth, billing, storage, email, admin, feedback, sponsor, waitlist, and related template capabilities.
- `src/routes/{-$locale}/`: file routes with optional locale prefix.
- `src/db/`: PostgreSQL client and schema barrel.
- `drizzle/postgres/`: ordered PostgreSQL SQL migrations.
- `src/server.ts`: TanStack server entry; applies environment validation and security headers.
- `server/serve.mjs`: Node HTTP/static-file adapter for the production bundle.

## Required conventions

- Environment access is centralized in `src/lib/env.ts`. Do not use `process.env` elsewhere.
- Server-only dependencies must remain behind server modules or lazy imports where route bundling requires it.
- New tables use `drizzle-orm/pg-core` and must be exported from `src/db/schema.ts`.
- Generate schema changes with `pnpm db:generate`. Never edit an already-applied migration; the runner verifies SHA-256 checksums.
- The migration runner executes every pending `drizzle/postgres/*.sql` file in lexical order and records it in `_app_migrations`.
- Keep English and Chinese dictionary shapes identical when changing shared i18n text.
- Optional integrations must degrade clearly when their keys are absent.
- Never expose anonymous participant IDs in loader/server-function responses. The screening participant cookie is a bearer credential and must remain HttpOnly.
- Validate mutation input on the server even when the form already has client-side limits.

## Commands

```bash
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
pnpm db:migrate
pnpm dev                 # http://localhost:3004

pnpm lint
pnpm typecheck
pnpm test:node
pnpm build
```

`pnpm test` includes legacy Workers/D1 integration tests and is not green until the PostgreSQL test migration is complete. Do not point tests at a shared or production `DATABASE_URL`.

## UI conventions

- Reuse `src/components/ui/*`, existing transitions, Lucide icons, and current design tokens before adding dependencies.
- Preserve keyboard operation and `prefers-reduced-motion` behavior for new motion.
- The primary product is Chinese-first. Do not publish Chinese pages with `lang="en"`; locale cleanup is tracked work.
- Keep operational screens dense and predictable. Avoid marketing-card layouts inside the app shell.

## Current priority debt

1. Move database integration tests from Miniflare/D1 to an isolated PostgreSQL database.
2. Add a first-class campaign/round model so nomination and vote uniqueness is scoped per event.
3. Add admin actions to open/close a campaign, select nominations, and complete a screening.
4. Strengthen anonymous abuse controls; HttpOnly cookies prevent credential disclosure but cannot stop deliberate cookie deletion.
5. Remove the remaining Cloudflare deployment artifacts after PostgreSQL coverage is restored.
