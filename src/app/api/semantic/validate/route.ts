import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { validateSemanticGraph, type SemanticGraph } from "@/lib/semantic/graph";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { workspaceId?: string; graph?: SemanticGraph };
  if (!body.workspaceId || !body.graph) {
    return NextResponse.json({ error: "workspaceId and graph are required" }, { status: 400 });
  }

  const workspace = await db.workspace.findFirst({
    where: {
      id: body.workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id, role: { in: ["OWNER","ADMIN","EDITOR"] } } } },
      ],
    },
  });
  if (!workspace && !session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const validation = validateSemanticGraph(body.graph);
  return NextResponse.json({ validation }, { status: validation.valid ? 200 : 422 });
}
