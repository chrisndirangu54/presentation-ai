import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

async function loadAuthorized(id: string, userId: string, isAdmin: boolean) {
  const artifact = await db.artifact.findUnique({
    where: { id },
    include: { base: true, workspace: { include: { members: true } } },
  });
  if (!artifact) return null;
  const allowed =
    artifact.base.userId === userId ||
    isAdmin ||
    artifact.workspace?.members.some((member) => member.userId === userId);
  return allowed ? artifact : undefined;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const artifact = await loadAuthorized(params.id, session.user.id, session.user.isAdmin);
  if (artifact === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!artifact) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ artifact });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const artifact = await loadAuthorized(params.id, session.user.id, session.user.isAdmin);
  if (artifact === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!artifact) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as { content?: unknown; layout?: unknown; style?: unknown };
  const updated = await db.artifact.update({
    where: { id: params.id },
    data: {
      ...(body.content !== undefined ? { content: body.content as object } : {}),
      ...(body.layout !== undefined ? { layout: body.layout as object } : {}),
      ...(body.style !== undefined ? { style: body.style as object } : {}),
    },
  });
  return NextResponse.json({ artifact: updated });
}
