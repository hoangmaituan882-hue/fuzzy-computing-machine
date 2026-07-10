# Contributing

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker with Compose

## Local setup

```bash
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
pnpm db:migrate
pnpm dev
```

The application runs at <http://localhost:3004>.

## Checks

Run these before submitting a change:

```bash
pnpm lint
pnpm typecheck
pnpm test:node
pnpm build
```

The old Workers/D1 integration suite is still available through `pnpm test:legacy-workers`, but it is not compatible with the current PostgreSQL client. New database tests must use an isolated PostgreSQL database; never use a shared development or production database.

## Code conventions

- Keep features in `src/features/<feature>` and route files focused on loading and presentation.
- Read environment values from `src/lib/env.ts` only.
- Use Drizzle `pg-core`; export new schema from `src/db/schema.ts`.
- Generate forward-only SQL migrations and do not modify migrations already recorded in `_app_migrations`.
- Enforce ownership, authorization, length limits, and state transitions on the server.
- Add dictionary keys to both English and Chinese dictionaries.
- Reuse existing UI primitives and motion utilities.

## Database changes

```bash
pnpm db:generate
pnpm db:migrate
```

Review generated SQL before applying it. For destructive changes, provide an explicit data migration and rollback/backup plan. The migration runner uses file checksums, so changing an applied file is treated as an error.

## Commit style

Use scoped Conventional Commits such as `fix(screening): hide participant credentials` or `docs(setup): document postgres workflow`.

## Known transition

Wrangler, Worker entry, D1 migrations, and Workers tests are retained temporarily as migration references. They are not the target platform for new code. The current production path is documented in [DEPLOY_1PANEL.md](DEPLOY_1PANEL.md).
