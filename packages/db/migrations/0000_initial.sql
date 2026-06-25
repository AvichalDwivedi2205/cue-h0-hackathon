CREATE TABLE IF NOT EXISTS workspaces (
  id text PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  user_display_name text NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces (slug);

CREATE TABLE IF NOT EXISTS connector_accounts (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  source text NOT NULL,
  label text NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS connector_accounts_workspace_idx ON connector_accounts (workspace_id);

CREATE TABLE IF NOT EXISTS chat_threads (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  title text NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_threads_workspace_updated_idx ON chat_threads (workspace_id, updated_at);

CREATE TABLE IF NOT EXISTS chat_messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  structured_content jsonb,
  created_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_messages_thread_created_idx ON chat_messages (thread_id, created_at);

CREATE TABLE IF NOT EXISTS memory_records (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  source text NOT NULL,
  citation_ids jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS memory_records_workspace_created_idx ON memory_records (workspace_id, created_at);

CREATE TABLE IF NOT EXISTS citations (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  source text NOT NULL,
  source_id text NOT NULL,
  label text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  url text,
  author_name text,
  freshness text NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS citations_workspace_source_idx ON citations (workspace_id, source, source_id);

CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL,
  priority text NOT NULL,
  due_at timestamp with time zone,
  owner_name text,
  citation_ids jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS tasks_workspace_status_idx ON tasks (workspace_id, status);

CREATE TABLE IF NOT EXISTS tickets (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  source text NOT NULL,
  external_id text NOT NULL,
  title text NOT NULL,
  status text NOT NULL,
  priority text NOT NULL,
  owner_name text,
  url text,
  citation_ids jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS tickets_workspace_status_idx ON tickets (workspace_id, status);

CREATE TABLE IF NOT EXISTS meetings (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  title text NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  location text NOT NULL,
  attendees jsonb NOT NULL,
  join_url text
);

CREATE INDEX IF NOT EXISTS meetings_workspace_starts_idx ON meetings (workspace_id, starts_at);

CREATE TABLE IF NOT EXISTS launches (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  target_date timestamp with time zone NOT NULL,
  summary text NOT NULL
);

CREATE INDEX IF NOT EXISTS launches_workspace_status_idx ON launches (workspace_id, status);

CREATE TABLE IF NOT EXISTS launch_checks (
  id text PRIMARY KEY,
  launch_id text NOT NULL,
  title text NOT NULL,
  status text NOT NULL,
  summary text NOT NULL,
  owner_name text,
  citation_ids jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS launch_checks_launch_status_idx ON launch_checks (launch_id, status);

CREATE TABLE IF NOT EXISTS approvals (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  workflow_run_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  action_type text NOT NULL,
  status text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL,
  resolved_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS approvals_workspace_status_idx ON approvals (workspace_id, status);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  workflow_type text NOT NULL,
  status text NOT NULL,
  state jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS workflow_runs_workspace_created_idx ON workflow_runs (workspace_id, created_at);

CREATE TABLE IF NOT EXISTS activity_events (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  source text NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  occurred_at timestamp with time zone NOT NULL,
  kind text NOT NULL,
  query text NOT NULL,
  unread boolean NOT NULL
);

CREATE INDEX IF NOT EXISTS activity_events_workspace_occurred_idx ON activity_events (workspace_id, occurred_at);
