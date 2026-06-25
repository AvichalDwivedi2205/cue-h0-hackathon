import { App } from "@slack/bolt";
import { ensureDemoData, getCueRepository, getDefaultWorkspaceSlug } from "@cue-h0/db";
import { generateCueResponse } from "@cue-h0/runtime";

const slackBotToken = process.env.SLACK_BOT_TOKEN;
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackAppToken = process.env.SLACK_APP_TOKEN;
const socketMode = process.env.SLACK_SOCKET_MODE !== "false";

if (!slackBotToken || !slackSigningSecret || (socketMode && !slackAppToken)) {
  console.log("Slack app not started. Set SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, and SLACK_APP_TOKEN for socket mode.");
} else {
  const repository = getCueRepository();
  await ensureDemoData(repository, getDefaultWorkspaceSlug());
  const workspace = await repository.getWorkspaceBySlug(getDefaultWorkspaceSlug());
  if (!workspace) {
    throw new Error("Demo workspace was not available after seed.");
  }

  const app = new App({
    token: slackBotToken,
    signingSecret: slackSigningSecret,
    socketMode,
    appToken: slackAppToken,
  });

  app.message(async ({ message, say }) => {
    if (!("text" in message) || !message.text?.toLowerCase().includes("cue")) {
      return;
    }
    const answer = await generateCueResponse({
      repository,
      workspaceId: workspace.id,
      query: message.text,
    });
    await say(formatSlackAnswer(answer));
  });

  await app.start(Number(process.env.PORT ?? 3001));
  console.log("Cue H0 Slack bot is running.");
}

function formatSlackAnswer(answer: Awaited<ReturnType<typeof generateCueResponse>>): string {
  if (answer.kind === "text") {
    return answer.text;
  }
  const blockers = answer.blocks.map((block) => `- *${block.title}*: ${block.description}`).join("\n");
  const evidence = answer.citations.map((citation) => `- ${citation.label}: ${citation.excerpt}`).join("\n");
  const actions = answer.actions.map((action) => `- ${action.requiresApproval ? "Approval required: " : ""}${action.label}`).join("\n");
  return [
    `*${answer.verdict}*`,
    answer.summary,
    blockers ? `\n*Blockers / risks*\n${blockers}` : "",
    answer.missingEvidence.length ? `\n*Missing evidence*\n${answer.missingEvidence.map((gap) => `- ${gap}`).join("\n")}` : "",
    evidence ? `\n*Evidence*\n${evidence}` : "",
    actions ? `\n*Suggested actions*\n${actions}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
