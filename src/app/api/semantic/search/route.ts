import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const q = url.searchParams.get("q")?.trim();
  if (!workspaceId || !q) {
    return NextResponse.json({ error: "workspaceId and q are required" }, { status: 400 });
  }

  const workspace = await db.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });
  if (!workspace && !session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const nodes = await db.semanticNode.findMany({
    where: {
      workspaceId,
      OR: [
        { label: { contains: q, mode: "insensitive" } },
        { key: { contains: q, mode: "insensitive" } },
        { text: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ nodes });
}
