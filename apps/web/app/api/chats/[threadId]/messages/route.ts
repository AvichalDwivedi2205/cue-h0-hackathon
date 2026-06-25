import { NextResponse } from "next/server";
import { answerStatusToThreadStatus, generateCueResponse } from "@cue-h0/runtime";
import { getReadyWorkspace } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await context.params;
  const body = (await request.json()) as { message?: string };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const { repository, workspace, workspaceSlug } = await getReadyWorkspace();
  const assistantMessage = await generateCueResponse({
    repository,
    workspaceId: workspace.id,
    query: message,
  });
  const thread = await repository.appendChatExchange({
    threadId,
    status: answerStatusToThreadStatus(assistantMessage),
    userMessage: message,
    assistantMessage,
  });
  const snapshot = await repository.getHomeSnapshot(workspaceSlug);

  return NextResponse.json({ thread, snapshot });
}
