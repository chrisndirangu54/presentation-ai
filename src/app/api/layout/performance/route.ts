import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { LayoutScoreFeatures } from "@/lib/layout/learning";
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
    audience?: string;
    industry?: string;
    views?: number;
    completions?: number;
    totalDurationMs?: number;
    interactions?: number;
    conversions?: number;
    scoreFeatures?: LayoutScoreFeatures;
  };

  if (!body.artifactId || !body.candidateId || !body.scoreFeatures) {
    return NextResponse.json(
      { error: "artifactId, candidateId and scoreFeatures are required" },
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

  const member = artifact.workspace?.members.find(
    (item) => item.userId === session.user.id,
  );
  const allowed =
    artifact.base.userId === session.user.id ||
    session.user.isAdmin ||
    Boolean(member && ["OWNER", "ADMIN", "EDITOR"].includes(member.role));
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const views = Math.max(0, body.views ?? 0);
  const completions = Math.max(0, body.completions ?? 0);
  const interactions = Math.max(0, body.interactions ?? 0);
  const conversions = Math.max(0, body.conversions ?? 0);
  const totalDurationMs = Math.max(0, Math.round(body.totalDurationMs ?? 0));
  const completionRate = views ? Math.min(1, completions / views) : 0;
  const interactionRate = views ? Math.min(1, interactions / views) : 0;
  const conversionRate = views ? Math.min(1, conversions / views) : 0;
  const performanceScore =
    completionRate * 0.5 + interactionRate * 0.25 + conversionRate * 0.25;

  const existing = await db.layoutPerformanceAggregate.findFirst({
    where: {
      artifactId: body.artifactId,
      candidateId: body.candidateId,
      target: body.target,
      audience: body.audience,
    },
  });

  const aggregate = existing
    ? await db.layoutPerformanceAggregate.update({
        where: { id: existing.id },
        data: {
          views: { increment: views },
          completions: { increment: completions },
          totalDurationMs: {
            increment: BigInt(totalDurationMs),
          },
          interactions: { increment: interactions },
          conversions: { increment: conversions },
          performanceScore,
        },
      })
    : await db.layoutPerformanceAggregate.create({
        data: {
          workspaceId: body.workspaceId ?? artifact.workspaceId,
          artifactId: body.artifactId,
          candidateId: body.candidateId,
          target: body.target,
          audience: body.audience,
          views,
          completions,
          totalDurationMs: BigInt(totalDurationMs),
          interactions,
          conversions,
          performanceScore,
        },
      });

  const feedback = await recordLayoutFeedback({
    context: {
      userId: session.user.id,
      workspaceId: body.workspaceId ?? artifact.workspaceId ?? undefined,
      industry: body.industry,
      audience: body.audience,
      target: body.target,
    },
    artifactId: body.artifactId,
    candidateId: body.candidateId,
    kind: "viewer-performance",
    scoreFeatures: body.scoreFeatures,
    completionRate,
    interactionRate,
    conversionRate,
    extraContext: {
      views,
      completions,
      interactions,
      conversions,
      totalDurationMs,
    },
  });

  return NextResponse.json({
    aggregate: {
      ...aggregate,
      totalDurationMs: Number(aggregate.totalDurationMs),
    },
    rates: {
      completionRate,
      interactionRate,
      conversionRate,
      performanceScore,
    },
    learning: {
      reward: feedback.reward,
      updatedProfiles: feedback.updates.length,
    },
  });
}
