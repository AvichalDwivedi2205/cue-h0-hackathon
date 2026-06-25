import type {
  ActivityEvent,
  ApprovalRecord,
  ChatThreadRecord,
  ChatThreadWithMessages,
  ConnectorAccountSummary,
  CueAssistantMessage,
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

export interface DemoSeedData {
  workspace: WorkspaceSummary;
  connectors: ConnectorAccountSummary[];
  citations: SourceCitation[];
  memoryRecords: MemoryRecord[];
  tasks: TaskRecord[];
  tickets: TicketRecord[];
  meetings: MeetingRecord[];
  launches: LaunchRecord[];
  launchChecks: LaunchCheckRecord[];
  approvals: ApprovalRecord[];
  workflowRuns: WorkflowRunRecord[];
  activityEvents: ActivityEvent[];
  chatThreads: ChatThreadWithMessages[];
}

export interface LaunchReadinessContext {
  workspace: WorkspaceSummary;
  launch?: LaunchRecord;
  launchChecks: LaunchCheckRecord[];
  tasks: TaskRecord[];
  tickets: TicketRecord[];
  memoryRecords: MemoryRecord[];
  pendingApprovals: ApprovalRecord[];
  citations: SourceCitation[];
}

export interface CreateChatThreadInput {
  workspaceId: string;
  title: string;
  status: ChatThreadRecord["status"];
  userMessage: string;
  assistantMessage: CueAssistantMessage;
}

export interface AppendChatExchangeInput {
  threadId: string;
  status: ChatThreadRecord["status"];
  userMessage: string;
  assistantMessage: CueAssistantMessage;
}

export interface CreateApprovalInput {
  workspaceId: string;
  workflowRunId: string;
  title: string;
  description: string;
  actionType: ApprovalRecord["actionType"];
  payload: Record<string, unknown>;
}

export interface CueRepository {
  getWorkspaceBySlug(workspaceSlug: string): Promise<WorkspaceSummary | undefined>;
  getHomeSnapshot(workspaceSlug: string): Promise<HomeSnapshot>;
  listChatThreads(workspaceId: string): Promise<ChatThreadRecord[]>;
  getChatThread(threadId: string): Promise<ChatThreadWithMessages | undefined>;
  createChatThreadWithMessages(input: CreateChatThreadInput): Promise<ChatThreadWithMessages>;
  appendChatExchange(input: AppendChatExchangeInput): Promise<ChatThreadWithMessages>;
  loadLaunchReadinessContext(workspaceId: string): Promise<LaunchReadinessContext>;
  createWorkflowRun(workflowRunRecord: WorkflowRunRecord): Promise<void>;
  createApproval(input: CreateApprovalInput): Promise<ApprovalRecord>;
  resolveApproval(approvalId: string, status: "approved" | "rejected"): Promise<ApprovalRecord | undefined>;
  upsertSeedData(seedData: DemoSeedData): Promise<void>;
}
