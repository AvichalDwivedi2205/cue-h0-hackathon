import type {
  ApprovalRecord,
  ChatMessageRecord,
  ChatThreadRecord,
  ChatThreadWithMessages,
  HomeSnapshot,
  WorkflowRunRecord,
} from "@cue-h0/types";
import { createDemoSeedData, demoWorkspaceSlug } from "./demoData.js";
import { mergeConnectorSummaries } from "./connectorCatalog.js";
import { createId, nowIsoString } from "./ids.js";
import type {
  AppendChatExchangeInput,
  CreateApprovalInput,
  CreateChatThreadInput,
  CueRepository,
  DemoSeedData,
  LaunchReadinessContext,
} from "./repository.js";

export class InMemoryCueRepository implements CueRepository {
  private seedData: DemoSeedData;

  constructor(seedData = createDemoSeedData()) {
    this.seedData = seedData;
  }

  async getWorkspaceBySlug(workspaceSlug: string) {
    return this.seedData.workspace.slug === workspaceSlug ? this.seedData.workspace : undefined;
  }

  async getHomeSnapshot(workspaceSlug: string): Promise<HomeSnapshot> {
    const workspace = await this.getWorkspaceBySlug(workspaceSlug);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceSlug}`);
    }

    return {
      workspace,
      connectors: mergeConnectorSummaries(this.seedData.connectors),
      meetings: [...this.seedData.meetings].sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
      dueTasks: this.seedData.tasks.filter((task) => task.status !== "done"),
      ticketsNeedingAttention: this.seedData.tickets.filter((ticket) => ticket.priority === "high" && ticket.status !== "done"),
      pendingApprovals: this.seedData.approvals.filter((approval) => approval.status === "pending"),
      forYou: this.seedData.activityEvents.filter((event) => event.kind !== "update").slice(0, 5),
      recentActivity: [...this.seedData.activityEvents]
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
        .slice(0, 6),
      rememberedDecisions: this.seedData.memoryRecords,
    };
  }

  async listChatThreads(workspaceId: string): Promise<ChatThreadRecord[]> {
    return this.seedData.chatThreads
      .filter((thread) => thread.workspaceId === workspaceId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map(({ messages: _messages, ...thread }) => thread);
  }

  async getChatThread(threadId: string): Promise<ChatThreadWithMessages | undefined> {
    return this.seedData.chatThreads.find((thread) => thread.id === threadId);
  }

  async createChatThreadWithMessages(input: CreateChatThreadInput): Promise<ChatThreadWithMessages> {
    const now = nowIsoString();
    const thread: ChatThreadWithMessages = {
      id: createId("thread"),
      workspaceId: input.workspaceId,
      title: input.title,
      status: input.status,
      createdAt: now,
      updatedAt: now,
      messages: [
        createUserMessage(createId("message"), "", input.userMessage, now),
        createAssistantMessage(createId("message"), "", input.assistantMessage, now),
      ],
    };
    thread.messages = thread.messages.map((message) => ({ ...message, threadId: thread.id }));
    this.seedData.chatThreads = [thread, ...this.seedData.chatThreads];
    return thread;
  }

  async appendChatExchange(input: AppendChatExchangeInput): Promise<ChatThreadWithMessages> {
    const thread = await this.getChatThread(input.threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${input.threadId}`);
    }

    const now = nowIsoString();
    const updatedThread: ChatThreadWithMessages = {
      ...thread,
      status: input.status,
      updatedAt: now,
      messages: [
        ...thread.messages,
        createUserMessage(createId("message"), thread.id, input.userMessage, now),
        createAssistantMessage(createId("message"), thread.id, input.assistantMessage, now),
      ],
    };
    this.seedData.chatThreads = this.seedData.chatThreads.map((candidateThread) =>
      candidateThread.id === updatedThread.id ? updatedThread : candidateThread,
    );
    return updatedThread;
  }

  async loadLaunchReadinessContext(workspaceId: string): Promise<LaunchReadinessContext> {
    const workspace = this.seedData.workspace;
    if (workspace.id !== workspaceId) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    const launch = this.seedData.launches.find((candidateLaunch) => candidateLaunch.workspaceId === workspaceId);
    const citationIds = new Set<string>();
    for (const launchCheck of this.seedData.launchChecks) {
      launchCheck.citationIds.forEach((citationId) => citationIds.add(citationId));
    }
    for (const task of this.seedData.tasks) {
      task.citationIds.forEach((citationId) => citationIds.add(citationId));
    }
    for (const ticket of this.seedData.tickets) {
      ticket.citationIds.forEach((citationId) => citationIds.add(citationId));
    }
    return {
      workspace,
      launch,
      launchChecks: launch ? this.seedData.launchChecks.filter((launchCheck) => launchCheck.launchId === launch.id) : [],
      tasks: this.seedData.tasks.filter((task) => task.workspaceId === workspaceId),
      tickets: this.seedData.tickets.filter((ticket) => ticket.workspaceId === workspaceId),
      memoryRecords: this.seedData.memoryRecords.filter((memoryRecord) => memoryRecord.workspaceId === workspaceId),
      pendingApprovals: this.seedData.approvals.filter((approval) => approval.workspaceId === workspaceId && approval.status === "pending"),
      citations: this.seedData.citations.filter((citation) => citationIds.has(citation.id)),
    };
  }

  async createWorkflowRun(workflowRunRecord: WorkflowRunRecord): Promise<void> {
    this.seedData.workflowRuns = [workflowRunRecord, ...this.seedData.workflowRuns.filter((run) => run.id !== workflowRunRecord.id)];
  }

  async createApproval(input: CreateApprovalInput): Promise<ApprovalRecord> {
    const now = nowIsoString();
    const approval: ApprovalRecord = {
      id: createId("approval"),
      workspaceId: input.workspaceId,
      workflowRunId: input.workflowRunId,
      title: input.title,
      description: input.description,
      actionType: input.actionType,
      status: "pending",
      payload: input.payload,
      createdAt: now,
    };
    this.seedData.approvals = [approval, ...this.seedData.approvals];
    return approval;
  }

  async resolveApproval(approvalId: string, status: "approved" | "rejected"): Promise<ApprovalRecord | undefined> {
    let resolvedApproval: ApprovalRecord | undefined;
    const resolvedAt = nowIsoString();
    this.seedData.approvals = this.seedData.approvals.map((approval) => {
      if (approval.id !== approvalId) {
        return approval;
      }
      resolvedApproval = { ...approval, status, resolvedAt };
      return resolvedApproval;
    });
    return resolvedApproval;
  }

  async upsertSeedData(seedData: DemoSeedData): Promise<void> {
    this.seedData = seedData;
  }
}

export function createInMemoryCueRepository(): InMemoryCueRepository {
  return new InMemoryCueRepository(createDemoSeedData());
}

export function getDefaultWorkspaceSlug(): string {
  return process.env.CUE_WORKSPACE_SLUG ?? demoWorkspaceSlug;
}

function createUserMessage(id: string, threadId: string, content: string, createdAt: string): ChatMessageRecord {
  return {
    id,
    threadId,
    role: "user",
    content,
    createdAt,
  };
}

function createAssistantMessage(
  id: string,
  threadId: string,
  structuredContent: NonNullable<ChatMessageRecord["structuredContent"]>,
  createdAt: string,
): ChatMessageRecord {
  return {
    id,
    threadId,
    role: "assistant",
    content: structuredContent.kind === "structured" ? structuredContent.summary : structuredContent.text,
    structuredContent,
    createdAt,
  };
}
