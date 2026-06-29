import type { ConnectorAccountSummary, WorkspaceSource } from "@cue-h0/types";

type Env = Record<string, string | undefined>;

interface ConnectorCatalogItem {
  source: WorkspaceSource;
  label: string;
  description: string;
  integrationMode: NonNullable<ConnectorAccountSummary["integrationMode"]>;
  maturity: NonNullable<ConnectorAccountSummary["maturity"]>;
  requiredEnv: string[];
}

const catalog: ConnectorCatalogItem[] = [
  {
    source: "slack",
    label: "Slack",
    description: "Decisions, commitments, owners, follow-ups, and approval surface.",
    integrationMode: "cue_adapter",
    maturity: "stable",
    requiredEnv: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_APP_TOKEN"],
  },
  {
    source: "github",
    label: "GitHub",
    description: "Pull requests, checks, issues, releases, and implementation truth.",
    integrationMode: "cue_adapter",
    maturity: "stable",
    requiredEnv: ["GITHUB_TOKEN"],
  },
  {
    source: "linear",
    label: "Linear",
    description: "Issue, project, cycle, owner, and launch-blocker context.",
    integrationMode: "hosted_mcp",
    maturity: "stable",
    requiredEnv: ["LINEAR_API_KEY", "LINEAR_TEAM_ID"],
  },
  {
    source: "notion",
    label: "Notion",
    description: "Product specifications, launch plans, decisions, and documentation.",
    integrationMode: "hosted_mcp",
    maturity: "stable",
    requiredEnv: ["NOTION_TOKEN"],
  },
  {
    source: "posthog",
    label: "PostHog",
    description: "Product analytics, funnels, experiments, feature flags, and errors.",
    integrationMode: "hosted_mcp",
    maturity: "stable",
    requiredEnv: ["POSTHOG_API_KEY"],
  },
  {
    source: "exa",
    label: "Exa",
    description: "Live public-web search for launch, customer, and market context.",
    integrationMode: "cue_adapter",
    maturity: "stable",
    requiredEnv: ["EXA_API_KEY"],
  },
  {
    source: "vercel",
    label: "Vercel",
    description: "Preview, production deploy, and release-health context.",
    integrationMode: "cue_adapter",
    maturity: "stable",
    requiredEnv: ["VERCEL_TOKEN", "VERCEL_PROJECT_ID"],
  },
  {
    source: "meet",
    label: "Meet",
    description: "Calendar and meeting-artifact context through Google Workspace.",
    integrationMode: "hosted_mcp",
    maturity: "preview",
    requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  ...([
    ["sentry", "Sentry", "Production errors and release health."],
    ["atlassian", "Atlassian", "Jira, Confluence, and Compass context."],
    ["figma", "Figma + FigJam", "Design readiness and product artifacts."],
    ["miro", "Miro", "Planning boards, workshops, journeys, and diagrams."],
    ["google-workspace", "Google Workspace", "Drive, Docs, and meeting artifacts."],
    ["gitbook", "GitBook", "Published product and technical documentation."],
  ] as const).map(([source, label, description]) => ({
    source: source as WorkspaceSource,
    label,
    description,
    integrationMode: "hosted_mcp" as const,
    maturity: "preview" as const,
    requiredEnv: [],
  })),
];

export function buildConnectorSummaries(env: Env = process.env): ConnectorAccountSummary[] {
  return catalog.map((connector) => {
    const runtime = runtimeStatus(connector, env);
    return {
      id: `connector_${connector.source.replaceAll("-", "_")}`,
      source: connector.source,
      label: connector.label,
      description: connector.description,
      integrationMode: connector.integrationMode,
      maturity: connector.maturity,
      status: runtime.status,
      statusDetail: runtime.detail,
    };
  });
}

export function mergeConnectorSummaries(_storedConnectors: ConnectorAccountSummary[]): ConnectorAccountSummary[] {
  return buildConnectorSummaries();
}

function runtimeStatus(connector: ConnectorCatalogItem, env: Env): { status: ConnectorAccountSummary["status"]; detail: string } {
  if (env.CUE_DEMO_CONNECTORS_CONNECTED === "true" && ["slack", "github", "linear", "notion", "posthog", "exa", "vercel"].includes(connector.source)) {
    return {
      status: "connected",
      detail: `${connector.label} is connected and ready.`,
    };
  }

  if (connector.maturity === "preview" && connector.requiredEnv.length === 0) {
    return {
      status: "disabled",
      detail: "Available to connect.",
    };
  }

  if (connector.source === "github" && (env.GITHUB_TOKEN || (env.GITHUB_APP_ID && env.GITHUB_PRIVATE_KEY))) {
    return { status: "connected", detail: "GitHub credentials are configured." };
  }

  const missing = connector.requiredEnv.filter((key) => !env[key]);
  if (connector.source === "slack" && env.SLACK_SOCKET_MODE === "false") {
    const httpMissing = missing.filter((key) => key !== "SLACK_APP_TOKEN");
    return httpMissing.length === 0
      ? { status: "connected", detail: "Slack Bolt HTTP credentials are configured." }
      : { status: "needs_attention", detail: `Set ${httpMissing.join(", ")} to enable Slack.` };
  }

  if (missing.length === 0) {
    return { status: "connected", detail: `${connector.label} credentials are configured.` };
  }

  return {
    status: "needs_attention",
    detail: `Set ${missing.join(", ")} to enable ${connector.label}.`,
  };
}
