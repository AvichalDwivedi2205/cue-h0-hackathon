import type { PlanStep } from "@cue-h0/types";

export type DemoIntent = "production_breakage" | "gtm_confusion" | "launch_readiness" | "general";

export interface CuePlan {
  intent: DemoIntent;
  isComplex: boolean;
  steps: PlanStep[];
}

export function planCueRequest(query: string): CuePlan {
  const normalizedQuery = query.toLowerCase();
  if (isProductionBreakage(normalizedQuery)) {
    return {
      intent: "production_breakage",
      isComplex: true,
      steps: doneSteps([
        "Understand the incident and define the decision that needs to be made",
        "Search connected workspace sources for symptoms and ownership",
        "Compare the implementation, product specification, and release timeline",
        "Measure user impact and determine launch readiness",
        "Prepare a proposed team update for approval",
      ]),
    };
  }

  if (isGtmConfusion(normalizedQuery)) {
    return {
      intent: "gtm_confusion",
      isComplex: true,
      steps: doneSteps([
        "Clarify the public question and the decision GTM needs to make",
        "Search external context and connected workspace sources",
        "Compare public expectations with documented product behavior",
        "Prepare recommended public language for approval",
      ]),
    };
  }

  if (["h0", "launch", "ready", "readiness", "aurora", "blocker"].some((keyword) => normalizedQuery.includes(keyword))) {
    return {
      intent: "launch_readiness",
      isComplex: true,
      steps: doneSteps([
        "Classify launch-readiness question",
        "Collect connected launch evidence",
        "Evaluate blockers and missing evidence",
        "Draft approval-gated next actions",
      ]),
    };
  }

  return {
    intent: "general",
    isComplex: false,
    steps: [],
  };
}

function isProductionBreakage(query: string): boolean {
  const breakageWords = ["production", "breaking", "broken", "bug", "issue", "root cause", "impact", "owner", "slack ping", "blocking", "blocked", "stuck"];
  const inviteWords = ["invite", "workspace", "h0", "aurora", "code", "pr #482", "workspaceid", "workspaceslug"];
  return breakageWords.some((keyword) => query.includes(keyword)) && inviteWords.some((keyword) => query.includes(keyword));
}

function isGtmConfusion(query: string): boolean {
  return (
    ["confused", "confusion", "public", "say publicly", "messaging", "copy", "launch post", "gtm"].some((keyword) =>
      query.includes(keyword),
    ) && ["launch", "invite", "onboarding", "team", "beta"].some((keyword) => query.includes(keyword))
  );
}

function doneSteps(titles: string[]): PlanStep[] {
  return titles.map((title, index) => ({
    id: `plan_${index + 1}`,
    title,
    status: "done",
  }));
}
