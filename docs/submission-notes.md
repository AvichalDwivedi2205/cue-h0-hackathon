# Submission Notes

## Positioning

Cue for Teams is a minimal Glean-like AI command center for launch-focused teams. The demo shows how Cue can answer "Are we ready to submit H0?" by pulling together Slack, GitHub, Linear, Vercel, Notion, tasks, meetings, remembered decisions, citations, and approval-gated next actions.

## Why Aurora PostgreSQL

The existing Cue backend is already Postgres and Drizzle shaped. Aurora PostgreSQL lets the hackathon repo keep the production data model close to the real product while avoiding a DynamoDB rewrite. The implementation uses portable Postgres tables and avoids Supabase-specific APIs.

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Without `DATABASE_URL`, the app starts with seeded in-memory demo data so the web experience is immediately testable.

For local Postgres or Aurora:

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/cue_h0"
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Environment Variables

- `DATABASE_URL`: standard Postgres connection string. Use Aurora PostgreSQL in production.
- `CUE_WORKSPACE_SLUG`: defaults to `cue-h0`.
- `NEXT_PUBLIC_CUE_DEMO_WORKSPACE`: optional frontend label.
- `SLACK_BOT_TOKEN`: optional Slack bot token.
- `SLACK_SIGNING_SECRET`: optional Slack signing secret.
- `SLACK_APP_TOKEN`: optional Slack app-level token for socket mode.
- `SLACK_SOCKET_MODE`: defaults to `true`; set `false` for HTTP mode.

## Demo Script

1. Open the web app locally.
2. Review the Home page:
   - Today has meetings, due tasks, and tickets needing attention.
   - For you has launch risks, blockers, approvals, mentions, and remembered decisions.
   - Recent activity has Slack, GitHub, Notion, Vercel, and Cue memory events.
3. Ask: `Are we ready to submit H0?`
4. Confirm Cue creates a saved chat thread.
5. Review the answer:
   - concise readiness verdict;
   - citations/evidence cards;
   - missing PostHog analytics evidence;
   - blockers for Aurora migration verification and Vercel production promotion;
   - approval-gated suggested actions.
6. Approve an action card to show the approval flow.
7. Reopen Chats and resume the saved thread.

## What Was Copied/Trimmed From Cue

The hackathon repo keeps the useful shape of the existing Cue Slack app:

- repository boundary;
- Drizzle/Postgres schema style;
- citations and evidence model;
- launch-readiness workflow concept;
- approval-gated action model;
- optional Slack Bolt surface.

It intentionally excludes the macOS menu bar app, ScreenCaptureKit, Deepgram voice stack, pet overlay, and Cloudflare Worker proxy.
