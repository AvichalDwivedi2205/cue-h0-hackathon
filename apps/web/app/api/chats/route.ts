import { NextResponse } from "next/server";
import { answerStatusToThreadStatus, generateCueResponse } from "@cue-h0/runtime";
import { getReadyWorkspace } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
  const thread = await repository.createChatThreadWithMessages({
    workspaceId: workspace.id,
    title: clipTitle(message),
    status: answerStatusToThreadStatus(assistantMessage),
    userMessage: message,
    assistantMessage,
  });
  const [snapshot, threadSummaries] = await Promise.all([
    repository.getHomeSnapshot(workspaceSlug),
    repository.listChatThreads(workspace.id),
  ]);
  const threads = (
    await Promise.all(threadSummaries.map((threadSummary) => repository.getChatThread(threadSummary.id)))
  ).filter((candidateThread) => Boolean(candidateThread));

  return NextResponse.json({ thread, threads, snapshot });
}

function clipTitle(message: string): string {
  return message.length > 42 ? `${message.slice(0, 42)}...` : message;
}
