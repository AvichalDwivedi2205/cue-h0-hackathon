export type WorkspaceSource =
  | "cue"
  | "slack"
  | "github"
  | "linear"
  | "notion"
  | "vercel"
  | "exa"
  | "meet"
  | "posthog"
  | "sentry"
  | "atlassian"
  | "figma"
  | "miro"
  | "google-workspace"
  | "gitbook";

export type LaunchReadinessStatus = "ready" | "at_risk" | "blocked" | "insufficient_evidence";

export interface WorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  userDisplayName: string;
}

export interface ConnectorAccountSummary {
  id: string;
  source: WorkspaceSource;
  label: string;
  status: "connected" | "needs_attention" | "disabled";
  description?: string;
  integrationMode?: "hosted_mcp" | "cue_adapter";
  maturity?: "stable" | "beta" | "preview";
  statusDetail?: string;
}

export interface SourceCitation {
  id: string;
  workspaceId: string;
  source: WorkspaceSource;
  sourceId: string;
  label: string;
  title: string;
  excerpt: string;
  url?: string;
  authorName?: string;
  createdAt: string;
  freshness: "fresh" | "stale" | "unknown";
}

export interface MemoryRecord {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  source: WorkspaceSource;
  citationIds: string[];
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high";
  dueAt?: string;
  ownerName?: string;
  citationIds: string[];
}

export interface TicketRecord {
  id: string;
  workspaceId: string;
  source: "github" | "linear";
  externalId: string;
  title: string;
  status: string;
  priority: "low" | "medium" | "high";
  ownerName?: string;
  url?: string;
  citationIds: string[];
}

export interface MeetingRecord {
  id: string;
  workspaceId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  attendees: string[];
  joinUrl?: string;
}

export interface LaunchRecord {
  id: string;
  workspaceId: string;
  name: string;
  status: LaunchReadinessStatus;
  targetDate: string;
  summary: string;
}

export interface LaunchCheckRecord {
  id: string;
  launchId: string;
  title: string;
  status: "pass" | "risk" | "blocked" | "unknown";
  summary: string;
  ownerName?: string;
  citationIds: string[];
}

export interface ApprovalRecord {
  id: string;
  workspaceId: string;
  workflowRunId: string;
  title: string;
  description: string;
  actionType: "linear_ticket" | "slack_update" | "deployment_note" | "watch";
  status: "pending" | "approved" | "rejected";
  payload: Record<string, unknown>;
  createdAt: string;
  resolvedAt?: string;
}

export interface WorkflowRunRecord {
  id: string;
  workspaceId: string;
  workflowType: "launch_readiness" | "workspace_search" | "chat";
  status: "running" | "awaiting_approval" | "completed" | "failed";
  state: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  source: WorkspaceSource;
  title: string;
  subtitle: string;
  occurredAt: string;
  kind: "mention" | "blocker" | "approval" | "launch_risk" | "update" | "decision";
  query: string;
  unread: boolean;
}

export interface HomeSnapshot {
  workspace: WorkspaceSummary;
  connectors: ConnectorAccountSummary[];
  meetings: MeetingRecord[];
  dueTasks: TaskRecord[];
  ticketsNeedingAttention: TicketRecord[];
  pendingApprovals: ApprovalRecord[];
  forYou: ActivityEvent[];
  recentActivity: ActivityEvent[];
  rememberedDecisions: MemoryRecord[];
}

export interface EvidenceChip {
  source: WorkspaceSource;
  label: string;
  citationId?: string;
}

export interface AnswerBlock {
  title: string;
  description: string;
  reference: string;
  severity: "info" | "risk" | "blocker" | "gap";
}

export interface SuggestedAction {
  id: string;
  label: string;
  requiresApproval: boolean;
  approvalId?: string;
}

export interface PlanStep {
  id: string;
  title: string;
  status: "queued" | "running" | "done" | "blocked";
  source?: WorkspaceSource;
}

export interface RetrievalTraceStep {
  source: WorkspaceSource;
  section: "Workspace evidence" | "Release timeline" | "External signals" | "Synthesis";
  detail: string;
  status: "queued" | "running" | "done" | "blocked";
  resultCount: string;
  citationIds: string[];
}

export interface ExternalSignal {
  source: "exa";
  title: string;
  url: string;
  excerpt: string;
  publishedAt?: string;
  citationId: string;
}

export interface ModelSynthesisResult {
  mode: "openai" | "fallback";
  model: string;
  summary: string;
  draft?: string;
}

export interface CueStructuredAnswer {
  role: "assistant";
  kind: "structured";
  tone: "signal" | "green";
  verdict: string;
  statusPill?: {
    className: "warn" | "ok";
    text: string;
  };
  summary: string;
  blocks: AnswerBlock[];
  noBlock?: string;
  missingEvidence: string[];
  evidence: EvidenceChip[];
  citations: SourceCitation[];
  actions: SuggestedAction[];
  planSteps?: PlanStep[];
  retrievalTrace?: RetrievalTraceStep[];
  externalSignals?: ExternalSignal[];
  modelSynthesis?: ModelSynthesisResult;
}

export interface CueTextAnswer {
  role: "assistant";
  kind: "text";
  tone: "signal" | "green";
  text: string;
  evidence: EvidenceChip[];
  citations: SourceCitation[];
  actions: SuggestedAction[];
  planSteps?: PlanStep[];
  retrievalTrace?: RetrievalTraceStep[];
  externalSignals?: ExternalSignal[];
  modelSynthesis?: ModelSynthesisResult;
}

export type CueAssistantMessage = CueStructuredAnswer | CueTextAnswer;

export interface ChatMessageRecord {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  structuredContent?: CueAssistantMessage;
  createdAt: string;
}

export interface ChatThreadRecord {
  id: string;
  workspaceId: string;
  title: string;
  status: "ok" | "warn" | "muted";
  createdAt: string;
  updatedAt: string;
}

export interface ChatThreadWithMessages extends ChatThreadRecord {
  messages: ChatMessageRecord[];
}

export interface LaunchReadinessReport {
  runId: string;
  workspaceId: string;
  goal: string;
  status: LaunchReadinessStatus;
  confidence: number;
  findings: AnswerBlock[];
  evidenceGaps: string[];
  recommendedActions: SuggestedAction[];
  citations: SourceCitation[];
  formattedText: string;
}
