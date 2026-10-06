import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const node = await db.semanticNode.findUnique({ where: { id: params.id } });
  if (!node) return NextResponse.json({ error: "Semantic node not found" }, { status: 404 });

  if (node.workspaceId) {
    const workspace = await db.workspace.findFirst({
      where: {
        id: node.workspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: { in: ["OWNER","ADMIN","EDITOR"] } } } },
        ],
      },
    });
    if (!workspace && !session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    value?: unknown;
    text?: string | null;
    label?: string;
    unit?: string | null;
    metadata?: Record<string, unknown>;
  };

  const updated = await db.semanticNode.update({
    where: { id: params.id },
    data: {
      ...(body.value !== undefined ? { value: body.value as Prisma.InputJsonValue } : {}),
      ...(body.text !== undefined ? { text: body.text } : {}),
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.unit !== undefined ? { unit: body.unit } : {}),
      ...(body.metadata !== undefined ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
      version: { increment: 1 },
    },
  });

  const bindings = await db.artifactBinding.findMany({ where: { semanticId: params.id } });
  return NextResponse.json({
    node: updated,
    affectedBindings: bindings.map((binding) => ({
      artifactId: binding.artifactId,
      elementId: binding.elementId,
      property: binding.property,
      locked: binding.locked,
    })),
  });
}
