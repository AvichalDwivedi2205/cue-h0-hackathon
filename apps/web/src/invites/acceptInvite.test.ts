import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptInvite, type InviteAcceptanceStore } from "./acceptInvite.js";

test("acceptInvite joins by workspaceId when workspaceSlug is stale", async () => {
  const joins: Array<{ userId: string; workspaceId: string; inviteId: string }> = [];
  const store: InviteAcceptanceStore = {
    async getInviteById() {
      return {
        id: "invite_beta_001",
        email: "founder@example.com",
        workspaceId: "workspace_correct_aurora",
        workspaceSlug: "stale-empty-workspace",
      };
    },
    async getWorkspaceById(workspaceId) {
      return {
        id: workspaceId,
        slug: "cue-team",
        name: "Cue Team",
      };
    },
    async addUserToWorkspace(input) {
      joins.push(input);
    },
  };

  const result = await acceptInvite(store, { inviteId: "invite_beta_001", userId: "user_beta" });

  assert.equal(result.workspace.id, "workspace_correct_aurora");
  assert.deepEqual(joins, [
    {
      userId: "user_beta",
      workspaceId: "workspace_correct_aurora",
      inviteId: "invite_beta_001",
    },
  ]);
});
