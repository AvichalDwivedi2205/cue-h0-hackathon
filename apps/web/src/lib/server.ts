import { ensureDemoData, getCueRepository, getDefaultWorkspaceSlug } from "@cue-h0/db";

export async function getReadyCueRepository() {
  const repository = getCueRepository();
  await ensureDemoData(repository, getDefaultWorkspaceSlug());
  return repository;
}

export async function getReadyWorkspace() {
  const repository = await getReadyCueRepository();
  const workspaceSlug = getDefaultWorkspaceSlug();
  const workspace = await repository.getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    throw new Error(`Workspace not found after seed: ${workspaceSlug}`);
  }
  return { repository, workspace, workspaceSlug };
}
