import type {
  ExternalSignal,
  RetrievalTraceStep,
  SourceCitation,
  WorkspaceSource,
} from "@cue-h0/types";
import type { LaunchReadinessContext } from "@cue-h0/db";
import type { DemoIntent } from "./planner.js";

export interface RetrievedEvidence {
  citations: SourceCitation[];
  trace: RetrievalTraceStep[];
  externalSignals: ExternalSignal[];
}

interface TraceInput {
  source: WorkspaceSource;
  section: RetrievalTraceStep["section"];
  detail: string;
  resultCount: string;
  citationIds: string[];
}

export async function retrieveDemoEvidence(context: LaunchReadinessContext, intent: DemoIntent, query: string): Promise<RetrievedEvidence> {
  const baseCitations = pickCitations(context.citations, citationIdsForIntent(intent));
  const exaSignals = await retrieveExaSignals(context.workspace.id, intent, query);
  const citations = [...baseCitations, ...exaSignals.map((signal) => signal.citation)];
  const externalSignals: ExternalSignal[] = [
    ...exaSignals.map((signal) => signal.externalSignal),
  ];

  return {
    citations,
    externalSignals,
    trace: buildTrace(intent, citations, exaSignals.length),
  };
}

function citationIdsForIntent(intent: DemoIntent): string[] {
  if (intent === "gtm_confusion") {
    return [
      "citation_linear_mkt_7",
      "citation_notion_beta_onboarding_spec",
      "citation_slack_launch_invites",
      "citation_posthog_invite_funnel",
    ];
  }

  return [
    "citation_slack_launch_invites",
    "citation_linear_h0_19",
    "citation_linear_h0_22",
    "citation_linear_mkt_7",
    "citation_github_pr_482",
    "citation_notion_h0_launch_checklist",
    "citation_notion_beta_onboarding_spec",
    "citation_posthog_invite_funnel",
    "citation_vercel_cue_web_prod_9f31",
  ];
}

function buildTrace(intent: DemoIntent, citations: SourceCitation[], exaCount: number): RetrievalTraceStep[] {
  const bySource = new Map<WorkspaceSource, SourceCitation[]>();
  for (const citation of citations) {
    bySource.set(citation.source, [...(bySource.get(citation.source) ?? []), citation]);
  }

  const rows: TraceInput[] =
    intent === "gtm_confusion"
      ? [
          row("exa", "External signals", "live web search for Cue beta invite setup confusion", webResultCount(exaCount), bySource),
          row("linear", "Workspace evidence", "MKT-7 · Priya · Backlog", "1 issue", bySource),
          row("notion", "Workspace evidence", "Beta Onboarding Spec · source of truth is workspaceId", "1 doc", bySource),
          row("slack", "Workspace evidence", "#launch · Priya launch copy concern", "1 ask", bySource),
          row("posthog", "Workspace evidence", "beta invite segment · conversion drop", "82%→41%", bySource),
        ]
      : [
          row("slack", "Workspace evidence", "#launch · Sam, Dana, Avi, Priya", "4 msgs", bySource),
          row("linear", "Workspace evidence", "H0-19, H0-22, MKT-7", "3 issues", bySource),
          row("github", "Workspace evidence", "PR #482 · apps/web/src/invites/acceptInvite.ts", "1 PR", bySource),
          row("notion", "Workspace evidence", "H0 Launch Checklist · Beta Onboarding Spec", "2 docs", bySource),
          row("posthog", "Workspace evidence", "invite_accepted → workspace_joined → activation_completed", "82%→41%", bySource),
          row("vercel", "Release timeline", "cue-web-prod-9f31 · production promoted before drop", "prod", bySource),
          row("exa", "External signals", "live web search for invite setup confusion", webResultCount(exaCount), bySource),
        ];

  return rows.map((traceRow) => ({
    ...traceRow,
    status: "done",
  }));
}

function row(
  source: WorkspaceSource,
  section: RetrievalTraceStep["section"],
  detail: string,
  resultCount: string,
  bySource: Map<WorkspaceSource, SourceCitation[]>,
): TraceInput {
  return {
    source,
    section,
    detail,
    resultCount,
    citationIds: bySource.get(source)?.map((citation) => citation.id) ?? [],
  };
}

function webResultCount(count: number): string {
  return `${count} web ${count === 1 ? "result" : "results"}`;
}

async function retrieveExaSignals(
  workspaceId: string,
  intent: DemoIntent,
  query: string,
): Promise<Array<{ citation: SourceCitation; externalSignal: ExternalSignal }>> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    return [fallbackExaSignal(workspaceId, intent)];
  }

  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      signal: AbortSignal.timeout(2_500),
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: intent === "gtm_confusion" ? "Cue beta invite team setup confusing onboarding" : query,
        type: "neural",
        numResults: 3,
        contents: {
          text: true,
          highlights: true,
        },
      }),
    });
    if (!response.ok) {
      return [fallbackExaSignal(workspaceId, intent)];
    }
    const body = (await response.json()) as {
      results?: Array<{
        id?: string;
        title?: string;
        url?: string;
        text?: string;
        highlights?: string[];
        publishedDate?: string;
      }>;
    };
    const results = (body.results ?? []).slice(0, 3);
    if (results.length === 0) {
      return [fallbackExaSignal(workspaceId, intent)];
    }
    return results.map((result, index) => {
      const id = `citation_exa_${intent}_${index + 1}`;
      const excerpt = cleanExcerpt(result.highlights?.[0] ?? result.text ?? "External web result related to Cue beta invite onboarding.");
      const citation: SourceCitation = {
        id,
        workspaceId,
        source: "exa",
        sourceId: result.id ?? id,
        label: `Exa · web result ${index + 1}`,
        title: result.title ?? "External web signal",
        excerpt,
        url: result.url,
        authorName: "Exa",
        createdAt: result.publishedDate ?? new Date().toISOString(),
        freshness: "fresh",
      };
      return {
        citation,
        externalSignal: {
          source: "exa" as const,
          title: citation.title,
          url: citation.url ?? "https://exa.ai/search",
          excerpt: citation.excerpt,
          publishedAt: citation.createdAt,
          citationId: citation.id,
        },
      };
    });
  } catch {
    return [fallbackExaSignal(workspaceId, intent)];
  }
}

function fallbackExaSignal(workspaceId: string, intent: DemoIntent): { citation: SourceCitation; externalSignal: ExternalSignal } {
  const createdAt = new Date().toISOString();
  const citation: SourceCitation = {
    id: `citation_exa_${intent}_fallback`,
    workspaceId,
    source: "exa",
    sourceId: `exa_${intent}_fallback`,
    label: "Exa · web signal",
    title: intent === "gtm_confusion" ? "Public onboarding clarity signal" : "Public beta invite friction signal",
    excerpt:
      intent === "gtm_confusion"
        ? "External context on beta invite setup, onboarding clarity, and team invite confusion before launch."
        : "External context on beta users reporting empty workspaces after accepting Cue invites.",
    url: "https://exa.ai/search",
    authorName: "Exa",
    createdAt,
    freshness: "unknown",
  };
  return {
    citation,
    externalSignal: {
      source: "exa",
      title: citation.title,
      url: citation.url ?? "https://exa.ai/search",
      excerpt: citation.excerpt,
      publishedAt: createdAt,
      citationId: citation.id,
    },
  };
}

function pickCitations(citations: SourceCitation[], citationIds: string[]): SourceCitation[] {
  return citationIds
    .map((citationId) => citations.find((citation) => citation.id === citationId))
    .filter((citation): citation is SourceCitation => Boolean(citation));
}

function cleanExcerpt(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 280);
}
