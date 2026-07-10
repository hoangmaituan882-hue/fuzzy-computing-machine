# Galgame Screening

A Galgame nomination, voting, and screening-history app for three community groups. It evolved from the FlareStarter SaaS template; the supported runtime is now **TanStack Start + Node.js + PostgreSQL**.

[简体中文](README.md)

## Features

- Anonymous group identity selection, group-scoped nominations, voting, and unvoting.
- Bangumi search for game covers and descriptions.
- Better Auth email/OAuth flows and administrator roles.
- Signed-in screening analytics, history, ratings, and comments.
- Admin pages for users, group cards, waitlist entries, sponsors, and feedback.
- Retained Stripe, Resend, docs, SEO, and i18n capabilities from the starter.

## Stack

React 19, TanStack Start/Router, TypeScript 6, PostgreSQL 16, Drizzle ORM, Better Auth, Tailwind CSS 4, Node.js 22, and Docker Compose.

## Local development

```bash
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
pnpm db:migrate
pnpm dev
```

Open <http://localhost:3004>. Required local values are `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ characters), and `BETTER_AUTH_URL=http://localhost:3004`.

```bash
pnpm lint
pnpm typecheck
pnpm test:node
pnpm build
```

`pnpm test` also runs the legacy Workers/D1 integration suite. That suite has not yet been migrated to an isolated PostgreSQL test database and is expected to fail during this transition.

## Deployment

```bash
cp .env.1panel.example .env
# Set strong production values.
docker compose up -d --build
```

The application container applies every pending SQL file from `drizzle/postgres` before starting the Node server. PostgreSQL data and uploaded files are stored in Docker volumes. See [DEPLOY_1PANEL.md](DEPLOY_1PANEL.md).

## Migration status

Cloudflare Worker, Wrangler, and D1 test files remain for reference but are not the supported production path. New runtime and database work must target Node.js, PostgreSQL, and local/volume-backed storage. See [AGENTS.md](AGENTS.md) for the current repository conventions.

Known follow-up work includes migrating integration tests to PostgreSQL, introducing an explicit campaign/round model, completing admin lifecycle actions, and strengthening anonymous participation abuse controls.

## License

[Apache License 2.0](LICENSE)
