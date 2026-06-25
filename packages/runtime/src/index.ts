import type { CueAssistantMessage, CueStructuredAnswer, EvidenceChip, SourceCitation, SuggestedAction } from "@cue-h0/types";
import type { CueRepository } from "@cue-h0/db";
import { runLaunchReadinessWorkflow } from "./launchReadinessWorkflow.js";

export interface GenerateCueResponseInput {
  repository: CueRepository;
  workspaceId: string;
  query: string;
}

export async function generateCueResponse(input: GenerateCueResponseInput): Promise<CueAssistantMessage> {
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
    summary: `I searched the demo workspace for "${trimQuery(input.query)}". Nothing new blocks the launch beyond the current H0 readiness items.`,
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
    verdict: hasBlockers ? "Not yet - H0 is at risk." : "Ready - no launch blockers found.",
    statusPill: hasBlockers ? { className: "warn", text: "At risk" } : { className: "ok", text: "Ready" },
    summary: hasBlockers
      ? "You're close. Cue found launch evidence across Slack, GitHub, Linear, Vercel, and memory. Two execution blockers still need approval or owner follow-through before submission."
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
  return ["h0", "launch", "submit", "ready", "readiness", "aurora", "deploy", "vercel", "blocker"].some((keyword) =>
    normalizedQuery.includes(keyword),
  );
}

function trimQuery(query: string): string {
  return query.length > 80 ? `${query.slice(0, 80)}...` : query;
}
