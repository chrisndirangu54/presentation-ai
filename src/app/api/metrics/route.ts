import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { validateMetricDefinition, type MetricDefinitionInput } from "@/lib/data/metric-layer";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as MetricDefinitionInput & {
    workspaceId?: string;
    authoritative?: boolean;
    initialValue?: number;
    observedAt?: string;
  };
  if (!body.workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });

  const validation = validateMetricDefinition(body);
  if (!validation.valid) return NextResponse.json({ error: "Invalid metric", issues: validation.issues }, { status: 422 });

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

  const created = await db.$transaction(async (tx) => {
    const semantic = await tx.semanticNode.create({
      data: {
        workspaceId: body.workspaceId,
        kind: "METRIC",
        key: body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        label: body.name.trim(),
        unit: body.unit,
        value: body.initialValue !== undefined ? (body.initialValue as Prisma.InputJsonValue) : undefined,
      },
    });

    const metric = await tx.metricDefinition.create({
      data: {
        semanticId: semantic.id,
        workspaceId: body.workspaceId!,
        name: body.name.trim(),
        description: body.description,
        formula: body.formula,
        aggregation: body.aggregation,
        unit: body.unit,
        dimensions: body.dimensions ?? [],
        authoritative: body.authoritative ?? false,
      },
    });

    if (body.initialValue !== undefined) {
      await tx.metricSnapshot.create({
        data: {
          metricId: metric.id,
          value: body.initialValue,
          freshness: "FRESH",
          observedAt: body.observedAt ? new Date(body.observedAt) : new Date(),
        },
      });
    }

    return { semantic, metric };
  });

  return NextResponse.json(created, { status: 201 });
}
