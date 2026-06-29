# Submission Notes

## Positioning

Cue for Teams is a work intelligence and execution agent. The demo shows Cue investigating production breakage and preparing GTM communication by connecting Slack, GitHub, Linear, Vercel, Notion, PostHog, Exa, citations, and approval-gated actions.

## Why PostgreSQL

The Cue backend is Postgres and Drizzle shaped. The implementation uses portable PostgreSQL tables, works with Amazon RDS for PostgreSQL, and avoids vendor-specific database APIs.

## Devpost Deployment Details

- Published Vercel app: https://cue-h0-hackathon.vercel.app
- Vercel Team ID: `team_7VtoXeQBK9yErObDrQynLY3P`
- Vercel Project ID: `prj_l9kEsiWAEFUZebAUX08mSA3Nm6zJ`
- Current production deployment: `dpl_E8EeeqaWeX8op2Vt3RcSoWUMdhgU`
- Architecture diagram upload: `docs/cue-h0-architecture-full.png`
- Architecture source files: `docs/cue-h0-architecture.svg`, `docs/cue-h0-architecture.mmd`

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Without `DATABASE_URL`, the app starts with seeded in-memory demo data so the web experience is immediately testable.

For local PostgreSQL or Amazon RDS:

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/cue_h0"
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Environment Variables

- `DATABASE_URL`: standard PostgreSQL connection string. Amazon RDS is supported.
- `CUE_WORKSPACE_SLUG`: defaults to `cue-h0`.
- `NEXT_PUBLIC_CUE_DEMO_WORKSPACE`: optional frontend label.
- `SLACK_BOT_TOKEN`: optional Slack bot token.
- `SLACK_SIGNING_SECRET`: optional Slack signing secret.
- `SLACK_APP_TOKEN`: optional Slack app-level token for socket mode.
- `SLACK_SOCKET_MODE`: defaults to `true`; set `false` for HTTP mode.
- `SLACK_LAUNCH_CHANNEL_ID`: channel where approved launch updates are posted.
- `LINEAR_API_KEY` and `LINEAR_TEAM_ID`: create approved Linear blocker tickets.
- `GITHUB_TOKEN` or `GITHUB_APP_ID` + `GITHUB_PRIVATE_KEY`, `NOTION_TOKEN`, `POSTHOG_API_KEY`, `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: configure connector status in the workspace menu.

## Demo Script

1. Open the web app locally.
2. Review the Home page:
   - Today has meetings, due tasks, and tickets needing attention.
   - For you has launch risks, blockers, approvals, mentions, and remembered decisions.
   - Recent activity has Slack, GitHub, Notion, Vercel, and Cue memory events.
3. Ask: `Production code is breaking. Find the issue, who owns it, impact, and draft a Slack ping.`
4. Confirm Cue creates a saved chat thread.
5. Review the answer:
   - production-impact verdict;
   - citations/evidence cards;
   - PostHog conversion impact and Vercel release timing;
   - owners for the code fix, verification, and messaging;
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
