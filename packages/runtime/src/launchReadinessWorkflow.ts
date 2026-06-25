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
        { id: "step_collect", title: "Collect Slack, GitHub, Linear, Vercel, and memory evidence", status: "completed" as const },
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
        : ["PostHog launch analytics are not connected in this demo workspace."];
      return { findings, citations, evidenceGaps };
    })
    .addNode("draftActions", async (state) => {
      const actions: SuggestedAction[] = [
        { id: "action_create_migration_ticket", label: "Create ticket for migration", requiresApproval: true },
        { id: "action_draft_launch_update", label: "Draft launch update", requiresApproval: true },
        { id: "action_assign_deploy_owner", label: "Assign deploy to Dana", requiresApproval: true },
      ];
      const approvals = await Promise.all(
        actions.map((action) =>
          dependencies.repository.createApproval({
            workspaceId: state.workspaceId,
            workflowRunId: workflowRun.id,
            title: `Approve: ${action.label}`,
            description: buildApprovalDescription(action.label),
            actionType: action.label.includes("ticket")
              ? "linear_ticket"
              : action.label.includes("deploy")
                ? "deployment_note"
                : "slack_update",
            payload: { query: state.query, action: action.label },
          }),
        ),
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

function buildApprovalDescription(actionLabel: string): string {
  if (actionLabel.includes("ticket")) {
    return "Cue will create a Linear ticket for the migration verification blocker after approval.";
  }
  if (actionLabel.includes("deploy")) {
    return "Cue will record Dana as the production deploy owner after approval.";
  }
  return "Cue will draft a #launch update after approval. Nothing posts without your confirmation.";
}

function buildFormattedReport(status: LaunchReadinessReport["status"], findings: AnswerBlock[], evidenceGaps: string[]): string {
  const verdict = status === "ready" ? "Ready to submit." : "Not yet - H0 is at risk.";
  const findingLines = findings.map((finding) => `- ${finding.title}: ${finding.description}`);
  const gapLines = evidenceGaps.map((gap) => `- Missing evidence: ${gap}`);
  return [verdict, ...findingLines, ...gapLines].join("\n");
}
