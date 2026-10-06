import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { executeWorkflow } from "@/lib/automation/executor";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await db.automationWorkflow.findUnique({ where: { id: params.id } });
  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  const workspace = await db.workspace.findFirst({
    where: {
      id: workflow.workspaceId,
      OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id, role: { in: ["OWNER","ADMIN","EDITOR"] } } } }],
    },
  });
  if (!workspace && !session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  try {
    return NextResponse.json(await executeWorkflow(params.id, body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Workflow failed" }, { status: 500 });
  }
}
