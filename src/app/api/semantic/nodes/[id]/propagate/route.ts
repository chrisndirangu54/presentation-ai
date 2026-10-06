import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

function renderedValue(node: {
  value: Prisma.JsonValue | null;
  text: string | null;
  unit: string | null;
}) {
  const raw = node.value ?? node.text ?? "";
  if (
    node.unit &&
    (typeof raw === "string" || typeof raw === "number")
  ) {
    return `${String(raw)} ${node.unit}`;
  }
  return raw;
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const node = await db.semanticNode.findUnique({
    where: { id: params.id },
    include: { bindings: true },
  });
  if (!node) {
    return NextResponse.json({ error: "Semantic node not found" }, { status: 404 });
  }

  if (node.workspaceId) {
    const workspace = await db.workspace.findFirst({
      where: {
        id: node.workspaceId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "ADMIN", "EDITOR"] },
              },
            },
          },
        ],
      },
    });
    if (!workspace && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const value = renderedValue(node);
  const affected: Array<{ artifactId: string; elementId: string; property: string }> = [];
  const skippedLocked: string[] = [];

  await db.$transaction(async (tx) => {
    for (const binding of node.bindings) {
      if (binding.locked) {
        skippedLocked.push(binding.id);
        continue;
      }

      const artifact = await tx.artifact.findUnique({
        where: { id: binding.artifactId },
      });
      if (!artifact) continue;

      const content = (artifact.content ?? {}) as Record<string, unknown>;
      const blocks = Array.isArray(content.blocks)
        ? (content.blocks as Array<Record<string, unknown>>)
        : [];

      const nextBlocks = blocks.map((block) => {
        if (String(block.id ?? "") !== binding.elementId) return block;
        return {
          ...block,
          [binding.property]: value,
          semanticVersion: node.version,
        };
      });

      await tx.artifact.update({
        where: { id: artifact.id },
        data: {
          content: {
            ...content,
            blocks: nextBlocks,
          } as Prisma.InputJsonValue,
        },
      });

      await tx.dataLineageRecord.create({
        data: {
          workspaceId: node.workspaceId,
          artifactId: artifact.id,
          elementId: binding.elementId,
          semanticId: node.id,
          sourceType: "semantic-node",
          sourceRef: node.id,
          operation: "propagate-binding",
          transformation: binding.transform as Prisma.InputJsonValue | undefined,
        },
      });

      affected.push({
        artifactId: artifact.id,
        elementId: binding.elementId,
        property: binding.property,
      });
    }
  });

  return NextResponse.json({
    semanticId: node.id,
    semanticVersion: node.version,
    affected,
    skippedLocked,
  });
}
