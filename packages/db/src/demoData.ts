import type {
  ApprovalRecord,
  ChatThreadWithMessages,
  CueStructuredAnswer,
  SourceCitation,
  SuggestedAction,
} from "@cue-h0/types";
import type { DemoSeedData } from "./repository.js";

function offsetDate(now: Date, minutes: number): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

export const demoWorkspaceId = "workspace_cue_h0";
export const demoWorkspaceSlug = "cue-h0";

export function createDemoSeedData(now = new Date()): DemoSeedData {
  const createdAt = offsetDate(now, -180);
  const citationSlackLaunch = createCitation({
    id: "citation_slack_launch",
    source: "slack",
    sourceId: "slack_launch_thread_143",
    label: "#launch · 14 msgs",
    title: "H0 launch thread",
    excerpt: "Sam flagged that Aurora verification has not completed. Dana asked Avi to confirm the production deploy owner.",
    createdAt: offsetDate(now, -18),
  });
  const citationGithubMigration = createCitation({
    id: "citation_github_482",
    source: "github",
    sourceId: "github_issue_482",
    label: "GitHub · #482",
    title: "Verify Aurora migration before production cutover",
    excerpt: "The staging migration ran, but the verification job did not complete. Production data safety is not yet confirmed.",
    url: "https://github.com/cue-h0/demo/issues/482",
    createdAt: offsetDate(now, -18),
  });
  const citationLinearH019 = createCitation({
    id: "citation_linear_h019",
    source: "linear",
    sourceId: "linear_h0_19",
    label: "Linear · H0-19",
    title: "H0-19 Aurora migration verification",
    excerpt: "In Review. Sam owns verification and needs one clean staging run before launch approval.",
    url: "https://linear.app/cue/issue/H0-19",
    createdAt: offsetDate(now, -40),
  });
  const citationVercelPreview = createCitation({
    id: "citation_vercel_preview",
    source: "vercel",
    sourceId: "vercel_cue_web_preview",
    label: "Vercel · preview",
    title: "cue-web preview deployment",
    excerpt: "Preview checks are green. Production has not been promoted from the last build.",
    createdAt: offsetDate(now, -25),
  });
  const citationNotionNotes = createCitation({
    id: "citation_notion_h0_notes",
    source: "notion",
    sourceId: "notion_h0_launch_notes",
    label: "Notion · H0 notes",
    title: "H0 launch notes",
    excerpt: "Launch notes list the target path: clear migration verification, promote Vercel production, post launch update.",
    createdAt: offsetDate(now, -60),
  });
  const citationPricingDecision = createCitation({
    id: "citation_slack_pricing",
    source: "slack",
    sourceId: "slack_leadership_pricing",
    label: "#leadership · pricing",
    title: "Pricing decision moved",
    excerpt: "Priya and Sam agreed pricing can move to Friday after the partner call and should not block H0.",
    createdAt: offsetDate(now, -120),
  });
  const citations = [
    citationSlackLaunch,
    citationGithubMigration,
    citationLinearH019,
    citationVercelPreview,
    citationNotionNotes,
    citationPricingDecision,
  ];

  const pendingLaunchApproval: ApprovalRecord = {
    id: "approval_h0_launch_update",
    workspaceId: demoWorkspaceId,
    workflowRunId: "workflow_h0_seed",
    title: "Approve H0 launch update",
    description:
      "Cue drafted this for #launch:\n\n\"Heads up - H0 is held on two blockers: Aurora verification and the prod deploy. Targeting clear by EOD.\"\n\nNothing posts until you approve.",
    actionType: "slack_update",
    status: "pending",
    payload: {
      channel: "#launch",
      draft:
        "Heads up - H0 is held on two blockers: Aurora verification and the prod deploy. Targeting clear by EOD.",
    },
    createdAt: offsetDate(now, -14),
  };

  const h0Answer = createSeedH0Answer(citations, pendingLaunchApproval);
  const betaAnswer: CueStructuredAnswer = {
    role: "assistant",
    kind: "structured",
    tone: "green",
    verdict: "On track - no blockers.",
    statusPill: { className: "ok", text: "On track" },
    summary:
      "Build 0.9.2 is signed and notarized, and the changelog is drafted. Nothing is waiting on you for the Mac beta.",
    blocks: [],
    noBlock: "All readiness checks pass. Safe to send beta invites.",
    missingEvidence: [],
    evidence: [
      { source: "notion", label: "Mac Beta spec" },
      { source: "github", label: "release v0.9.2" },
      { source: "slack", label: "#mac-beta" },
    ],
    citations: [citationNotionNotes],
    actions: [
      { id: "action_send_beta_invites", label: "Send beta invites", requiresApproval: true },
      { id: "action_draft_changelog", label: "Draft changelog post", requiresApproval: false },
    ],
  };

  const chatThreads: ChatThreadWithMessages[] = [
    createSeedThread({
      id: "thread_h0_launch",
      title: "Are we ready to submit H0?",
      status: "warn",
      userMessage: "Are we ready to submit H0?",
      assistantMessage: h0Answer,
      createdAt: offsetDate(now, -17),
    }),
    createSeedThread({
      id: "thread_mac_beta",
      title: "What's the status of the Mac beta?",
      status: "ok",
      userMessage: "What's the status of the Mac beta?",
      assistantMessage: betaAnswer,
      createdAt: offsetDate(now, -95),
    }),
  ];

  return {
    workspace: {
      id: demoWorkspaceId,
      slug: demoWorkspaceSlug,
      name: "Cue workspace",
      userDisplayName: "Avi",
    },
    connectors: [
      { id: "connector_slack", source: "slack", label: "Slack", status: "connected" },
      { id: "connector_github", source: "github", label: "GitHub", status: "connected" },
      { id: "connector_linear", source: "linear", label: "Linear", status: "connected" },
      { id: "connector_notion", source: "notion", label: "Notion", status: "connected" },
      { id: "connector_vercel", source: "vercel", label: "Vercel", status: "connected" },
      { id: "connector_meet", source: "meet", label: "Meet", status: "connected" },
    ],
    citations,
    memoryRecords: [
      {
        id: "memory_pricing_friday",
        workspaceId: demoWorkspaceId,
        title: "Pricing moved to Friday",
        body: "Leadership agreed pricing can move to Friday after the partner call and should not block H0.",
        source: "slack",
        citationIds: [citationPricingDecision.id],
        createdAt: offsetDate(now, -120),
      },
    ],
    tasks: [
      {
        id: "task_verify_aurora",
        workspaceId: demoWorkspaceId,
        title: "Verify Aurora migration",
        description: "Run one clean staging verification job before approving production data cutover.",
        status: "blocked",
        priority: "high",
        dueAt: offsetDate(now, 240),
        ownerName: "Sam",
        citationIds: [citationGithubMigration.id, citationLinearH019.id],
      },
      {
        id: "task_review_h019",
        workspaceId: demoWorkspaceId,
        title: "Review Linear H0-19",
        description: "Confirm migration verification result and close the launch checklist item.",
        status: "in_progress",
        priority: "high",
        dueAt: offsetDate(now, 300),
        ownerName: "Avi",
        citationIds: [citationLinearH019.id],
      },
    ],
    tickets: [
      {
        id: "ticket_github_482",
        workspaceId: demoWorkspaceId,
        source: "github",
        externalId: "#482",
        title: "Verify Aurora migration before production cutover",
        status: "open",
        priority: "high",
        ownerName: "Sam",
        url: "https://github.com/cue-h0/demo/issues/482",
        citationIds: [citationGithubMigration.id],
      },
      {
        id: "ticket_linear_h019",
        workspaceId: demoWorkspaceId,
        source: "linear",
        externalId: "H0-19",
        title: "Aurora migration verification",
        status: "In Review",
        priority: "high",
        ownerName: "Sam",
        url: "https://linear.app/cue/issue/H0-19",
        citationIds: [citationLinearH019.id],
      },
    ],
    meetings: [
      {
        id: "meeting_standup",
        workspaceId: demoWorkspaceId,
        title: "Engineering standup",
        startsAt: offsetDate(now, 30),
        endsAt: offsetDate(now, 60),
        location: "Zoom",
        attendees: ["Avi", "Sam", "Dana", "Priya", "Kai", "Mina"],
        joinUrl: "https://zoom.us/j/demo-standup",
      },
      {
        id: "meeting_h0_launch_sync",
        workspaceId: demoWorkspaceId,
        title: "H0 launch sync",
        startsAt: offsetDate(now, 240),
        endsAt: offsetDate(now, 270),
        location: "Zoom",
        attendees: ["Avi", "Sam", "Priya"],
        joinUrl: "https://zoom.us/j/demo-h0",
      },
      {
        id: "meeting_design_review",
        workspaceId: demoWorkspaceId,
        title: "Design review",
        startsAt: offsetDate(now, 390),
        endsAt: offsetDate(now, 420),
        location: "HQ Room 2",
        attendees: ["Avi", "Mina"],
      },
    ],
    launches: [
      {
        id: "launch_h0",
        workspaceId: demoWorkspaceId,
        name: "H0 / AWS + Vercel submission",
        status: "at_risk",
        targetDate: offsetDate(now, 540),
        summary: "H0 can still ship today if Aurora verification and production promotion clear.",
      },
    ],
    launchChecks: [
      {
        id: "launch_check_aurora",
        launchId: "launch_h0",
        title: "Aurora migration verified",
        status: "blocked",
        summary: "Staging migration ran, but verification never completed.",
        ownerName: "Sam",
        citationIds: [citationGithubMigration.id, citationLinearH019.id],
      },
      {
        id: "launch_check_vercel",
        launchId: "launch_h0",
        title: "Vercel production promoted",
        status: "risk",
        summary: "Preview is green. Production promotion is still pending.",
        ownerName: "Dana",
        citationIds: [citationVercelPreview.id, citationSlackLaunch.id],
      },
      {
        id: "launch_check_notes",
        launchId: "launch_h0",
        title: "Launch notes ready",
        status: "pass",
        summary: "Notion notes are current and list the remaining blockers.",
        ownerName: "Avi",
        citationIds: [citationNotionNotes.id],
      },
    ],
    approvals: [pendingLaunchApproval],
    workflowRuns: [
      {
        id: "workflow_h0_seed",
        workspaceId: demoWorkspaceId,
        workflowType: "launch_readiness",
        status: "awaiting_approval",
        state: { goal: "Are we ready to submit H0?", status: "at_risk" },
        createdAt: offsetDate(now, -18),
        updatedAt: offsetDate(now, -14),
      },
    ],
    activityEvents: [
      {
        id: "activity_h0_risk",
        workspaceId: demoWorkspaceId,
        source: "cue",
        title: "H0 launch is at risk",
        subtitle: "Cue · from #launch",
        occurredAt: offsetDate(now, -18),
        kind: "launch_risk",
        query: "Are we ready to submit H0?",
        unread: true,
      },
      {
        id: "activity_aurora",
        workspaceId: demoWorkspaceId,
        source: "github",
        title: "Aurora migration needs verification",
        subtitle: "Sam · GitHub #482",
        occurredAt: offsetDate(now, -18),
        kind: "blocker",
        query: "What's blocking the Aurora migration?",
        unread: false,
      },
      {
        id: "activity_pricing",
        workspaceId: demoWorkspaceId,
        source: "slack",
        title: "Priya asked for pricing confirmation",
        subtitle: "Priya · #leadership",
        occurredAt: offsetDate(now, -60),
        kind: "mention",
        query: "Summarize Priya's ask in #leadership",
        unread: true,
      },
      {
        id: "activity_vercel",
        workspaceId: demoWorkspaceId,
        source: "vercel",
        title: "Production deploy has not been promoted",
        subtitle: "Vercel · cue-web",
        occurredAt: offsetDate(now, -25),
        kind: "blocker",
        query: "Are we ready to submit H0?",
        unread: false,
      },
      {
        id: "activity_memory_pricing",
        workspaceId: demoWorkspaceId,
        source: "cue",
        title: "Cue saved: pricing moved to Friday",
        subtitle: "Remembered decision",
        occurredAt: offsetDate(now, -120),
        kind: "decision",
        query: "Why was pricing moved to Friday?",
        unread: false,
      },
    ],
    chatThreads,
  };
}

function createCitation(input: Omit<SourceCitation, "workspaceId" | "freshness"> & { freshness?: SourceCitation["freshness"] }): SourceCitation {
  return {
    workspaceId: demoWorkspaceId,
    freshness: "fresh",
    ...input,
  };
}

function createSeedThread(input: {
  id: string;
  title: string;
  status: "ok" | "warn" | "muted";
  userMessage: string;
  assistantMessage: CueStructuredAnswer;
  createdAt: string;
}): ChatThreadWithMessages {
  return {
    id: input.id,
    workspaceId: demoWorkspaceId,
    title: input.title,
    status: input.status,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    messages: [
      {
        id: `${input.id}_message_user`,
        threadId: input.id,
        role: "user",
        content: input.userMessage,
        createdAt: input.createdAt,
      },
      {
        id: `${input.id}_message_assistant`,
        threadId: input.id,
        role: "assistant",
        content: input.assistantMessage.summary,
        structuredContent: input.assistantMessage,
        createdAt: input.createdAt,
      },
    ],
  };
}

function createSeedH0Answer(citations: SourceCitation[], pendingLaunchApproval: ApprovalRecord): CueStructuredAnswer {
  const findCitation = (citationId: string) => citations.find((citation) => citation.id === citationId);
  const evidenceCitations = [
    findCitation("citation_slack_launch"),
    findCitation("citation_github_482"),
    findCitation("citation_linear_h019"),
    findCitation("citation_vercel_preview"),
  ].filter((citation): citation is SourceCitation => Boolean(citation));
  const approvalAction: SuggestedAction = {
    id: "action_approve_h0_launch_update",
    label: "Approve launch update",
    requiresApproval: true,
    approvalId: pendingLaunchApproval.id,
  };

  return {
    role: "assistant",
    kind: "structured",
    tone: "signal",
    verdict: "Not yet - H0 is at risk.",
    statusPill: { className: "warn", text: "At risk" },
    summary:
      "You're close. Two blockers are still open, and the last activity was 18 minutes ago, so this can still ship today if both clear.",
    blocks: [
      {
        title: "Aurora migration not verified",
        description:
          "The schema migration ran on staging, but the verification job never completed - we cannot confirm production data is safe.",
        reference: "GitHub · #482 · open",
        severity: "blocker",
      },
      {
        title: "Vercel production deploy missing",
        description: "Preview is green and passing checks. Production has not been promoted from the last build.",
        reference: "Vercel · cue-web · preview only",
        severity: "risk",
      },
    ],
    missingEvidence: ["PostHog launch analytics are not connected in this demo workspace."],
    evidence: [
      { source: "slack", label: "#launch · 14 msgs", citationId: "citation_slack_launch" },
      { source: "github", label: "issue #482", citationId: "citation_github_482" },
      { source: "linear", label: "H0-19", citationId: "citation_linear_h019" },
      { source: "vercel", label: "preview only", citationId: "citation_vercel_preview" },
    ],
    citations: evidenceCitations,
    actions: [
      { id: "action_create_migration_ticket", label: "Create ticket for migration", requiresApproval: true },
      approvalAction,
      { id: "action_assign_deploy", label: "Assign deploy to Dana", requiresApproval: true },
    ],
  };
}
