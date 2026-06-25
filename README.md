# Cue for Teams - H0 Hackathon

Focused hackathon submission for Cue for Teams: a minimal AI workplace command center for chat, launch readiness, team memory, citations, and approval-gated actions.

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The web app runs at `http://localhost:3000`. If `DATABASE_URL` is not set, the app uses seeded demo data in memory. For the production path, point `DATABASE_URL` at Amazon Aurora PostgreSQL and run:

```bash
pnpm db:migrate
pnpm db:seed
```

## Apps

- `apps/web`: Next.js app for Vercel.
- `apps/slack`: optional Slack Bolt surface that uses the shared runtime.

## Packages

- `packages/db`: Drizzle schema, Aurora-compatible Postgres repository, seed data.
- `packages/runtime`: shared Cue assistant runtime and launch-readiness workflow.
- `packages/types`: shared TypeScript types for app/runtime/db boundaries.

## Docs

- [Architecture](docs/architecture.md)
- [Submission Notes](docs/submission-notes.md)
