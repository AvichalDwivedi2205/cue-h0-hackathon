import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type {
  ActivityEvent,
  ApprovalRecord,
  ChatMessageRecord,
  ChatThreadRecord,
  ChatThreadWithMessages,
  ConnectorAccountSummary,
  HomeSnapshot,
  LaunchCheckRecord,
  LaunchRecord,
  MeetingRecord,
  MemoryRecord,
  SourceCitation,
  TaskRecord,
  TicketRecord,
  WorkflowRunRecord,
  WorkspaceSummary,
} from "@cue-h0/types";
import { createId, nowIsoString } from "./ids.js";
import type {
  AppendChatExchangeInput,
  CreateApprovalInput,
  CreateChatThreadInput,
  CueRepository,
  DemoSeedData,
  LaunchReadinessContext,
} from "./repository.js";
import * as schema from "./schema.js";

type Database = PostgresJsDatabase<typeof schema>;

export class PostgresCueRepository implements CueRepository {
  constructor(private readonly database: Database) {}

  async getWorkspaceBySlug(workspaceSlug: string): Promise<WorkspaceSummary | undefined> {
    const [workspace] = await this.database.select().from(schema.workspaces).where(eq(schema.workspaces.slug, workspaceSlug)).limit(1);
    return workspace ? mapWorkspace(workspace) : undefined;
  }

  async getHomeSnapshot(workspaceSlug: string): Promise<HomeSnapshot> {
    const workspace = await this.getWorkspaceBySlug(workspaceSlug);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceSlug}`);
    }

    const [
      connectors,
      meetingRows,
      taskRows,
      ticketRows,
      approvalRows,
      forYouRows,
      recentActivityRows,
      memoryRows,
    ] = await Promise.all([
      this.database.select().from(schema.connectorAccounts).where(eq(schema.connectorAccounts.workspaceId, workspace.id)),
      this.database
        .select()
        .from(schema.meetings)
        .where(eq(schema.meetings.workspaceId, workspace.id))
        .orderBy(schema.meetings.startsAt)
        .limit(5),
      this.database
        .select()
        .from(schema.tasks)
        .where(and(eq(schema.tasks.workspaceId, workspace.id), ne(schema.tasks.status, "done")))
        .limit(5),
      this.database
        .select()
        .from(schema.tickets)
        .where(eq(schema.tickets.workspaceId, workspace.id))
        .limit(5),
      this.database
        .select()
        .from(schema.approvals)
        .where(and(eq(schema.approvals.workspaceId, workspace.id), eq(schema.approvals.status, "pending")))
        .limit(5),
      this.database
        .select()
        .from(schema.activityEvents)
        .where(eq(schema.activityEvents.workspaceId, workspace.id))
        .orderBy(desc(schema.activityEvents.occurredAt))
        .limit(5),
      this.database
        .select()
        .from(schema.activityEvents)
        .where(eq(schema.activityEvents.workspaceId, workspace.id))
        .orderBy(desc(schema.activityEvents.occurredAt))
        .limit(8),
      this.database
        .select()
        .from(schema.memoryRecords)
        .where(eq(schema.memoryRecords.workspaceId, workspace.id))
        .orderBy(desc(schema.memoryRecords.createdAt))
        .limit(5),
    ]);

    return {
      workspace,
      connectors: connectors.map(mapConnector),
      meetings: meetingRows.map(mapMeeting),
      dueTasks: taskRows.map(mapTask),
      ticketsNeedingAttention: ticketRows.map(mapTicket),
      pendingApprovals: approvalRows.map(mapApproval),
      forYou: forYouRows.map(mapActivityEvent),
      recentActivity: recentActivityRows.map(mapActivityEvent),
      rememberedDecisions: memoryRows.map(mapMemoryRecord),
    };
  }

  async listChatThreads(workspaceId: string): Promise<ChatThreadRecord[]> {
    const rows = await this.database
      .select()
      .from(schema.chatThreads)
      .where(eq(schema.chatThreads.workspaceId, workspaceId))
      .orderBy(desc(schema.chatThreads.updatedAt))
      .limit(25);
    return rows.map(mapChatThread);
  }

  async getChatThread(threadId: string): Promise<ChatThreadWithMessages | undefined> {
    const [thread] = await this.database.select().from(schema.chatThreads).where(eq(schema.chatThreads.id, threadId)).limit(1);
    if (!thread) {
      return undefined;
    }
    const messages = await this.database
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.threadId, threadId))
      .orderBy(schema.chatMessages.createdAt);
    return {
      ...mapChatThread(thread),
      messages: messages.map(mapChatMessage),
    };
  }

  async createChatThreadWithMessages(input: CreateChatThreadInput): Promise<ChatThreadWithMessages> {
    const now = new Date();
    const threadId = createId("thread");
    const userMessageId = createId("message");
    const assistantMessageId = createId("message");
    await this.database.transaction(async (transaction) => {
      await transaction.insert(schema.chatThreads).values({
        id: threadId,
        workspaceId: input.workspaceId,
        title: input.title,
        status: input.status,
        createdAt: now,
        updatedAt: now,
      });
      await transaction.insert(schema.chatMessages).values([
        {
          id: userMessageId,
          threadId,
          role: "user",
          content: input.userMessage,
          createdAt: now,
        },
        {
          id: assistantMessageId,
          threadId,
          role: "assistant",
          content: input.assistantMessage.kind === "structured" ? input.assistantMessage.summary : input.assistantMessage.text,
          structuredContent: input.assistantMessage,
          createdAt: now,
        },
      ]);
    });
    const createdThread = await this.getChatThread(threadId);
    if (!createdThread) {
      throw new Error(`Failed to create thread: ${threadId}`);
    }
    return createdThread;
  }

  async appendChatExchange(input: AppendChatExchangeInput): Promise<ChatThreadWithMessages> {
    const now = new Date();
    await this.database.transaction(async (transaction) => {
      await transaction
        .update(schema.chatThreads)
        .set({
          status: input.status,
          updatedAt: now,
        })
        .where(eq(schema.chatThreads.id, input.threadId));
      await transaction.insert(schema.chatMessages).values([
        {
          id: createId("message"),
          threadId: input.threadId,
          role: "user",
          content: input.userMessage,
          createdAt: now,
        },
        {
          id: createId("message"),
          threadId: input.threadId,
          role: "assistant",
          content: input.assistantMessage.kind === "structured" ? input.assistantMessage.summary : input.assistantMessage.text,
          structuredContent: input.assistantMessage,
          createdAt: now,
        },
      ]);
    });
    const updatedThread = await this.getChatThread(input.threadId);
    if (!updatedThread) {
      throw new Error(`Thread not found after append: ${input.threadId}`);
    }
    return updatedThread;
  }

  async loadLaunchReadinessContext(workspaceId: string): Promise<LaunchReadinessContext> {
    const [workspaceRow] = await this.database.select().from(schema.workspaces).where(eq(schema.workspaces.id, workspaceId)).limit(1);
    if (!workspaceRow) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    const [launchRow] = await this.database
      .select()
      .from(schema.launches)
      .where(eq(schema.launches.workspaceId, workspaceId))
      .orderBy(desc(schema.launches.targetDate))
      .limit(1);
    const [launchCheckRows, taskRows, ticketRows, memoryRows, approvalRows] = await Promise.all([
      launchRow
        ? this.database.select().from(schema.launchChecks).where(eq(schema.launchChecks.launchId, launchRow.id))
        : Promise.resolve([]),
      this.database.select().from(schema.tasks).where(eq(schema.tasks.workspaceId, workspaceId)),
      this.database.select().from(schema.tickets).where(eq(schema.tickets.workspaceId, workspaceId)),
      this.database.select().from(schema.memoryRecords).where(eq(schema.memoryRecords.workspaceId, workspaceId)),
      this.database
        .select()
        .from(schema.approvals)
        .where(and(eq(schema.approvals.workspaceId, workspaceId), eq(schema.approvals.status, "pending"))),
    ]);
    const citationIds = collectCitationIds([
      ...launchCheckRows.map((launchCheck) => launchCheck.citationIds),
      ...taskRows.map((task) => task.citationIds),
      ...ticketRows.map((ticket) => ticket.citationIds),
      ...memoryRows.map((memoryRecord) => memoryRecord.citationIds),
    ]);
    const citationRows =
      citationIds.length > 0
        ? await this.database.select().from(schema.citations).where(inArray(schema.citations.id, citationIds))
        : [];

    return {
      workspace: mapWorkspace(workspaceRow),
      launch: launchRow ? mapLaunch(launchRow) : undefined,
      launchChecks: launchCheckRows.map(mapLaunchCheck),
      tasks: taskRows.map(mapTask),
      tickets: ticketRows.map(mapTicket),
      memoryRecords: memoryRows.map(mapMemoryRecord),
      pendingApprovals: approvalRows.map(mapApproval),
      citations: citationRows.map(mapCitation),
    };
  }

  async createWorkflowRun(workflowRunRecord: WorkflowRunRecord): Promise<void> {
    await this.database.insert(schema.workflowRuns).values({
      id: workflowRunRecord.id,
      workspaceId: workflowRunRecord.workspaceId,
      workflowType: workflowRunRecord.workflowType,
      status: workflowRunRecord.status,
      state: workflowRunRecord.state,
      createdAt: new Date(workflowRunRecord.createdAt),
      updatedAt: new Date(workflowRunRecord.updatedAt),
    });
  }

  async createApproval(input: CreateApprovalInput): Promise<ApprovalRecord> {
    const now = new Date();
    const approval: ApprovalRecord = {
      id: createId("approval"),
      workspaceId: input.workspaceId,
      workflowRunId: input.workflowRunId,
      title: input.title,
      description: input.description,
      actionType: input.actionType,
      status: "pending",
      payload: input.payload,
      createdAt: now.toISOString(),
    };
    await this.database.insert(schema.approvals).values({
      ...approval,
      createdAt: now,
      resolvedAt: null,
    });
    return approval;
  }

  async resolveApproval(approvalId: string, status: "approved" | "rejected"): Promise<ApprovalRecord | undefined> {
    const [approval] = await this.database
      .update(schema.approvals)
      .set({
        status,
        resolvedAt: new Date(),
      })
      .where(eq(schema.approvals.id, approvalId))
      .returning();
    return approval ? mapApproval(approval) : undefined;
  }

  async upsertSeedData(seedData: DemoSeedData): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .insert(schema.workspaces)
        .values({
          ...seedData.workspace,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.workspaces.id,
          set: {
            slug: seedData.workspace.slug,
            name: seedData.workspace.name,
            userDisplayName: seedData.workspace.userDisplayName,
          },
        });
      await insertSeedRows(transaction, schema.connectorAccounts, seedData.connectors.map((connector) => ({ ...connector, workspaceId: seedData.workspace.id, createdAt: new Date() })));
      await insertSeedRows(transaction, schema.citations, seedData.citations.map((citation) => ({ ...citation, createdAt: new Date(citation.createdAt) })));
      await insertSeedRows(transaction, schema.memoryRecords, seedData.memoryRecords.map((memoryRecord) => ({ ...memoryRecord, createdAt: new Date(memoryRecord.createdAt) })));
      await insertSeedRows(transaction, schema.tasks, seedData.tasks.map((task) => ({ ...task, dueAt: task.dueAt ? new Date(task.dueAt) : null })));
      await insertSeedRows(transaction, schema.tickets, seedData.tickets);
      await insertSeedRows(transaction, schema.meetings, seedData.meetings.map((meeting) => ({ ...meeting, startsAt: new Date(meeting.startsAt), endsAt: new Date(meeting.endsAt) })));
      await insertSeedRows(transaction, schema.launches, seedData.launches.map((launch) => ({ ...launch, targetDate: new Date(launch.targetDate) })));
      await insertSeedRows(transaction, schema.launchChecks, seedData.launchChecks);
      await insertSeedRows(transaction, schema.workflowRuns, seedData.workflowRuns.map((workflowRun) => ({ ...workflowRun, createdAt: new Date(workflowRun.createdAt), updatedAt: new Date(workflowRun.updatedAt) })));
      await insertSeedRows(transaction, schema.approvals, seedData.approvals.map((approval) => ({ ...approval, createdAt: new Date(approval.createdAt), resolvedAt: approval.resolvedAt ? new Date(approval.resolvedAt) : null })));
      await insertSeedRows(transaction, schema.activityEvents, seedData.activityEvents.map((activityEvent) => ({ ...activityEvent, occurredAt: new Date(activityEvent.occurredAt) })));
      for (const thread of seedData.chatThreads) {
        await transaction
          .insert(schema.chatThreads)
          .values({
            id: thread.id,
            workspaceId: thread.workspaceId,
            title: thread.title,
            status: thread.status,
            createdAt: new Date(thread.createdAt),
            updatedAt: new Date(thread.updatedAt),
          })
          .onConflictDoNothing();
        await insertSeedRows(
          transaction,
          schema.chatMessages,
          thread.messages.map((message) => ({
            id: message.id,
            threadId: message.threadId,
            role: message.role,
            content: message.content,
            structuredContent: message.structuredContent,
            createdAt: new Date(message.createdAt),
          })),
        );
      }
    });
  }
}

export function createPostgresCueRepository(connectionString: string): PostgresCueRepository {
  const client = postgres(connectionString, { max: 5, prepare: false });
  return new PostgresCueRepository(drizzle(client, { schema }));
}

async function insertSeedRows(
  transaction: Parameters<Parameters<Database["transaction"]>[0]>[0],
  table: Parameters<typeof transaction.insert>[0],
  rows: object[],
) {
  if (rows.length === 0) {
    return;
  }
  await transaction.insert(table).values(rows as never[]).onConflictDoNothing();
}

function mapWorkspace(row: typeof schema.workspaces.$inferSelect): WorkspaceSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    userDisplayName: row.userDisplayName,
  };
}

function mapConnector(row: typeof schema.connectorAccounts.$inferSelect): ConnectorAccountSummary {
  return {
    id: row.id,
    source: row.source,
    label: row.label,
    status: row.status,
  };
}

function mapChatThread(row: typeof schema.chatThreads.$inferSelect): ChatThreadRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapChatMessage(row: typeof schema.chatMessages.$inferSelect): ChatMessageRecord {
  return {
    id: row.id,
    threadId: row.threadId,
    role: row.role,
    content: row.content,
    structuredContent: row.structuredContent ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapMemoryRecord(row: typeof schema.memoryRecords.$inferSelect): MemoryRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    body: row.body,
    source: row.source,
    citationIds: row.citationIds,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapCitation(row: typeof schema.citations.$inferSelect): SourceCitation {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    source: row.source,
    sourceId: row.sourceId,
    label: row.label,
    title: row.title,
    excerpt: row.excerpt,
    url: row.url ?? undefined,
    authorName: row.authorName ?? undefined,
    freshness: row.freshness,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapTask(row: typeof schema.tasks.$inferSelect): TaskRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueAt: row.dueAt?.toISOString(),
    ownerName: row.ownerName ?? undefined,
    citationIds: row.citationIds,
  };
}

function mapTicket(row: typeof schema.tickets.$inferSelect): TicketRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    source: row.source,
    externalId: row.externalId,
    title: row.title,
    status: row.status,
    priority: row.priority,
    ownerName: row.ownerName ?? undefined,
    url: row.url ?? undefined,
    citationIds: row.citationIds,
  };
}

function mapMeeting(row: typeof schema.meetings.$inferSelect): MeetingRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    location: row.location,
    attendees: row.attendees,
    joinUrl: row.joinUrl ?? undefined,
  };
}

function mapLaunch(row: typeof schema.launches.$inferSelect): LaunchRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    status: row.status,
    targetDate: row.targetDate.toISOString(),
    summary: row.summary,
  };
}

function mapLaunchCheck(row: typeof schema.launchChecks.$inferSelect): LaunchCheckRecord {
  return {
    id: row.id,
    launchId: row.launchId,
    title: row.title,
    status: row.status,
    summary: row.summary,
    ownerName: row.ownerName ?? undefined,
    citationIds: row.citationIds,
  };
}

function mapApproval(row: typeof schema.approvals.$inferSelect): ApprovalRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    workflowRunId: row.workflowRunId,
    title: row.title,
    description: row.description,
    actionType: row.actionType,
    status: row.status,
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
  };
}

function mapActivityEvent(row: typeof schema.activityEvents.$inferSelect): ActivityEvent {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    source: row.source,
    title: row.title,
    subtitle: row.subtitle,
    occurredAt: row.occurredAt.toISOString(),
    kind: row.kind,
    query: row.query,
    unread: row.unread,
  };
}

function collectCitationIds(citationIdGroups: string[][]): string[] {
  return [...new Set(citationIdGroups.flat())];
}

export function createWorkflowRunRecord(input: {
  workspaceId: string;
  workflowType: WorkflowRunRecord["workflowType"];
  status: WorkflowRunRecord["status"];
  state: Record<string, unknown>;
}): WorkflowRunRecord {
  const now = nowIsoString();
  return {
    id: createId("workflow"),
    workspaceId: input.workspaceId,
    workflowType: input.workflowType,
    status: input.status,
    state: input.state,
    createdAt: now,
    updatedAt: now,
  };
}
