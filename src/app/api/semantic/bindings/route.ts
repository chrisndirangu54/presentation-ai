import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    artifactId?: string;
    semanticId?: string;
    elementId?: string;
    property?: string;
    transform?: Record<string, unknown>;
    locked?: boolean;
  };
  if (!body.artifactId || !body.semanticId || !body.elementId || !body.property) {
    return NextResponse.json({ error: "artifactId, semanticId, elementId and property are required" }, { status: 400 });
  }

  const artifact = await db.artifact.findUnique({
    where: { id: body.artifactId },
    include: { base: true, workspace: { include: { members: true } } },
  });
  if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });

  const membership = artifact.workspace?.members.find((member) => member.userId === session.user.id);
  const canEdit =
    artifact.base.userId === session.user.id ||
    session.user.isAdmin ||
    Boolean(membership && ["OWNER","ADMIN","EDITOR"].includes(membership.role));
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const binding = await db.artifactBinding.upsert({
    where: {
      artifactId_elementId_property: {
        artifactId: body.artifactId,
        elementId: body.elementId,
        property: body.property,
      },
    },
    create: {
      artifactId: body.artifactId,
      semanticId: body.semanticId,
      elementId: body.elementId,
      property: body.property,
      transform: body.transform as Prisma.InputJsonValue | undefined,
      locked: body.locked ?? false,
    },
    update: {
      semanticId: body.semanticId,
      transform: body.transform as Prisma.InputJsonValue | undefined,
      locked: body.locked ?? false,
    },
  });

  return NextResponse.json({ binding });
}
