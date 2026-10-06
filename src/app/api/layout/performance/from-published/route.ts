import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { LayoutScoreFeatures } from "@/lib/layout/learning";
import { recordLayoutFeedback } from "@/server/layout-learning";

function parseLearning(layout: Prisma.JsonValue | null) {
  if (!layout || typeof layout !== "object" || Array.isArray(layout)) return null;
  const learning = (layout as Record<string, unknown>).learning;
  if (!learning || typeof learning !== "object" || Array.isArray(learning)) {
    return null;
  }
  const value = learning as Record<string, unknown>;
  const score = value.score;
  if (!score || typeof score !== "object" || Array.isArray(score)) return null;
  return {
    candidateId:
      typeof value.candidateId === "string" ? value.candidateId : undefined,
    target: typeof value.target === "string" ? value.target : undefined,
    audience: typeof value.audience === "string" ? value.audience : undefined,
    industry: typeof value.industry === "string" ? value.industry : undefined,
    score: score as unknown as LayoutScoreFeatures,
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { publishedId?: string };
  if (!body.publishedId) {
    return NextResponse.json(
      { error: "publishedId is required" },
      { status: 400 },
    );
  }

  const published = await db.publishedArtifact.findUnique({
    where: { id: body.publishedId },
  });
  if (!published) {
    return NextResponse.json(
      { error: "Published artifact not found" },
      { status: 404 },
    );
  }

  const artifact = await db.artifact.findUnique({
    where: { id: published.artifactId },
    include: { base: true, workspace: { include: { members: true } } },
  });
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const membership = artifact.workspace?.members.find(
    (member) => member.userId === session.user.id,
  );
  const allowed =
    artifact.base.userId === session.user.id ||
    session.user.isAdmin ||
    Boolean(
      membership &&
        ["OWNER", "ADMIN", "EDITOR"].includes(membership.role),
    );

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const learning = parseLearning(artifact.layout);
  if (!learning?.candidateId) {
    return NextResponse.json(
      { error: "Artifact has no persisted layout-learning candidate" },
      { status: 422 },
    );
  }

  const events = await db.engagementEvent.findMany({
    where: { publishedId: body.publishedId },
    select: { event: true, durationMs: true },
  });

  const views = events.filter((event) => event.event === "view").length;
  const completions = events.filter(
    (event) => event.event === "complete",
  ).length;
  const interactions = events.filter((event) =>
    [
      "element-click",
      "link-click",
      "form-submit",
      "question",
      "download",
      "share",
    ].includes(event.event),
  ).length;
  const conversions = events.filter(
    (event) => event.event === "form-submit",
  ).length;
  const totalDurationMs = events.reduce(
    (sum, event) => sum + Math.max(0, event.durationMs ?? 0),
    0,
  );

  const completionRate = views ? Math.min(1, completions / views) : 0;
  const interactionRate = views ? Math.min(1, interactions / views) : 0;
  const conversionRate = views ? Math.min(1, conversions / views) : 0;
  const performanceScore =
    completionRate * 0.5 + interactionRate * 0.25 + conversionRate * 0.25;

  const existingAggregate = await db.layoutPerformanceAggregate.findFirst({
    where: {
      publishedId: published.id,
      candidateId: learning.candidateId,
    },
  });

  const unchanged =
    existingAggregate?.views === views &&
    existingAggregate.completions === completions &&
    existingAggregate.interactions === interactions &&
    existingAggregate.conversions === conversions &&
    Number(existingAggregate.totalDurationMs) === totalDurationMs;

  const aggregate = existingAggregate
    ? await db.layoutPerformanceAggregate.update({
        where: { id: existingAggregate.id },
        data: {
          views,
          completions,
          totalDurationMs: BigInt(totalDurationMs),
          interactions,
          conversions,
          performanceScore,
        },
      })
    : await db.layoutPerformanceAggregate.create({
        data: {
          publishedId: published.id,
          workspaceId: artifact.workspaceId,
          artifactId: artifact.id,
          candidateId: learning.candidateId,
          target: learning.target,
          audience: learning.audience,
          views,
          completions,
          totalDurationMs: BigInt(totalDurationMs),
          interactions,
          conversions,
          performanceScore,
        },
      });

  if (unchanged) {
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
        skipped: true,
        reason: "No new engagement since the previous sync",
      },
    });
  }

  const feedback = await recordLayoutFeedback({
    context: {
      userId: session.user.id,
      workspaceId: artifact.workspaceId ?? undefined,
      industry: learning.industry,
      audience: learning.audience,
      target: learning.target,
    },
    artifactId: artifact.id,
    candidateId: learning.candidateId,
    kind: "viewer-performance",
    scoreFeatures: learning.score,
    completionRate,
    interactionRate,
    conversionRate,
    extraContext: {
      publishedId: published.id,
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
