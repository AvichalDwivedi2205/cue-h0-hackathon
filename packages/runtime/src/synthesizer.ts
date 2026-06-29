import type {
  ApprovalRecord,
  CueStructuredAnswer,
  ModelSynthesisResult,
  PlanStep,
  RetrievalTraceStep,
  SourceCitation,
} from "@cue-h0/types";
import type { DemoIntent } from "./planner.js";
import type { RetrievedEvidence } from "./retrievers.js";
import { approvalDraftFromSeed, buildDemoDraftActions } from "./draftActions.js";

interface SynthesizeInput {
  intent: DemoIntent;
  query: string;
  planSteps: PlanStep[];
  retrieved: RetrievedEvidence;
  pendingApprovals: ApprovalRecord[];
}

interface ModelJson {
  summary?: string;
  draft?: string;
}

export async function synthesizeDemoAnswer(input: SynthesizeInput): Promise<CueStructuredAnswer> {
  const fallback = buildFallbackAnswer(input, {
    mode: "fallback",
    model: process.env.CUE_MODEL ?? "gpt-5-mini",
    summary: fallbackSummaryForIntent(input.intent),
    draft: buildDraft(input),
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallback;
  }

  try {
    const model = process.env.CUE_MODEL ?? "gpt-5-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_output_tokens: 5_000,
        input: [
          {
            role: "system",
            content:
              "You are Cue, a workplace execution agent for a live product demo. Use only the provided evidence. Return valid JSON with exactly two string keys: summary and draft. The summary must be substantial, specific, and demo-worthy: 650-850 words for production_breakage, 500-700 words for gtm_confusion. Organize it into short paragraphs separated by newline characters. Explain the decision, the source-by-source evidence trail, the root cause or GTM diagnosis, owner mapping, business impact, launch risk, and next action. Mention concrete IDs and facts when present: H0-19, H0-22, MKT-7, PR #482, Aurora workspace migration, workspaceId vs workspaceSlug, 82% to 41%, cue-web-prod-9f31, Sam, Dana, and Priya. The draft must be ready to send, specific, and 90-140 words. Do not invent sources, owners, metrics, or issue IDs.",
          },
          {
            role: "user",
            content: JSON.stringify({
              query: input.query,
              intent: input.intent,
              evidence: input.retrieved.citations.map((citation) => ({
                id: citation.id,
                source: citation.source,
                title: citation.title,
                excerpt: citation.excerpt,
              })),
              requiredFacts: [
                "H0-19",
                "H0-22",
                "PR #482",
                "Aurora workspace migration",
                "workspaceId vs workspaceSlug",
                "82% to 41%",
              ],
            }),
          },
        ],
      }),
    });
    if (!response.ok) {
      return fallback;
    }
    const body = (await response.json()) as { output_text?: string; output?: unknown };
    const parsed = parseModelJson(body.output_text ?? readOutputText(body.output));
    if (!parsed.summary && !parsed.draft) {
      return fallback;
    }
    const summary = chooseModelSummary(input.intent, parsed.summary, fallback.summary);
    return buildFallbackAnswer(input, {
      mode: "openai",
      model,
      summary,
      draft: parsed.draft ?? buildDraft(input),
    });
  } catch {
    return fallback;
  }
}

function buildFallbackAnswer(input: SynthesizeInput, synthesis: ModelSynthesisResult): CueStructuredAnswer {
  const actions = buildDemoDraftActions(input.intent);
  if (input.intent === "gtm_confusion") {
    return {
      role: "assistant",
      kind: "structured",
      tone: "signal",
      verdict: "People are confused about team invite setup and empty-workspace onboarding.",
      statusPill: { className: "warn", text: "Needs copy" },
      summary:
        synthesis.mode === "openai"
          ? synthesis.summary
          : fallbackSummaryForIntent(input.intent),
      blocks: [
        {
          title: "Team invite setup is unclear",
          description: "MKT-7 and the launch thread both point to confusion around how teams should invite teammates before H0.",
          reference: "Linear · MKT-7 · Slack #launch",
          severity: "risk",
        },
        {
          title: "Onboarding clarity is hurting launch feedback",
          description: "Exa context and internal launch notes show invite/setup language needs to be clearer before public launch.",
          reference: "Exa · launch messaging context",
          severity: "risk",
        },
        {
          title: "Copy owner exists but work is still backlog",
          description: "MKT-7 is in Backlog with Priya assigned to clarify team invite setup in launch messaging.",
          reference: "Linear · MKT-7",
          severity: "risk",
        },
      ],
      missingEvidence: [],
      evidence: citationsToEvidence(input.retrieved.citations),
      citations: input.retrieved.citations,
      actions: actions.actions,
      planSteps: input.planSteps,
      retrievalTrace: input.retrieved.trace,
      externalSignals: input.retrieved.externalSignals,
      modelSynthesis: { ...synthesis, draft: synthesis.draft ?? actions.draft },
    };
  }

  return {
    role: "assistant",
    kind: "structured",
    tone: "signal",
    verdict: "Yes - production invite acceptance is blocking H0.",
    statusPill: { className: "warn", text: "Blocked" },
    summary:
      synthesis.mode === "openai"
        ? synthesis.summary
        : fallbackSummaryForIntent(input.intent),
    blocks: [
      {
        title: "Root cause: stale workspaceSlug lookup",
        description:
          "The invite acceptance path was using workspaceSlug after Aurora made slug display-only. The correct production path is workspaceId.",
        reference: "GitHub · PR #482 · acceptInvite.ts",
        severity: "blocker",
      },
      {
        title: "Owner and verification path are clear",
        description: "Sam owns H0-19 for the fix. Dana owns H0-22 to verify the Aurora invite acceptance migration path.",
        reference: "Linear · H0-19 · H0-22",
        severity: "blocker",
      },
      {
        title: "Business impact blocks launch",
        description: "PostHog shows beta invite-to-workspace conversion dropped from 82% before migration to 41% after migration.",
        reference: "PostHog · beta invite funnel",
        severity: "blocker",
      },
    ],
    missingEvidence: [],
    evidence: citationsToEvidence(input.retrieved.citations),
    citations: input.retrieved.citations,
    actions: actions.actions,
    planSteps: input.planSteps,
    retrievalTrace: input.retrieved.trace,
    externalSignals: input.retrieved.externalSignals,
    modelSynthesis: { ...synthesis, draft: synthesis.draft ?? actions.draft },
  };
}

function chooseModelSummary(intent: DemoIntent, modelSummary: string | undefined, fallbackSummary: string): string {
  if (!modelSummary || !isDetailedEnough(intent, modelSummary)) {
    return [modelSummary, fallbackSummary].filter(Boolean).join("\n\nAdditional grounded detail:\n");
  }
  return modelSummary;
}

function isDetailedEnough(intent: DemoIntent, summary: string): boolean {
  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  if (wordCount < (intent === "gtm_confusion" ? 350 : 450)) {
    return false;
  }
  const normalized = summary.toLowerCase();
  const requiredSignals =
    intent === "gtm_confusion"
      ? ["mkt-7", "priya", "invite", "workspace", "h0-22"]
      : ["h0-19", "pr #482", "workspaceid", "workspaceslug", "82", "41"];
  const matches = requiredSignals.filter((signal) => normalized.includes(signal.toLowerCase())).length;
  return matches >= 3;
}

function fallbackSummaryForIntent(intent: DemoIntent): string {
  if (intent === "gtm_confusion") {
    return [
      "Cue treats this as a GTM launch-readiness question, not an engineering triage question. The public-facing problem is not simply that one invite path is broken; it is that invite setup is already unclear, and the empty-workspace behavior makes the onboarding story feel unreliable right before H0. The internal evidence starts with MKT-7, where Priya owns the launch-messaging work to clarify team invite setup. That ticket matters because it proves the confusion is already assigned and known, not a vague marketing concern. Slack adds the launch-channel context: Priya has already raised that if invites are broken, launch copy needs to change. Notion adds the product truth: the Beta Onboarding Spec says accepting an invite should place the user directly into the invited workspace, and after Aurora the source of truth is workspaceId, while workspaceSlug is display-only.",
      "The recommendation is to avoid overpromising. Public messaging should not say the Aurora path is fully fixed until Dana completes H0-22 verification. Instead, Cue should explain the intended behavior in clear user language: beta invites are designed to bring teammates directly into the invited workspace, and the team is validating the Aurora invite path before launch. That gives GTM a clean story without making an engineering claim that is not verified yet.",
      "Exa is useful here as live external context, but the decision should stay grounded in internal source-of-truth evidence. The external signal can help with wording around onboarding clarity and invite setup, while Linear, Slack, Notion, and PostHog determine what Cue should say and what it should avoid. The owner is Priya for MKT-7, with Dana as the dependency for H0-22 verification. The action is to draft approval-gated public copy that acknowledges beta setup help, explains team invites plainly, and does not claim activation is fixed until the verification path is complete.",
    ].join("\n\n");
  }

  return [
    "Cue treats this as a production-breakage investigation because the user asks for the issue, the owner, the impact, and a Slack ping. The answer is not coming from one source. Slack gives the symptom: beta users accept invites and then land in an empty workspace. Dana ties the timing to the Aurora workspace migration. Linear gives the ownership map: H0-19 is the production invite bug and is assigned to Sam; H0-22 is the verification path and is assigned to Dana; MKT-7 is the launch-copy follow-up and is assigned to Priya. That already tells Cue this is not just a customer-support issue. It touches code, verification, analytics, and launch messaging.",
    "The technical root cause points to the invite acceptance path using the wrong workspace identity after Aurora. GitHub has PR #482, titled Migrate invite acceptance to Aurora workspaces, and the relevant file is apps/web/src/invites/acceptInvite.ts. The risky path is the stale workspaceSlug lookup, where invite acceptance can resolve the display slug instead of the canonical workspace. Notion confirms why that is wrong: after Aurora, workspaceSlug is display-only, and workspaceId is the source of truth. That lines up with the suspected fix: replace getWorkspaceBySlug(invite.workspaceSlug) with getWorkspaceById(invite.workspaceId), and keep a test where the invite has a valid workspaceId but a stale workspaceSlug.",
    "The business impact is measurable. PostHog shows the beta invite funnel falling from 82% invite-to-workspace conversion before the migration to 41% after migration, specifically for beta invites. Vercel adds release timing: cue-web-prod-9f31 was promoted to production shortly before the conversion drop. That does not prove causality by itself, but when combined with Slack symptoms, Linear ownership, the GitHub diff, and the Notion spec, the evidence is strong enough for a launch decision.",
    "The decision is that H0 stays blocked until Sam’s fix is merged and Dana verifies H0-22 in staging. Priya should have launch messaging ready because if the invite path remains risky, public copy needs to avoid promising a clean activation path. The next action is not an automatic post; Cue should prepare a Slack update for #launch that names the blocker, the likely root cause, the measured impact, and the owners, then wait for approval before posting.",
  ].join("\n\n");
}

function buildDraft(input: SynthesizeInput): string {
  const fallback = buildDemoDraftActions(input.intent).draft;
  const approvalId = input.intent === "gtm_confusion" ? "approval_launch_invite_copy" : "approval_h0_invite_blocker_update";
  return approvalDraftFromSeed(input.pendingApprovals.find((approval) => approval.id === approvalId), fallback);
}

function citationsToEvidence(citations: SourceCitation[]) {
  return citations.map((citation) => ({
    source: citation.source,
    label: citation.label,
    citationId: citation.id,
  }));
}

function parseModelJson(value: string | undefined): ModelJson {
  if (!value) {
    return {};
  }
  const trimmed = value.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(trimmed) as { summary?: unknown; draft?: unknown };
    return {
      summary: modelText(parsed.summary),
      draft: modelText(parsed.draft),
    };
  } catch {
    return { summary: trimmed };
  }
}

function modelText(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() || undefined;
  }
  if (Array.isArray(value)) {
    return value.map(modelText).filter(Boolean).join("\n\n") || undefined;
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, entry]) => {
        const text = modelText(entry);
        return text ? `${humanizeKey(key)}:\n${text}` : undefined;
      })
      .filter(Boolean)
      .join("\n\n") || undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readOutputText(output: unknown): string | undefined {
  if (!Array.isArray(output)) {
    return undefined;
  }
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object" || !("content" in item)) {
      continue;
    }
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }
    for (const part of content) {
      if (part && typeof part === "object" && "text" in part && typeof (part as { text?: unknown }).text === "string") {
        chunks.push((part as { text: string }).text);
      }
    }
  }
  return chunks.join("\n").trim() || undefined;
}
