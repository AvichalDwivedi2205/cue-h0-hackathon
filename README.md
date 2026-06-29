# Cue for Teams

Cue connects work spread across Slack, Linear, GitHub, Notion, PostHog, Vercel, and the web. It plans an investigation, retrieves evidence, explains the answer with citations, and prepares approval-gated actions.

[Live app](https://cue-h0-hackathon.vercel.app) | [Architecture](docs/architecture.md) | [Submission notes](docs/submission-notes.md)

![Cue architecture](docs/cue-h0-architecture-full.png)

## Demo

The included workspace follows one connected company incident: beta users accept invitations but land in empty workspaces after the Aurora workspace migration. Cue ties together the report, owner, code change, product specification, conversion impact, deployment timing, and launch communication.

Recommended questions:

```text
Production code is breaking. Find the issue, who owns it, impact, and draft a Slack ping.
```

```text
What should GTM say publicly about beta invite confusion before H0 launch?
```

The first flow can post its generated update to a real Slack channel after explicit approval.

## What Works

- Clerk-protected workspace and public landing page.
- Visible planning with queued, running, and completed steps.
- Source-by-source retrieval trace across workspace and external sources.
- OpenAI Responses API synthesis with `gpt-5-mini`.
- Exa web search for external context.
- Evidence chips and source citations.
- Approval-gated Slack posting through `chat.postMessage`.
- Linear issue creation executor for approved actions.
- PostgreSQL persistence through Drizzle ORM.
- In-memory repository for fast local development.
- Light and dark themes.

## Architecture

```text
Browser
  -> Next.js API routes
  -> planner
  -> workspace and web retrieval
  -> evidence normalization
  -> OpenAI synthesis
  -> cited answer and action draft
  -> human approval
  -> deterministic Slack or Linear executor
```

Plans, retrieval traces, citations, workflow runs, and approvals share common TypeScript contracts. The repository boundary supports both PostgreSQL and an in-memory local runtime.

## Prerequisites

- Node.js 20 or newer
- pnpm 10
- Clerk application
- OpenAI API key
- Exa API key
- Optional PostgreSQL database
- Optional Slack and Linear credentials for approved actions

## Local Setup

1. Install dependencies:

```bash
corepack enable
pnpm install
```

2. Create the environment file:

```bash
cp .env.example .env
```

3. Add the minimum application credentials:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
CUE_MODEL=gpt-5-mini
EXA_API_KEY=...
```

4. Start Cue:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, then open `/app`.

## Database Setup

Without `DATABASE_URL`, Cue uses the in-memory repository and loads the included workspace automatically.

To use PostgreSQL or Amazon RDS for PostgreSQL:

```dotenv
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/cue_h0?sslmode=require
CUE_WORKSPACE_SLUG=cue-h0
```

Run migrations and seed the workspace:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The schema stores workspaces, connector accounts, citations, tickets, tasks, memory records, launch checks, activity events, chat messages, workflow runs, and approvals.

## Clerk Setup

Create a Clerk application and add these values to `.env`:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/app
```

The landing page remains public. `/app` and API routes require authentication.

## OpenAI and Exa

Configure live synthesis and web search:

```dotenv
OPENAI_API_KEY=sk-...
CUE_MODEL=gpt-5-mini
EXA_API_KEY=...
NODE_OPTIONS=--dns-result-order=ipv4first
```

Cue sends retrieved evidence to the OpenAI Responses API and asks for structured `summary` and `draft` output. Exa results are grouped under **External signals** rather than mixed with workspace evidence.

## Slack Setup

Create a Slack app and add these bot scopes:

- `channels:history`
- `channels:read`
- `chat:write`
- `groups:history` if using private channels
- `groups:read` if using private channels

Install the app into the workspace and invite it to the target channel:

```text
/invite @Cue H0 Demo
```

Copy the channel ID from **View channel details > About** and configure:

```dotenv
SLACK_BOT_TOKEN=xoxb-...
SLACK_LAUNCH_CHANNEL_ID=C0123456789
```

For the optional Slack Bolt process, also set:

```dotenv
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...
SLACK_SOCKET_MODE=true
```

Approved `slack_update` actions are posted by the server. Cue does not post before approval.

## Linear Setup

Create a personal API key from **Settings > Security & access > Personal API keys**. Add:

```dotenv
LINEAR_API_KEY=lin_api_...
LINEAR_TEAM_ID=...
```

The Linear executor uses the GraphQL `issueCreate` mutation after an action is approved.

## Additional Connector Configuration

Connector status can use these credentials:

```dotenv
GITHUB_TOKEN=ghp_...
NOTION_TOKEN=secret_...
POSTHOG_API_KEY=phx_...
VERCEL_TOKEN=...
VERCEL_PROJECT_ID=...
```

Never commit `.env`. It is ignored by Git.

## Commands

```bash
pnpm dev          # run the Next.js app
pnpm build        # build every workspace package
pnpm typecheck    # type-check every workspace package
pnpm db:generate  # generate Drizzle migrations
pnpm db:migrate   # apply database migrations
pnpm db:seed      # seed the Cue workspace
```

## Deployment

The repository includes `vercel.json` for the monorepo build.

```bash
vercel link
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add OPENAI_API_KEY
vercel env add EXA_API_KEY
vercel --prod
```

Add database and connector environment variables in Vercel when those paths are enabled.

## Repository Layout

```text
apps/web          Next.js landing page, workspace, auth, and API routes
apps/slack        Optional Slack Bolt application
packages/types    Shared contracts for evidence, plans, chats, and approvals
packages/db       Drizzle schema and repository implementations
packages/runtime  Planning, retrieval, synthesis, and action execution
docs              Architecture and submission material
```

## Prototype Scope

Cue is a functional hackathon prototype. OpenAI synthesis, Exa search, authentication, and approved Slack posting run live. Workspace records are normalized into the shared evidence graph. Continuous connector synchronization, source-level permission mirroring, and production observability are planned next.
