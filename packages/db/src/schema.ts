import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type {
  CueAssistantMessage,
  WorkspaceSource,
} from "@cue-h0/types";

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    userDisplayName: text("user_display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("workspaces_slug_idx").on(table.slug)],
);

export const connectorAccounts = pgTable(
  "connector_accounts",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    source: text("source").$type<WorkspaceSource>().notNull(),
    label: text("label").notNull(),
    status: text("status").$type<"connected" | "needs_attention" | "disabled">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("connector_accounts_workspace_idx").on(table.workspaceId)],
);

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    title: text("title").notNull(),
    status: text("status").$type<"ok" | "warn" | "muted">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("chat_threads_workspace_updated_idx").on(table.workspaceId, table.updatedAt)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id").notNull(),
    role: text("role").$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    structuredContent: jsonb("structured_content").$type<CueAssistantMessage>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("chat_messages_thread_created_idx").on(table.threadId, table.createdAt)],
);

export const memoryRecords = pgTable(
  "memory_records",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    source: text("source").$type<WorkspaceSource>().notNull(),
    citationIds: jsonb("citation_ids").$type<string[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("memory_records_workspace_created_idx").on(table.workspaceId, table.createdAt)],
);

export const citations = pgTable(
  "citations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    source: text("source").$type<WorkspaceSource>().notNull(),
    sourceId: text("source_id").notNull(),
    label: text("label").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    url: text("url"),
    authorName: text("author_name"),
    freshness: text("freshness").$type<"fresh" | "stale" | "unknown">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("citations_workspace_source_idx").on(table.workspaceId, table.source, table.sourceId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status").$type<"todo" | "in_progress" | "blocked" | "done">().notNull(),
    priority: text("priority").$type<"low" | "medium" | "high">().notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    ownerName: text("owner_name"),
    citationIds: jsonb("citation_ids").$type<string[]>().notNull(),
  },
  (table) => [index("tasks_workspace_status_idx").on(table.workspaceId, table.status)],
);

export const tickets = pgTable(
  "tickets",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    source: text("source").$type<"github" | "linear">().notNull(),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull(),
    priority: text("priority").$type<"low" | "medium" | "high">().notNull(),
    ownerName: text("owner_name"),
    url: text("url"),
    citationIds: jsonb("citation_ids").$type<string[]>().notNull(),
  },
  (table) => [index("tickets_workspace_status_idx").on(table.workspaceId, table.status)],
);

export const meetings = pgTable(
  "meetings",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    location: text("location").notNull(),
    attendees: jsonb("attendees").$type<string[]>().notNull(),
    joinUrl: text("join_url"),
  },
  (table) => [index("meetings_workspace_starts_idx").on(table.workspaceId, table.startsAt)],
);

export const launches = pgTable(
  "launches",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: text("name").notNull(),
    status: text("status").$type<"ready" | "at_risk" | "blocked" | "insufficient_evidence">().notNull(),
    targetDate: timestamp("target_date", { withTimezone: true }).notNull(),
    summary: text("summary").notNull(),
  },
  (table) => [index("launches_workspace_status_idx").on(table.workspaceId, table.status)],
);

export const launchChecks = pgTable(
  "launch_checks",
  {
    id: text("id").primaryKey(),
    launchId: text("launch_id").notNull(),
    title: text("title").notNull(),
    status: text("status").$type<"pass" | "risk" | "blocked" | "unknown">().notNull(),
    summary: text("summary").notNull(),
    ownerName: text("owner_name"),
    citationIds: jsonb("citation_ids").$type<string[]>().notNull(),
  },
  (table) => [index("launch_checks_launch_status_idx").on(table.launchId, table.status)],
);

export const approvals = pgTable(
  "approvals",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    workflowRunId: text("workflow_run_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    actionType: text("action_type").$type<"linear_ticket" | "slack_update" | "deployment_note" | "watch">().notNull(),
    status: text("status").$type<"pending" | "approved" | "rejected">().notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [index("approvals_workspace_status_idx").on(table.workspaceId, table.status)],
);

export const workflowRuns = pgTable(
  "workflow_runs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    workflowType: text("workflow_type").$type<"launch_readiness" | "workspace_search" | "chat">().notNull(),
    status: text("status").$type<"running" | "awaiting_approval" | "completed" | "failed">().notNull(),
    state: jsonb("state").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("workflow_runs_workspace_created_idx").on(table.workspaceId, table.createdAt)],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    source: text("source").$type<WorkspaceSource>().notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    kind: text("kind").$type<"mention" | "blocker" | "approval" | "launch_risk" | "update" | "decision">().notNull(),
    query: text("query").notNull(),
    unread: boolean("unread").notNull(),
  },
  (table) => [index("activity_events_workspace_occurred_idx").on(table.workspaceId, table.occurredAt)],
);
