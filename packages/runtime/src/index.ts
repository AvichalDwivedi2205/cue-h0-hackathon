import type { CueAssistantMessage, CueStructuredAnswer, EvidenceChip, SourceCitation, SuggestedAction } from "@cue-h0/types";
import type { CueRepository } from "@cue-h0/db";
import { runLaunchReadinessWorkflow } from "./launchReadinessWorkflow.js";
import { planCueRequest } from "./planner.js";
import { retrieveDemoEvidence } from "./retrievers.js";
import { synthesizeDemoAnswer } from "./synthesizer.js";
export { executeApprovedAction, type ApprovalExecutionResult } from "./approvalExecutor.js";

export interface GenerateCueResponseInput {
  repository: CueRepository;
  workspaceId: string;
  query: string;
}

export async function generateCueResponse(input: GenerateCueResponseInput): Promise<CueAssistantMessage> {
  const plan = planCueRequest(input.query);
  if (plan.intent === "production_breakage" || plan.intent === "gtm_confusion") {
    const context = await input.repository.loadLaunchReadinessContext(input.workspaceId);
    const retrieved = await retrieveDemoEvidence(context, plan.intent, input.query);
    return synthesizeDemoAnswer({
      intent: plan.intent,
      query: input.query,
      planSteps: plan.steps,
      retrieved,
      pendingApprovals: context.pendingApprovals,
    });
  }

  if (isLaunchReadinessQuestion(input.query)) {
    const workflowResult = await runLaunchReadinessWorkflow(
      { repository: input.repository },
      input.workspaceId,
      input.query,
    );
    return launchReportToAnswer(workflowResult.report.citations, workflowResult.report.findings, workflowResult.report.evidenceGaps, workflowResult.actions);
  }

  const context = await input.repository.loadLaunchReadinessContext(input.workspaceId);
  const citations = context.citations.slice(0, 3);
  return {
    role: "assistant",
    kind: "structured",
    tone: "signal",
    verdict: "Here's what I'm seeing.",
    summary: `I searched the workspace for "${trimQuery(input.query)}". Nothing new blocks the launch beyond the current H0 readiness items.`,
    blocks: [],
    noBlock: "No additional blockers matched this question. Cue can keep watching for changes.",
    missingEvidence: context.citations.some((citation) => citation.source === "posthog")
      ? []
      : ["PostHog analytics are not connected, so usage-risk evidence is unavailable."],
    evidence: citationsToEvidence(citations),
    citations,
    actions: [
      {
        id: "action_set_watch",
        label: "Set a watch",
        requiresApproval: true,
      },
      {
        id: "action_open_related_threads",
        label: "Open related threads",
        requiresApproval: false,
      },
    ],
  };
}

function inviteBlockerAnswer(citations: SourceCitation[]): CueStructuredAnswer {
  const evidenceCitations = pickCitations(citations, [
    "citation_slack_launch_invites",
    "citation_linear_h0_19",
    "citation_github_pr_482",
    "citation_posthog_invite_funnel",
    "citation_vercel_cue_web_prod_9f31",
    "citation_notion_beta_onboarding_spec",
    "citation_linear_h0_22",
  ]);

  return {
    role: "assistant",
    kind: "structured",
    tone: "signal",
    verdict: "Yes - H0 is blocked by invite acceptance.",
    statusPill: { className: "warn", text: "Blocked" },
    summary:
      "Beta users are getting stuck because invite acceptance is still resolving a stale workspaceSlug after the Aurora workspace migration. PR #482 switches the path to workspaceId, but H0-22 still needs staging verification. PostHog shows beta invite conversion fell from 82% to 41%, so H0 should not ship yet.",
    blocks: [
      {
        title: "Stale workspaceSlug sends beta users to an empty workspace",
        description:
          "Slack, Linear H0-19, GitHub PR #482, and the onboarding spec all point to workspaceSlug being display-only after Aurora. Invite acceptance must use workspaceId.",
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
    evidence: citationsToEvidence(evidenceCitations),
    citations: evidenceCitations,
    actions: [
      { id: "action_open_h0_22", label: "Open H0-22 verification", requiresApproval: false },
      {
        id: "action_approve_h0_invite_update",
        label: "Approve H0 blocker update",
        requiresApproval: true,
        approvalId: "approval_h0_invite_blocker_update",
      },
      { id: "action_watch_beta_invites", label: "Watch beta invite funnel", requiresApproval: true },
    ],
  };
}

export function answerStatusToThreadStatus(answer: CueAssistantMessage): "ok" | "warn" | "muted" {
  if (answer.kind === "structured" && answer.statusPill?.className === "ok") {
    return "ok";
  }
  if (answer.kind === "structured" && answer.statusPill?.className === "warn") {
    return "warn";
  }
  return answer.tone === "green" ? "ok" : "warn";
}

function launchReportToAnswer(
  citations: SourceCitation[],
  findings: CueStructuredAnswer["blocks"],
  evidenceGaps: string[],
  actions: SuggestedAction[],
): CueStructuredAnswer {
  const hasBlockers = findings.some((finding) => finding.severity === "blocker");
  return {
    role: "assistant",
    kind: "structured",
    tone: hasBlockers ? "signal" : "green",
    verdict: hasBlockers ? "Yes - H0 is blocked by invite acceptance." : "Ready - no launch blockers found.",
    statusPill: hasBlockers ? { className: "warn", text: "Blocked" } : { className: "ok", text: "Ready" },
    summary: hasBlockers
      ? "Cue found one connected story across Slack, GitHub, Linear, Notion, PostHog, Vercel, and Exa: beta invite acceptance is still unsafe after the Aurora workspace migration, and H0 should stay blocked until H0-22 verifies the workspaceId path."
      : "Cue found the launch checks passing across connected sources.",
    blocks: findings,
    noBlock: hasBlockers ? undefined : "All readiness checks pass.",
    missingEvidence: evidenceGaps,
    evidence: citationsToEvidence(citations),
    citations,
    actions,
  };
}

function citationsToEvidence(citations: SourceCitation[]): EvidenceChip[] {
  return citations.map((citation) => ({
    source: citation.source,
    label: citation.label,
    citationId: citation.id,
  }));
}

function isLaunchReadinessQuestion(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return ["h0", "launch", "submit", "ready", "readiness", "aurora", "invite", "activation", "workspace", "blocker"].some((keyword) =>
    normalizedQuery.includes(keyword),
  );
}

function isInviteBlockerQuestion(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return (
    ["invite", "accepting", "accepted", "workspace"].some((keyword) => normalizedQuery.includes(keyword)) &&
    ["h0", "blocking", "blocked", "block"].some((keyword) => normalizedQuery.includes(keyword))
  );
}

function isMarketingLaunchQuestion(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return (
    ["confused", "confusion", "public", "say publicly", "messaging", "copy", "launch post"].some((keyword) =>
      normalizedQuery.includes(keyword),
    ) && ["launch", "invite", "onboarding", "team"].some((keyword) => normalizedQuery.includes(keyword))
  );
}

function pickCitations(citations: SourceCitation[], citationIds: string[]): SourceCitation[] {
  return citationIds
    .map((citationId) => citations.find((citation) => citation.id === citationId))
    .filter((citation): citation is SourceCitation => Boolean(citation));
}

function trimQuery(query: string): string {
  return query.length > 80 ? `${query.slice(0, 80)}...` : query;
}
