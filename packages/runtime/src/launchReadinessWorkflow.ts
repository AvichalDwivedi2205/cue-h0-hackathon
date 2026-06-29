import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { CueRepository, LaunchReadinessContext } from "@cue-h0/db";
import type { AnswerBlock, LaunchReadinessReport, SourceCitation, SuggestedAction } from "@cue-h0/types";
import { createWorkflowRunRecord } from "@cue-h0/db";

interface LaunchReadinessWorkflowDependencies {
  repository: CueRepository;
}

interface WorkflowPlanStep {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
}

interface LaunchReadinessWorkflowResult {
  report: LaunchReadinessReport;
  actions: SuggestedAction[];
}

const LaunchReadinessState = Annotation.Root({
  workspaceId: Annotation<string>(),
  query: Annotation<string>(),
  runId: Annotation<string | undefined>(),
  context: Annotation<LaunchReadinessContext | undefined>(),
  plan: Annotation<WorkflowPlanStep[]>({ reducer: (_left, right) => right, default: () => [] }),
  findings: Annotation<AnswerBlock[]>({ reducer: (_left, right) => right, default: () => [] }),
  citations: Annotation<SourceCitation[]>({ reducer: (_left, right) => right, default: () => [] }),
  evidenceGaps: Annotation<string[]>({ reducer: (_left, right) => right, default: () => [] }),
  actions: Annotation<SuggestedAction[]>({ reducer: (_left, right) => right, default: () => [] }),
  report: Annotation<LaunchReadinessReport | undefined>(),
});

export async function runLaunchReadinessWorkflow(
  dependencies: LaunchReadinessWorkflowDependencies,
  workspaceId: string,
  query: string,
): Promise<LaunchReadinessWorkflowResult> {
  const workflowRun = createWorkflowRunRecord({
    workspaceId,
    workflowType: "launch_readiness",
    status: "running",
    state: { query },
  });
  await dependencies.repository.createWorkflowRun(workflowRun);

  const graph = new StateGraph(LaunchReadinessState)
    .addNode("buildPlan", async () => ({
      runId: workflowRun.id,
      plan: [
        { id: "step_collect", title: "Collect Slack, GitHub, Linear, Notion, PostHog, Vercel, Exa, and memory evidence", status: "completed" as const },
        { id: "step_check", title: "Evaluate launch checks and missing evidence", status: "in_progress" as const },
        { id: "step_actions", title: "Draft approval-gated actions", status: "pending" as const },
      ],
    }))
    .addNode("collectEvidence", async (state) => ({
      context: await dependencies.repository.loadLaunchReadinessContext(state.workspaceId),
    }))
    .addNode("evaluateReadiness", async (state) => {
      if (!state.context) {
        throw new Error("Launch readiness context was not loaded.");
      }
      const blockedChecks = state.context.launchChecks.filter((launchCheck) => launchCheck.status === "blocked");
      const riskChecks = state.context.launchChecks.filter((launchCheck) => launchCheck.status === "risk");
      const findings: AnswerBlock[] = [...blockedChecks, ...riskChecks].map((launchCheck) => ({
        title: launchCheck.title,
        description: launchCheck.summary,
        reference: `${launchCheck.ownerName ?? "Unassigned"} · ${launchCheck.status}`,
        severity: launchCheck.status === "blocked" ? "blocker" : "risk",
      }));
      const citationIds = new Set([...blockedChecks, ...riskChecks].flatMap((launchCheck) => launchCheck.citationIds));
      const citations = state.context.citations.filter((citation) => citationIds.has(citation.id));
      const evidenceGaps = state.context.citations.some((citation) => citation.source === "posthog")
        ? []
        : ["PostHog launch analytics are currently unavailable."];
      return { findings, citations, evidenceGaps };
    })
    .addNode("draftActions", async (state) => {
      const actions: SuggestedAction[] = [
        { id: "action_create_verification_ticket", label: "Create H0-22 verification follow-up", requiresApproval: true },
        { id: "action_draft_launch_update", label: "Draft H0 invite blocker update", requiresApproval: true },
        { id: "action_assign_copy_owner", label: "Assign invite copy to Priya", requiresApproval: true },
      ];
      const approvals = await Promise.all(
        actions.map((action) => {
          const approvalDraft = buildApprovalDraft(action.label, state.query);
          return dependencies.repository.createApproval({
            workspaceId: state.workspaceId,
            workflowRunId: workflowRun.id,
            title: `Approve: ${action.label}`,
            description: approvalDraft.description,
            actionType: approvalDraft.actionType,
            payload: approvalDraft.payload,
          });
        }),
      );
      return {
        actions: actions.map((action, index) => ({
          ...action,
          approvalId: approvals[index]?.id,
        })),
      };
    })
    .addNode("synthesizeReport", async (state) => {
      const status = state.findings.some((finding) => finding.severity === "blocker")
        ? "at_risk"
        : state.evidenceGaps.length > 0
          ? "insufficient_evidence"
          : "ready";
      const report: LaunchReadinessReport = {
        runId: workflowRun.id,
        workspaceId: state.workspaceId,
        goal: state.query,
        status,
        confidence: status === "ready" ? 0.88 : 0.78,
        findings: state.findings,
        evidenceGaps: state.evidenceGaps,
        recommendedActions: state.actions,
        citations: state.citations,
        formattedText: buildFormattedReport(status, state.findings, state.evidenceGaps),
      };
      return { report };
    })
    .addEdge(START, "buildPlan")
    .addEdge("buildPlan", "collectEvidence")
    .addEdge("collectEvidence", "evaluateReadiness")
    .addEdge("evaluateReadiness", "draftActions")
    .addEdge("draftActions", "synthesizeReport")
    .addEdge("synthesizeReport", END)
    .compile();

  const result = await graph.invoke({ workspaceId, query });
  if (!result.report) {
    throw new Error("Launch readiness workflow did not produce a report.");
  }
  return {
    report: result.report,
    actions: result.actions,
  };
}

function buildApprovalDraft(
  actionLabel: string,
  query: string,
): {
  description: string;
  actionType: "linear_ticket" | "slack_update" | "deployment_note";
  payload: Record<string, unknown>;
} {
  if (actionLabel.includes("ticket")) {
    return {
      description: "Cue will create a Linear verification follow-up for the invite acceptance blocker after approval.",
      actionType: "linear_ticket",
      payload: {
        query,
        title: "Verify Aurora invite acceptance migration path",
        description:
          "Run staging verification for invite acceptance, confirm stale workspaceSlug lookup is removed, and prove beta invites join by workspaceId.",
      },
    };
  }
  if (actionLabel.includes("Priya") || actionLabel.includes("copy")) {
    return {
      description: "Cue will record Priya as owner for invite/setup launch copy after approval.",
      actionType: "deployment_note",
      payload: { query, note: "Priya owns launch copy clarifying team invite setup before Cue H0 launch." },
    };
  }
  return {
    description: "Cue will post a #launch update after approval when Slack credentials are configured.",
    actionType: "slack_update",
    payload: {
      query,
      channel: process.env.SLACK_LAUNCH_CHANNEL_ID,
      draft:
        "H0 is blocked until beta invite acceptance is verified. Evidence points to stale workspaceSlug lookup after Aurora migration; PR #482 switches acceptance to workspaceId and PostHog shows beta conversion dropped from 82% to 41%.",
    },
  };
}

function buildFormattedReport(status: LaunchReadinessReport["status"], findings: AnswerBlock[], evidenceGaps: string[]): string {
  const verdict = status === "ready" ? "Ready to submit." : "Not yet - H0 is at risk.";
  const findingLines = findings.map((finding) => `- ${finding.title}: ${finding.description}`);
  const gapLines = evidenceGaps.map((gap) => `- Missing evidence: ${gap}`);
  return [verdict, ...findingLines, ...gapLines].join("\n");
}
