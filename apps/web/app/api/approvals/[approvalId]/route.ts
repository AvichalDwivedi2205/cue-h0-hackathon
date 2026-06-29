import { NextResponse } from "next/server";
import { executeApprovedAction } from "@cue-h0/runtime";
import { getReadyCueRepository } from "@/lib/server";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ approvalId: string }> }) {
  const { approvalId } = await context.params;
  const body = (await request.json()) as { status?: "approved" | "rejected" };
  if (body.status !== "approved" && body.status !== "rejected") {
    return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
  }

  const repository = await getReadyCueRepository();
  const approval = await repository.resolveApproval(approvalId, body.status);
  if (!approval) {
    return NextResponse.json({ error: "approval not found" }, { status: 404 });
  }

  const execution = body.status === "approved" ? await executeApprovedAction(approval) : undefined;
  return NextResponse.json({ approval, execution });
}
