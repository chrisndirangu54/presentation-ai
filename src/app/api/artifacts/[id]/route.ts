import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

type AccessMode = "read" | "write";

async function loadAuthorized(
  id: string,
  userId: string,
  isAdmin: boolean,
  mode: AccessMode,
) {
  const artifact = await db.artifact.findUnique({
    where: { id },
    include: { base: true, workspace: { include: { members: true } } },
  });
  if (!artifact) return null;

  if (artifact.base.userId === userId || isAdmin) return artifact;

  const membership = artifact.workspace?.members.find(
    (member) => member.userId === userId,
  );
  if (!membership) return undefined;

  const canRead = ["OWNER", "ADMIN", "EDITOR", "COMMENTER", "VIEWER"].includes(
    membership.role,
  );
  const canWrite = ["OWNER", "ADMIN", "EDITOR"].includes(membership.role);

  return mode === "write"
    ? canWrite
      ? artifact
      : undefined
    : canRead
      ? artifact
      : undefined;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artifact = await loadAuthorized(
    params.id,
    session.user.id,
    session.user.isAdmin,
    "read",
  );
  if (artifact === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!artifact) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ artifact });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artifact = await loadAuthorized(
    params.id,
    session.user.id,
    session.user.isAdmin,
    "write",
  );
  if (artifact === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!artifact) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    content?: unknown;
    layout?: unknown;
    style?: unknown;
  };

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
