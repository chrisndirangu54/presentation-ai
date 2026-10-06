import type { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    artifactId?: string;
    target?: string;
    layout?: unknown;
    quality?: unknown;
    source?: unknown;
  };

  if (!body.artifactId || !body.target || !body.layout) {
    return NextResponse.json(
      { error: "artifactId, target and layout are required" },
      { status: 400 },
    );
  }

  const artifact = await db.artifact.findUnique({
    where: { id: body.artifactId },
    include: { base: true, workspace: { include: { members: true } } },
  });
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const membership = artifact.workspace?.members.find(
    (member) => member.userId === session.user.id,
  );
  const canEdit =
    artifact.base.userId === session.user.id ||
    session.user.isAdmin ||
    Boolean(
      membership &&
        ["OWNER", "ADMIN", "EDITOR"].includes(membership.role),
    );
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sourceHash = createHash("sha256")
    .update(JSON.stringify(body.source ?? artifact.content))
    .digest("hex");

  const snapshot = await db.layoutSnapshot.create({
    data: {
      artifactId: body.artifactId,
      target: body.target,
      layout: body.layout as Prisma.InputJsonValue,
      quality: body.quality as Prisma.InputJsonValue | undefined,
      sourceHash,
    },
  });

  return NextResponse.json({ snapshot }, { status: 201 });
}
