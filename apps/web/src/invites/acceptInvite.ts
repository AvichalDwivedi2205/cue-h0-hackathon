export interface InviteRecord {
  id: string;
  email: string;
  workspaceId: string;
  workspaceSlug: string;
}

export interface WorkspaceRecord {
  id: string;
  slug: string;
  name: string;
}

export interface InviteAcceptanceStore {
  getInviteById(inviteId: string): Promise<InviteRecord | undefined>;
  getWorkspaceById(workspaceId: string): Promise<WorkspaceRecord | undefined>;
  addUserToWorkspace(input: { userId: string; workspaceId: string; inviteId: string }): Promise<void>;
}

export async function acceptInvite(store: InviteAcceptanceStore, input: { inviteId: string; userId: string }) {
  const invite = await store.getInviteById(input.inviteId);
  if (!invite) {
    throw new Error("Invite not found");
  }

  const workspace = await store.getWorkspaceById(invite.workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  await store.addUserToWorkspace({
    userId: input.userId,
    workspaceId: workspace.id,
    inviteId: invite.id,
  });

  return { workspace };
}
