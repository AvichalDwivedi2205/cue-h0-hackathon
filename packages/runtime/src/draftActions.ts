import type { ApprovalRecord, SuggestedAction } from "@cue-h0/types";
import type { DemoIntent } from "./planner.js";

export interface DraftActionBundle {
  actions: SuggestedAction[];
  draft: string;
}

export function buildDemoDraftActions(intent: DemoIntent): DraftActionBundle {
  if (intent === "gtm_confusion") {
    return {
      draft:
        "Public launch copy draft: Team invites take you straight into the workspace you were invited to. If setup looks empty during beta, ping us and we will fix your workspace before launch. We are tightening the Aurora invite path now.",
      actions: [
        {
          id: "action_approve_launch_invite_copy",
          label: "Approve public invite copy",
          requiresApproval: true,
          approvalId: "approval_launch_invite_copy",
        },
        {
          id: "action_move_mkt_7",
          label: "Move MKT-7 into launch work",
          requiresApproval: true,
        },
      ],
    };
  }

  return {
    draft:
      "Slack draft for #launch: Sam owns H0-19. Beta users are accepting invites but landing in an empty workspace after the Aurora workspace migration. Evidence points to stale workspaceSlug lookup; PR #482 switches invite acceptance to workspaceId. Dana owns H0-22 verification. PostHog shows beta invite-to-workspace conversion dropped from 82% to 41%, so H0 stays blocked until verification passes.",
    actions: [
      {
        id: "action_open_h0_22",
        label: "Open H0-22 verification",
        requiresApproval: false,
      },
      {
        id: "action_approve_h0_invite_update",
        label: "Approve Slack ping",
        requiresApproval: true,
        approvalId: "approval_h0_invite_blocker_update",
      },
      {
        id: "action_watch_beta_invites",
        label: "Watch beta invite funnel",
        requiresApproval: true,
      },
    ],
  };
}

export function approvalDraftFromSeed(approval: ApprovalRecord | undefined, fallback: string): string {
  const draft = typeof approval?.payload.draft === "string" ? approval.payload.draft : undefined;
  return draft ?? fallback;
}
