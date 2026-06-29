import type {
  ApprovalRecord,
  ChatThreadWithMessages,
  CueStructuredAnswer,
  ExternalSignal,
  PlanStep,
  RetrievalTraceStep,
  SourceCitation,
  SuggestedAction,
} from "@cue-h0/types";
import { buildConnectorSummaries } from "./connectorCatalog.js";
import type { DemoSeedData } from "./repository.js";

function offsetDate(now: Date, minutes: number): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

export const demoWorkspaceId = "workspace_cue_h0";
export const demoWorkspaceSlug = "cue-h0";

export function createDemoSeedData(now = new Date()): DemoSeedData {
  const citationSlackLaunch = createCitation({
    id: "citation_slack_launch_invites",
    source: "slack",
    sourceId: "slack_launch_invite_thread",
    label: "Slack · #launch",
    title: "#launch invite acceptance thread",
    excerpt:
      "Sam: Seeing beta users accept invites but land in an empty workspace. Dana: This started after the Aurora workspace migration. Avi: Can Cue tell us whether this blocks H0? Priya: If invites are broken we need to adjust launch copy.",
    authorName: "Sam, Dana, Avi, Priya",
    createdAt: offsetDate(now, -58),
  });
  const citationGithub482 = createCitation({
    id: "citation_github_pr_482",
    source: "github",
    sourceId: "github_pr_482",
    label: "GitHub · PR #482",
    title: "Migrate invite acceptance to Aurora workspaces",
    excerpt:
      "Commit replace workspace lookup during invite acceptance changes apps/web/src/invites/acceptInvite.ts from getWorkspaceBySlug(invite.workspaceSlug) to getWorkspaceById(invite.workspaceId). Test covers stale workspaceSlug with valid workspaceId.",
    url: "https://github.com/AvichalDwivedi2205/cue-h0-hackathon/pull/1",
    authorName: "Sam",
    createdAt: offsetDate(now, -182),
  });
  const citationLinearH019 = createCitation({
    id: "citation_linear_h0_19",
    source: "linear",
    sourceId: "linear_h0_19",
    label: "Linear · H0-19",
    title: "Beta invites land users in empty workspace after acceptance",
    excerpt:
      "In Review, owner Sam. Users report accepting invite but seeing empty workspace. Started after Aurora workspace migration. Suspected stale workspaceSlug lookup. Blocks H0 if not fixed.",
    url: "https://linear.app/cue-h0/issue/H0-19/beta-invites-land-users-in-empty-workspace-after-acceptance",
    authorName: "Sam",
    createdAt: offsetDate(now, -52),
  });
  const citationLinearH022 = createCitation({
    id: "citation_linear_h0_22",
    source: "linear",
    sourceId: "linear_h0_22",
    label: "Linear · H0-22",
    title: "Verify Aurora invite acceptance migration path",
    excerpt:
      "Todo, owner Dana. Run staging verification for invite acceptance and confirm old workspace lookup is removed.",
    url: "https://linear.app/cue-h0/issue/H0-22/verify-aurora-invite-acceptance-migration-path",
    authorName: "Dana",
    createdAt: offsetDate(now, -47),
  });
  const citationLinearMkt7 = createCitation({
    id: "citation_linear_mkt_7",
    source: "linear",
    sourceId: "linear_mkt_7",
    label: "Linear · MKT-7",
    title: "Clarify team invite setup in launch messaging",
    excerpt:
      "Backlog, owner Priya. Social and customer confusion around invites. Prepare copy for launch post.",
    url: "https://linear.app/cue-h0/issue/MKT-7/clarify-team-invite-setup-in-launch-messaging",
    authorName: "Priya",
    createdAt: offsetDate(now, -39),
  });
  const citationNotionChecklist = createCitation({
    id: "citation_notion_h0_launch_checklist",
    source: "notion",
    sourceId: "notion_h0_launch_checklist",
    label: "Notion · H0 Launch Checklist",
    title: "H0 Launch Checklist",
    excerpt:
      "Invite acceptance verified is marked done, Aurora migration verified is pending, and H0 cannot ship if beta invite activation drops.",
    url: "https://app.notion.com/p/H0-Launch-Checklist-38d7b2cf717481d4b324eb45fe699b83",
    authorName: "Avi",
    createdAt: offsetDate(now, -74),
  });
  const citationNotionSpec = createCitation({
    id: "citation_notion_beta_onboarding_spec",
    source: "notion",
    sourceId: "notion_beta_onboarding_spec",
    label: "Notion · Beta Onboarding Spec",
    title: "Beta Onboarding Spec",
    excerpt:
      "Accepting invite should join user directly to invited workspace. Workspace slug is display-only after Aurora migration. Source of truth is workspaceId.",
    url: "https://app.notion.com/p/Beta-Onboarding-Spec-38d7b2cf71748134834aed22c32a404c",
    authorName: "Dana",
    createdAt: offsetDate(now, -95),
  });
  const citationPostHogInviteFunnel = createCitation({
    id: "citation_posthog_invite_funnel",
    source: "posthog",
    sourceId: "posthog_invite_funnel_beta_aurora",
    label: "PostHog · beta invite funnel",
    title: "Beta invite activation dropped after Aurora migration",
    excerpt:
      "Events invite_accepted, workspace_joined, activation_completed show beta invite-to-workspace conversion fell from 82% before migration to 41% after migration. Affected segment is beta invites only.",
    url: "https://app.posthog.com/project/cue/insights/invite-funnel",
    authorName: "PostHog",
    createdAt: offsetDate(now, -34),
  });
  const citationVercelDeploy = createCitation({
    id: "citation_vercel_cue_web_prod_9f31",
    source: "vercel",
    sourceId: "vercel_cue_web_prod_9f31",
    label: "Vercel · cue-web-prod-9f31",
    title: "Production deploy cue-web-prod-9f31",
    excerpt:
      "Deployment cue-web-prod-9f31 promoted PR #482 to production two hours before invite conversion dropped.",
    url: "https://vercel.com/cue/cue-web/deployments/cue-web-prod-9f31",
    authorName: "Vercel",
    createdAt: offsetDate(now, -154),
  });
  const citationExaInviteFriction = createCitation({
    id: "citation_exa_production_invite_friction",
    source: "exa",
    sourceId: "exa_production_invite_friction",
    label: "Exa · external invite friction",
    title: "External beta invite setup signal",
    excerpt:
      "Public-web context on beta invite setup confusion, empty-workspace reports, and onboarding friction around team invitations.",
    url: "https://exa.ai/search",
    authorName: "Exa",
    freshness: "unknown",
    createdAt: offsetDate(now, -17),
  });
  const citationExaLaunchCopy = createCitation({
    id: "citation_exa_launch_copy_signal",
    source: "exa",
    sourceId: "exa_launch_copy_signal",
    label: "Exa · onboarding copy signal",
    title: "External onboarding clarity signal",
    excerpt:
      "Public-web context on how teams explain invite acceptance, workspace setup, and onboarding clarity before product launches.",
    url: "https://exa.ai/search",
    authorName: "Exa",
    freshness: "unknown",
    createdAt: offsetDate(now, -16),
  });

  const citations = [
    citationSlackLaunch,
    citationGithub482,
    citationLinearH019,
    citationLinearH022,
    citationLinearMkt7,
    citationNotionChecklist,
    citationNotionSpec,
    citationPostHogInviteFunnel,
    citationVercelDeploy,
    citationExaInviteFriction,
    citationExaLaunchCopy,
  ];

  const pendingLaunchApproval: ApprovalRecord = {
    id: "approval_h0_invite_blocker_update",
    workspaceId: demoWorkspaceId,
    workflowRunId: "workflow_h0_seed",
    title: "Approve H0 invite blocker update",
    description:
      "Cue drafted this for #launch:\n\n\"H0 is blocked until beta invite acceptance is verified. Evidence points to stale workspaceSlug lookup after Aurora migration; PR #482 switches acceptance to workspaceId and PostHog shows beta conversion dropped from 82% to 41%.\"\n\nNothing posts until you approve.",
    actionType: "slack_update",
    status: "pending",
    payload: {
      channel: "#launch",
      draft:
        "H0 is blocked until beta invite acceptance is verified. Evidence points to stale workspaceSlug lookup after Aurora migration; PR #482 switches acceptance to workspaceId and PostHog shows beta conversion dropped from 82% to 41%.",
    },
    createdAt: offsetDate(now, -14),
  };

  const marketingApproval: ApprovalRecord = {
    id: "approval_launch_invite_copy",
    workspaceId: demoWorkspaceId,
    workflowRunId: "workflow_marketing_seed",
    title: "Approve launch invite copy",
    description:
      "Cue drafted public copy: \"Team invites now take you straight into the workspace you were invited to. If setup looks empty, ping us and we will fix your beta workspace before launch.\"",
    actionType: "slack_update",
    status: "pending",
    payload: {
      channel: "#launch",
      draft:
        "Launch copy update: Team invites take users straight into the invited workspace. If setup looks empty, we will fix the beta workspace before launch.",
    },
    createdAt: offsetDate(now, -12),
  };

  const h0Answer = createSeedH0Answer(citations, pendingLaunchApproval);
  const marketingAnswer = createSeedMarketingAnswer(citations, marketingApproval);

  const chatThreads: ChatThreadWithMessages[] = [
    createSeedThread({
      id: "thread_demo_h0_invite_blocker",
      title: "Production invite breakage investigation",
      status: "warn",
      userMessage: "Production code is breaking. Find the issue, who owns it, impact, and draft a Slack ping.",
      assistantMessage: h0Answer,
      createdAt: offsetDate(now, -16),
    }),
    createSeedThread({
      id: "thread_demo_launch_confusion",
      title: "What are people confused about before launch?",
      status: "warn",
      userMessage: "What are people confused about before we launch, and what should we say publicly?",
      assistantMessage: marketingAnswer,
      createdAt: offsetDate(now, -11),
    }),
  ];

  return {
    workspace: {
      id: demoWorkspaceId,
      slug: demoWorkspaceSlug,
      name: "Cue H0 launch room",
      userDisplayName: "Avi",
    },
    connectors: buildConnectorSummaries(),
    citations,
    memoryRecords: [
      {
        id: "memory_invite_root_cause",
        workspaceId: demoWorkspaceId,
        title: "Invite acceptance source of truth",
        body:
          "After Aurora workspace migration, invite acceptance must resolve workspace by workspaceId. workspaceSlug is display-only and can be stale.",
        source: "notion",
        citationIds: [citationNotionSpec.id, citationGithub482.id],
        createdAt: offsetDate(now, -92),
      },
      {
        id: "memory_h0_ship_rule",
        workspaceId: demoWorkspaceId,
        title: "H0 ship rule for beta activation",
        body: "H0 cannot ship if beta invite activation drops or users land in an empty workspace after invite acceptance.",
        source: "notion",
        citationIds: [citationNotionChecklist.id, citationPostHogInviteFunnel.id],
        createdAt: offsetDate(now, -70),
      },
      {
        id: "memory_launch_copy_gap",
        workspaceId: demoWorkspaceId,
        title: "Launch messaging must explain team invites",
        body: "Priya owns launch copy for invite/setup confusion before Cue H0 launch.",
        source: "linear",
        citationIds: [citationLinearMkt7.id, citationExaLaunchCopy.id],
        createdAt: offsetDate(now, -35),
      },
    ],
    tasks: [
      {
        id: "task_h0_19_fix_invite_acceptance",
        workspaceId: demoWorkspaceId,
        title: "Fix beta invite empty workspace regression",
        description:
          "H0-19: replace stale workspaceSlug lookup with workspaceId during invite acceptance and prove beta users join correct workspace.",
        status: "in_progress",
        priority: "high",
        dueAt: offsetDate(now, 120),
        ownerName: "Sam",
        citationIds: [citationLinearH019.id, citationGithub482.id, citationPostHogInviteFunnel.id],
      },
      {
        id: "task_h0_22_verify_aurora_invites",
        workspaceId: demoWorkspaceId,
        title: "Verify Aurora invite acceptance migration path",
        description: "H0-22: run staging verification for invite acceptance and confirm old workspace lookup is removed.",
        status: "todo",
        priority: "high",
        dueAt: offsetDate(now, 180),
        ownerName: "Dana",
        citationIds: [citationLinearH022.id, citationNotionSpec.id],
      },
      {
        id: "task_mkt_7_invite_copy",
        workspaceId: demoWorkspaceId,
        title: "Clarify team invite setup in launch messaging",
        description: "MKT-7: prepare launch copy for social/customer confusion around team invites.",
        status: "todo",
        priority: "medium",
        dueAt: offsetDate(now, 240),
        ownerName: "Priya",
        citationIds: [citationLinearMkt7.id, citationExaLaunchCopy.id, citationSlackLaunch.id],
      },
    ],
    tickets: [
      {
        id: "ticket_linear_h0_19",
        workspaceId: demoWorkspaceId,
        source: "linear",
        externalId: "H0-19",
        title: "Beta invites land users in empty workspace after acceptance",
        status: "In Review",
        priority: "high",
        ownerName: "Sam",
        url: "https://linear.app/cue-h0/issue/H0-19/beta-invites-land-users-in-empty-workspace-after-acceptance",
        citationIds: [citationLinearH019.id, citationSlackLaunch.id, citationPostHogInviteFunnel.id],
      },
      {
        id: "ticket_linear_h0_22",
        workspaceId: demoWorkspaceId,
        source: "linear",
        externalId: "H0-22",
        title: "Verify Aurora invite acceptance migration path",
        status: "Todo",
        priority: "high",
        ownerName: "Dana",
        url: "https://linear.app/cue-h0/issue/H0-22/verify-aurora-invite-acceptance-migration-path",
        citationIds: [citationLinearH022.id, citationGithub482.id, citationNotionSpec.id],
      },
      {
        id: "ticket_linear_mkt_7",
        workspaceId: demoWorkspaceId,
        source: "linear",
        externalId: "MKT-7",
        title: "Clarify team invite setup in launch messaging",
        status: "Backlog",
        priority: "medium",
        ownerName: "Priya",
        url: "https://linear.app/cue-h0/issue/MKT-7/clarify-team-invite-setup-in-launch-messaging",
        citationIds: [citationLinearMkt7.id, citationExaLaunchCopy.id, citationSlackLaunch.id],
      },
      {
        id: "ticket_github_pr_482",
        workspaceId: demoWorkspaceId,
        source: "github",
        externalId: "#482",
        title: "Migrate invite acceptance to Aurora workspaces",
        status: "open",
        priority: "high",
        ownerName: "Sam",
        url: "https://github.com/AvichalDwivedi2205/cue-h0-hackathon/pull/1",
        citationIds: [citationGithub482.id, citationVercelDeploy.id],
      },
    ],
    meetings: [
      {
        id: "meeting_h0_launch_sync",
        workspaceId: demoWorkspaceId,
        title: "H0 launch sync",
        startsAt: offsetDate(now, 90),
        endsAt: offsetDate(now, 120),
        location: "Zoom",
        attendees: ["Avi", "Sam", "Dana", "Priya"],
        joinUrl: "https://zoom.us/j/demo-h0",
      },
      {
        id: "meeting_beta_onboarding_war_room",
        workspaceId: demoWorkspaceId,
        title: "Beta invite activation war room",
        startsAt: offsetDate(now, 180),
        endsAt: offsetDate(now, 210),
        location: "Zoom",
        attendees: ["Avi", "Sam", "Dana"],
        joinUrl: "https://zoom.us/j/demo-beta-invites",
      },
    ],
    launches: [
      {
        id: "launch_h0",
        workspaceId: demoWorkspaceId,
        name: "Cue H0 launch",
        status: "blocked",
        targetDate: offsetDate(now, 480),
        summary:
          "Cue H0 launch is blocked until beta invite acceptance joins users to the correct Aurora workspace and marketing clarifies team setup.",
      },
    ],
    launchChecks: [
      {
        id: "launch_check_beta_invite_activation",
        launchId: "launch_h0",
        title: "Beta invite activation",
        status: "blocked",
        summary:
          "Beta users accept invites but land in an empty workspace. PostHog shows invite-to-workspace conversion dropped from 82% to 41% after the Aurora migration.",
        ownerName: "Sam",
        citationIds: [citationLinearH019.id, citationSlackLaunch.id, citationPostHogInviteFunnel.id],
      },
      {
        id: "launch_check_aurora_invite_path",
        launchId: "launch_h0",
        title: "Aurora invite acceptance migration path",
        status: "blocked",
        summary:
          "PR #482 changes invite acceptance from workspaceSlug to workspaceId, but H0-22 still needs staging verification that old lookup is removed.",
        ownerName: "Dana",
        citationIds: [citationGithub482.id, citationLinearH022.id, citationNotionSpec.id, citationVercelDeploy.id],
      },
      {
        id: "launch_check_invite_messaging",
        launchId: "launch_h0",
        title: "Team invite launch messaging",
        status: "risk",
        summary:
          "Priya needs launch copy because team invite setup and onboarding language need to be clearer before H0.",
        ownerName: "Priya",
        citationIds: [citationLinearMkt7.id, citationExaLaunchCopy.id, citationSlackLaunch.id],
      },
    ],
    approvals: [pendingLaunchApproval, marketingApproval],
    workflowRuns: [
      {
        id: "workflow_h0_seed",
        workspaceId: demoWorkspaceId,
        workflowType: "launch_readiness",
        status: "awaiting_approval",
        state: {
          goal: "Why are beta users getting stuck after accepting an invite, and is this blocking H0?",
          demoAct: "Production code is breaking. Find the issue, who owns it, impact, and draft a Slack ping.",
          status: "blocked",
          commonPhrases: ["H0-19", "PR #482", "Aurora workspace migration", "workspaceId vs workspaceSlug"],
        },
        createdAt: offsetDate(now, -18),
        updatedAt: offsetDate(now, -14),
      },
      {
        id: "workflow_marketing_seed",
        workspaceId: demoWorkspaceId,
        workflowType: "chat",
        status: "awaiting_approval",
        state: {
          goal: "What are people confused about before we launch, and what should we say publicly?",
          status: "needs_copy",
        },
        createdAt: offsetDate(now, -13),
        updatedAt: offsetDate(now, -12),
      },
    ],
    activityEvents: [
      {
        id: "activity_h0_blocked",
        workspaceId: demoWorkspaceId,
        source: "cue",
        title: "Cue H0 launch is blocked",
        subtitle: "Cue · H0-19 + PostHog invite funnel",
        occurredAt: offsetDate(now, -16),
        kind: "launch_risk",
        query: "Why are beta users getting stuck after accepting an invite, and is this blocking H0?",
        unread: true,
      },
      {
        id: "activity_slack_empty_workspace",
        workspaceId: demoWorkspaceId,
        source: "slack",
        title: "Sam reported beta users landing in empty workspace",
        subtitle: "Sam · #launch",
        occurredAt: offsetDate(now, -58),
        kind: "blocker",
        query: "Show invite acceptance reports from #launch",
        unread: true,
      },
      {
        id: "activity_github_pr_482",
        workspaceId: demoWorkspaceId,
        source: "github",
        title: "PR #482 replaces invite workspace lookup",
        subtitle: "GitHub · apps/web/src/invites/acceptInvite.ts",
        occurredAt: offsetDate(now, -45),
        kind: "update",
        query: "What changed in PR #482?",
        unread: false,
      },
      {
        id: "activity_posthog_conversion_drop",
        workspaceId: demoWorkspaceId,
        source: "posthog",
        title: "Beta invite conversion dropped to 41%",
        subtitle: "PostHog · invite_accepted to workspace_joined",
        occurredAt: offsetDate(now, -34),
        kind: "launch_risk",
        query: "Show beta invite activation after Aurora migration",
        unread: true,
      },
      {
        id: "activity_vercel_deploy_drop",
        workspaceId: demoWorkspaceId,
        source: "vercel",
        title: "Production deploy preceded invite conversion drop",
        subtitle: "Vercel · cue-web-prod-9f31 · PR #482",
        occurredAt: offsetDate(now, -30),
        kind: "blocker",
        query: "Did a deploy line up with the activation drop?",
        unread: false,
      },
      {
        id: "activity_exa_invite_confusion",
        workspaceId: demoWorkspaceId,
        source: "exa",
        title: "External context mentions invite setup confusion",
        subtitle: "Exa · onboarding and launch-copy context",
        occurredAt: offsetDate(now, -19),
        kind: "mention",
        query: "What are people confused about before we launch?",
        unread: true,
      },
      {
        id: "activity_mkt_7_copy",
        workspaceId: demoWorkspaceId,
        source: "linear",
        title: "Priya owns invite setup launch copy",
        subtitle: "Linear · MKT-7",
        occurredAt: offsetDate(now, -12),
        kind: "approval",
        query: "What should we say publicly?",
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
  const evidenceCitations = pickCitations(citations, [
    "citation_slack_launch_invites",
    "citation_linear_h0_19",
    "citation_linear_h0_22",
    "citation_github_pr_482",
    "citation_posthog_invite_funnel",
    "citation_vercel_cue_web_prod_9f31",
    "citation_notion_beta_onboarding_spec",
    "citation_exa_production_invite_friction",
  ]);
  const approvalAction: SuggestedAction = {
    id: "action_approve_h0_invite_update",
    label: "Approve H0 blocker update",
    requiresApproval: true,
    approvalId: pendingLaunchApproval.id,
  };

  return {
    role: "assistant",
    kind: "structured",
    tone: "signal",
    verdict: "Yes - production invite acceptance is blocking H0.",
    statusPill: { className: "warn", text: "Blocked" },
    summary:
      "Cue traced the production breakage across the sources that matter for an H0 launch decision. Slack gives the symptom: beta users accept invites and land in an empty workspace. Linear gives the ownership map: H0-19 is assigned to Sam for the invite bug, H0-22 is assigned to Dana for Aurora migration verification, and MKT-7 is assigned to Priya for launch messaging. GitHub gives the likely technical cause in PR #482, where invite acceptance moved through the Aurora workspace migration path. Notion gives the source-of-truth rule: after Aurora, workspaceId is canonical and workspaceSlug is display-only. PostHog gives the impact: beta invite-to-workspace conversion fell from 82% to 41%. Vercel gives the release timing: cue-web-prod-9f31 was promoted before the conversion drop. The launch decision is clear: H0 remains blocked until Sam fixes the workspaceId path and Dana verifies H0-22.",
    blocks: [
      {
        title: "Stale workspaceSlug sends beta users to an empty workspace",
        description:
          "Slack, Linear H0-19, and the onboarding spec all point to workspaceSlug being display-only after Aurora. Invite acceptance must use workspaceId.",
        reference: "H0-19 · PR #482 · Beta Onboarding Spec",
        severity: "blocker",
      },
      {
        title: "Activation drop is real and beta-specific",
        description:
          "PostHog events invite_accepted, workspace_joined, and activation_completed show beta invite-to-workspace conversion dropped from 82% before migration to 41% after migration.",
        reference: "PostHog · beta invite funnel",
        severity: "blocker",
      },
      {
        title: "Verification still pending",
        description:
          "Dana owns H0-22 to run staging verification and confirm the old workspace lookup is removed before launch.",
        reference: "Linear · H0-22",
        severity: "blocker",
      },
    ],
    missingEvidence: [],
    evidence: [
      { source: "slack", label: "#launch invite thread", citationId: "citation_slack_launch_invites" },
      { source: "linear", label: "H0-19", citationId: "citation_linear_h0_19" },
      { source: "github", label: "PR #482", citationId: "citation_github_pr_482" },
      { source: "posthog", label: "82% to 41%", citationId: "citation_posthog_invite_funnel" },
      { source: "vercel", label: "cue-web-prod-9f31", citationId: "citation_vercel_cue_web_prod_9f31" },
      { source: "exa", label: "external invite friction", citationId: "citation_exa_production_invite_friction" },
    ],
    citations: evidenceCitations,
    actions: [
      { id: "action_open_h0_22", label: "Open H0-22 verification", requiresApproval: false },
      approvalAction,
      { id: "action_watch_beta_invites", label: "Watch beta invite funnel", requiresApproval: true },
    ],
    planSteps: seedPlan("production"),
    retrievalTrace: seedTrace("production"),
    externalSignals: seedExternalSignals(citations, [
      "citation_exa_production_invite_friction",
    ]),
    modelSynthesis: {
      mode: "fallback",
      model: "gpt-5-mini",
      summary:
        "Cue traced the production breakage to the Aurora invite acceptance path. Slack reports empty workspaces after invite acceptance; Linear maps ownership to Sam for H0-19 and Dana for H0-22; GitHub points to PR #482 and the workspaceSlug versus workspaceId change; Notion confirms workspaceId is the source of truth; PostHog shows 82% to 41% beta invite conversion; and Vercel places the production deploy before the drop. H0 should remain blocked until the fix and verification are complete.",
      draft: String(pendingLaunchApproval.payload.draft),
    },
  };
}

function createSeedMarketingAnswer(citations: SourceCitation[], marketingApproval: ApprovalRecord): CueStructuredAnswer {
  const evidenceCitations = pickCitations(citations, [
    "citation_linear_mkt_7",
    "citation_notion_beta_onboarding_spec",
    "citation_slack_launch_invites",
    "citation_exa_launch_copy_signal",
  ]);
  return {
    role: "assistant",
    kind: "structured",
    tone: "signal",
    verdict: "People are confused about team invite setup and empty-workspace onboarding.",
    statusPill: { className: "warn", text: "Needs copy" },
    summary:
      "Cue treats this as a GTM launch decision. Exa provides external context around invite setup and onboarding confusion, while the internal sources decide what the team can safely say. MKT-7 assigns Priya to clarify team invite setup in launch messaging. The Beta Onboarding Spec says invite acceptance should place teammates directly into the invited workspace and that workspaceId is the source of truth after Aurora. Slack adds the launch concern: if invites are broken, copy needs to change. PostHog keeps the risk grounded by showing beta invite conversion falling from 82% to 41%. The public message should explain the intended invite behavior, offer beta setup help, and avoid claiming the Aurora path is fully fixed until Dana verifies H0-22.",
    blocks: [
        {
          title: "Team invite setup is unclear",
          description: "MKT-7 exists because invite/setup language needs to be clearer before launch.",
          reference: "Linear · MKT-7",
          severity: "risk",
        },
        {
          title: "Onboarding clarity is hurting launch feedback",
          description: "Exa context and launch notes point to onboarding language that needs clearer invite expectations.",
          reference: "Exa · onboarding copy signal",
          severity: "risk",
        },
      {
        title: "Copy owner exists but work is backlog",
        description: "MKT-7 is in Backlog with Priya assigned to clarify team invite setup in launch messaging.",
        reference: "Linear · MKT-7",
        severity: "risk",
      },
    ],
    missingEvidence: [],
    evidence: [
      { source: "linear", label: "MKT-7", citationId: "citation_linear_mkt_7" },
      { source: "notion", label: "Beta spec", citationId: "citation_notion_beta_onboarding_spec" },
      { source: "exa", label: "onboarding copy signal", citationId: "citation_exa_launch_copy_signal" },
    ],
    citations: evidenceCitations,
    actions: [
      {
        id: "action_approve_launch_invite_copy",
        label: "Approve public invite copy",
        requiresApproval: true,
        approvalId: marketingApproval.id,
      },
      { id: "action_move_mkt_7", label: "Move MKT-7 into launch work", requiresApproval: true },
    ],
    planSteps: seedPlan("gtm"),
    retrievalTrace: seedTrace("gtm"),
    externalSignals: seedExternalSignals(citations, [
      "citation_exa_launch_copy_signal",
    ]),
    modelSynthesis: {
      mode: "fallback",
      model: "gpt-5-mini",
      summary:
        "Cue separates public messaging from engineering verification. Exa supplies live context around onboarding and invite setup language; Linear shows Priya owns MKT-7; Notion defines the actual invite behavior; Slack shows the launch-copy concern; and PostHog shows the beta invite funnel is still risky. The safe public line is to describe intended invite behavior, offer beta setup help, and avoid saying the Aurora path is fixed until H0-22 is verified.",
      draft: String(marketingApproval.payload.draft),
    },
  };
}

function pickCitations(citations: SourceCitation[], citationIds: string[]): SourceCitation[] {
  return citationIds
    .map((citationId) => citations.find((citation) => citation.id === citationId))
    .filter((citation): citation is SourceCitation => Boolean(citation));
}

function seedPlan(intent: "production" | "gtm"): PlanStep[] {
  const titles =
    intent === "production"
      ? [
          "Understand the incident and define the decision that needs to be made",
          "Search connected workspace sources for symptoms and ownership",
          "Compare the implementation, product specification, and release timeline",
          "Measure user impact and determine launch readiness",
          "Prepare a proposed team update for approval",
        ]
      : [
          "Clarify the public question and the decision GTM needs to make",
          "Search external context and connected workspace sources",
          "Compare public expectations with documented product behavior",
          "Prepare recommended public language for approval",
        ];
  return titles.map((title, index) => ({
    id: `seed_plan_${intent}_${index + 1}`,
    title,
    status: "done",
  }));
}

function seedTrace(intent: "production" | "gtm"): RetrievalTraceStep[] {
  const rows: Array<Omit<RetrievalTraceStep, "status">> =
    intent === "production"
      ? [
          {
            source: "slack",
            section: "Workspace evidence",
            detail: "#launch · Sam, Dana, Avi, Priya",
            resultCount: "4 msgs",
            citationIds: ["citation_slack_launch_invites"],
          },
          {
            source: "linear",
            section: "Workspace evidence",
            detail: "H0-19, H0-22, MKT-7",
            resultCount: "3 issues",
            citationIds: ["citation_linear_h0_19", "citation_linear_h0_22", "citation_linear_mkt_7"],
          },
          {
            source: "github",
            section: "Workspace evidence",
            detail: "PR #482 · apps/web/src/invites/acceptInvite.ts",
            resultCount: "1 PR",
            citationIds: ["citation_github_pr_482"],
          },
          {
            source: "notion",
            section: "Workspace evidence",
            detail: "H0 Launch Checklist · Beta Onboarding Spec",
            resultCount: "2 docs",
            citationIds: ["citation_notion_h0_launch_checklist", "citation_notion_beta_onboarding_spec"],
          },
          {
            source: "posthog",
            section: "Workspace evidence",
            detail: "invite_accepted -> workspace_joined -> activation_completed",
            resultCount: "82%->41%",
            citationIds: ["citation_posthog_invite_funnel"],
          },
          {
            source: "vercel",
            section: "Release timeline",
            detail: "cue-web-prod-9f31 · production promoted before drop",
            resultCount: "prod",
            citationIds: ["citation_vercel_cue_web_prod_9f31"],
          },
          {
            source: "exa",
            section: "External signals",
            detail: "web search for beta invite setup and empty-workspace friction",
            resultCount: "web",
            citationIds: ["citation_exa_production_invite_friction"],
          },
        ]
      : [
          {
            source: "exa",
            section: "External signals",
            detail: "web search for invite setup and onboarding copy",
            resultCount: "web",
            citationIds: ["citation_exa_launch_copy_signal"],
          },
          {
            source: "linear",
            section: "Workspace evidence",
            detail: "MKT-7 · Priya · Backlog",
            resultCount: "1 issue",
            citationIds: ["citation_linear_mkt_7"],
          },
          {
            source: "notion",
            section: "Workspace evidence",
            detail: "Beta Onboarding Spec · source of truth is workspaceId",
            resultCount: "1 doc",
            citationIds: ["citation_notion_beta_onboarding_spec"],
          },
          {
            source: "slack",
            section: "Workspace evidence",
            detail: "#launch · Priya launch copy concern",
            resultCount: "1 ask",
            citationIds: ["citation_slack_launch_invites"],
          },
          {
            source: "posthog",
            section: "Workspace evidence",
            detail: "beta invite segment · conversion drop",
            resultCount: "82%->41%",
            citationIds: ["citation_posthog_invite_funnel"],
          },
        ];
  return rows.map((row) => ({
    ...row,
    status: "done",
  }));
}

function seedExternalSignals(citations: SourceCitation[], citationIds: string[]): ExternalSignal[] {
  return pickCitations(citations, citationIds)
    .filter((citation) => citation.source === "exa")
    .map((citation) => ({
      source: "exa",
      title: citation.title,
      url: citation.url ?? "https://exa.ai/search",
      excerpt: citation.excerpt,
      publishedAt: citation.createdAt,
      citationId: citation.id,
    }));
}
