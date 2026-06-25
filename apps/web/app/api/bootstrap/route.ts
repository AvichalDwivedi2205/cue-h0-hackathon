import { NextResponse } from "next/server";
import { getReadyWorkspace } from "@/lib/server";

export const runtime = "nodejs";

export async function GET() {
  const { repository, workspaceSlug, workspace } = await getReadyWorkspace();
  const [snapshot, threadSummaries] = await Promise.all([
    repository.getHomeSnapshot(workspaceSlug),
    repository.listChatThreads(workspace.id),
  ]);
  const threads = (
    await Promise.all(threadSummaries.map((thread) => repository.getChatThread(thread.id)))
  ).filter((thread) => Boolean(thread));

  return NextResponse.json({ snapshot, threads });
}
