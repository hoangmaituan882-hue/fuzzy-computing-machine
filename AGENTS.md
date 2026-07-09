# AGENTS.md

Guide for AI coding agents (Claude Code, Codex, etc.) working in this repo.

## What this is

FlareStarter — a Cloudflare-native SaaS starter on **TanStack Start + Cloudflare Workers**, with D1 (SQLite) + KV, Drizzle ORM, better-auth, Stripe, Resend, and Tailwind v4. Clone it and build your product on top.

## Structure

- `src/features/*` — vertical feature slices, each self-contained (schema / server fns / actions / components): `admin`, `analytics`, `audience`, `auth`, `billing`, `changelog`, `docs`, `email`, `i18n`, `maintenance`, `notifications`, `seo`, `storage`, `theme`, `waitlist`.
- `src/routes/{-$locale}/` — file-based routes with an optional locale prefix (`/` = en, `/zh` = zh). Top-level routes (`api`, `sitemap`, `robots`, `docs`) live outside the locale group.
- `src/components/` — `ui/` primitives + `marketing/` landing + `app/` shell.
- `src/db/` — Drizzle client + `schema.ts` barrel; tables in `src/db/tables/` and feature `*.schema.ts`.
- `src/content/docs/` — in-app docs, grouped into `getting-started/`, `features/`, `platform/`, `customization/` (read `platform/cf-gotchas.mdx` before touching Workers/D1 specifics).

## Conventions

- **Env:** read from `@/lib/env` (re-exports `cloudflare:workers`). Never use `process.env`. In server-only modules read env **lazily** inside the function (`const { env } = await import('@/lib/env')`) so pure cores stay node-testable.
- **i18n:** `src/features/i18n/dictionaries/en.ts` + `zh.ts` must be structurally identical (`zh` is typed `Dict = typeof en`). Add every key to both.
- **DB:** Drizzle + D1 migrations — `pnpm db:generate` then `pnpm db:migrate:local`; register new tables in `src/db/schema.ts`.
- **No mock, graceful degradation:** optional integrations (Resend, Stripe, Turnstile, Sentry, analytics) switch off when their env keys are absent — keep that behavior.
- **Routes:** after adding a route, run `pnpm build` before `pnpm typecheck` (the route tree is generated at build).
- **Tests:** Vitest — node pool (`*.node.test.ts`) for pure logic, workers pool (`*.workers.test.ts`) for D1; the workers pool does NOT auto-apply migrations (hand-create tables in `beforeAll`).

## Commands

```bash
pnpm dev               # vite dev on :3000
pnpm typecheck         # fumadocs-mdx && tsc --noEmit
pnpm test                  # vitest run
pnpm build             # vite build
pnpm db:migrate:local  # apply D1 migrations locally
pnpm deploy:prod       # CLOUDFLARE_ENV=production build + wrangler deploy (staging: deploy:staging)
```

## UI & Design Conventions

> [!IMPORTANT]
> **在增加动画与UI组件之前，必须先搜索源码/现有文档，查明当前项目中是否已经存在该组件/动画的实现或相关库（如 `transitions.dev`、`beUI`、`Pixel-Perfect` 等已安装的组件），避免重复创建或重复引入。**
> **Before adding animations or UI components, you MUST search the source code and existing documentation first to verify if a matching implementation or component already exists in the workspace. Avoid creating duplicate components or introducing redundant libraries if an existing one can be used or extended.**

When adding or modifying user interfaces, components, or animations, follow this stack:

1. **shadcn/ui** (Standard UI Primitives):
   - Use the configured shadcn CLI to install standard UI primitives.
   - Command: `npx shadcn add <component-name>`
   - Target files are installed in `src/components/ui/*`.

2. **Pixel-Perfect** (Precision Components & Micro-interactions):
   - For bespoke designs, highly detailed micro-interactions, animations, and custom buttons/widgets (e.g. magnetic buttons, glassmorphic cards, bento grids, and particle fields), leverage the integrated `@pixel-perfect` registry. Note: This website does NOT use skeuomorphic/realistic UI (e.g. no 3D thick buttons); keep all designs flat-modern and glassmorphic.
   - Command: `npx shadcn add @pixel-perfect/<component-name>`
   - Core interactive dependencies (`gsap`, `@gsap/react`, `framer-motion`) are already pre-installed.
   - If imported components reference `@/lib/cn`, update the import path to the project's standard alias `@/lib/utils`.
3. **beUI** (starc007/ui-components - Advanced WebGL Shaders & Staggered Menus):
   - For interactive radial menus (Bloom Menu), cylinder carousels, swipeable mobile lists, and WebGL shaders (metaballs, grain, noise), leverage the `starc007/ui-components` registry.
   - Command: `npx shadcn add @starc007/ui-components/<component-name>`
   - Align `@/lib/cn` imports to `@/lib/utils` as standard.



3. **transitions.dev** (Reusable Transitions & UI State Animations):
   - Every transition in `transitions.dev` (all 21 standard transitions) is compiled and globally imported under [transitions.css](file:///f:/00000000000000000/0962/flarestarter/src/styles/transitions.css).
   - Use these pre-defined transition styles instead of writing ad-hoc CSS transitions.
   - Apply selectors (e.g. `.t-resize`, `.t-dropdown`, `.t-modal`, `.t-accordion`) and toggle target state attributes (e.g. `data-state="open"`, `data-state="a"|"b"`, `aria-expanded="true"`) to trigger the transition.
   - Ensure all animations preserve `@media (prefers-reduced-motion: reduce)` rules for accessibility.

