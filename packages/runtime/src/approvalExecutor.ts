import type { ApprovalRecord } from "@cue-h0/types";

export interface ApprovalExecutionResult {
  status: "executed" | "skipped" | "failed";
  message: string;
  url?: string;
}

export async function executeApprovedAction(approval: ApprovalRecord): Promise<ApprovalExecutionResult> {
  if (approval.status !== "approved") {
    return { status: "skipped", message: "Approval is not approved." };
  }

  if (approval.actionType === "slack_update") {
    return postSlackUpdate(approval);
  }
  if (approval.actionType === "linear_ticket") {
    return createLinearIssue(approval);
  }

  return { status: "skipped", message: `${approval.actionType} has no live H0 executor.` };
}

async function postSlackUpdate(approval: ApprovalRecord): Promise<ApprovalExecutionResult> {
  const token = process.env.SLACK_BOT_TOKEN;
  const payloadChannel = readString(approval.payload.channel);
  const channel = process.env.SLACK_LAUNCH_CHANNEL_ID ?? (payloadChannel?.startsWith("#") ? undefined : payloadChannel);
  const text = readString(approval.payload.draft) ?? approval.description;
  if (!token || !channel) {
    if (isDemoSafeMode()) {
      return {
        status: "executed",
        message: `Demo approval captured for ${payloadChannel ?? "#launch"}. No live Slack post was sent.`,
      };
    }
    return { status: "skipped", message: "Set SLACK_BOT_TOKEN and SLACK_LAUNCH_CHANNEL_ID to post approved Slack updates." };
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel, text }),
  });
  const body = (await response.json()) as { ok?: boolean; error?: string; channel?: string; ts?: string };
  if (!response.ok || !body.ok) {
    return { status: "failed", message: `Slack post failed: ${body.error ?? response.statusText}` };
  }

  return {
    status: "executed",
    message: "Posted the approved update to Slack.",
    url: body.channel && body.ts ? `slack://${body.channel}/${body.ts}` : undefined,
  };
}

async function createLinearIssue(approval: ApprovalRecord): Promise<ApprovalExecutionResult> {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = readString(approval.payload.teamId) ?? process.env.LINEAR_TEAM_ID;
  if (!apiKey || !teamId) {
    if (isDemoSafeMode()) {
      return {
        status: "executed",
        message: "Demo approval captured. No live Linear issue was created.",
      };
    }
    return { status: "skipped", message: "Set LINEAR_API_KEY and LINEAR_TEAM_ID to create approved Linear issues." };
  }

  const title = readString(approval.payload.title) ?? approval.title;
  const description = readString(approval.payload.description) ?? approval.description;
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { identifier url }
        }
      }`,
      variables: { input: { teamId, title, description } },
    }),
  });
  const body = (await response.json()) as {
    data?: { issueCreate?: { success?: boolean; issue?: { identifier?: string; url?: string } } };
    errors?: Array<{ message?: string }>;
  };
  if (!response.ok || body.errors?.length || !body.data?.issueCreate?.success) {
    return { status: "failed", message: `Linear issue create failed: ${body.errors?.[0]?.message ?? response.statusText}` };
  }

  return {
    status: "executed",
    message: `Created ${body.data.issueCreate.issue?.identifier ?? "a Linear issue"}.`,
    url: body.data.issueCreate.issue?.url,
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isDemoSafeMode(): boolean {
  return process.env.CUE_DEMO_MODE === "hybrid" || process.env.CUE_DEMO_CONNECTORS_CONNECTED === "true";
}
