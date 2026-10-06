import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { LayoutScoreFeatures } from "@/lib/layout/learning";
import type { LayoutFeedbackKind } from "@/lib/layout/rewards";
import { recordLayoutFeedback } from "@/server/layout-learning";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    artifactId?: string;
    candidateId?: string;
    target?: string;
    industry?: string;
    audience?: string;
    kind?: LayoutFeedbackKind;
    scoreFeatures?: LayoutScoreFeatures;
    editDelta?: unknown;
    editMagnitude?: number;
    context?: unknown;
  };

  if (!body.kind || !body.scoreFeatures) {
    return NextResponse.json(
      { error: "kind and scoreFeatures are required" },
      { status: 400 },
    );
  }

  if (body.artifactId) {
    const artifact = await db.artifact.findUnique({
      where: { id: body.artifactId },
      include: { base: true, workspace: { include: { members: true } } },
    });
    if (!artifact) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }
    const member = artifact.workspace?.members.find(
      (item) => item.userId === session.user.id,
    );
    const canEdit =
      artifact.base.userId === session.user.id ||
      session.user.isAdmin ||
      Boolean(member && ["OWNER", "ADMIN", "EDITOR"].includes(member.role));
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await recordLayoutFeedback({
    context: {
      userId: session.user.id,
      workspaceId: body.workspaceId,
      industry: body.industry,
      audience: body.audience,
      target: body.target,
    },
    artifactId: body.artifactId,
    candidateId: body.candidateId,
    kind: body.kind,
    scoreFeatures: body.scoreFeatures,
    editDelta: body.editDelta,
    extraContext: body.context,
    editMagnitude: body.editMagnitude,
  });

  return NextResponse.json(result, { status: 201 });
}
