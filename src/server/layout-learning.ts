import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import {
  blendPreferenceWeights,
  defaultLayoutWeights,
  learnWeightsFromFeedback,
  normalizeWeights,
  type LayoutFeatureWeights,
  type LayoutPreferenceContext,
  type LayoutScoreFeatures,
} from "@/lib/layout/learning";
import {
  feedbackReward,
  type LayoutFeedbackKind,
} from "@/lib/layout/rewards";

function asWeights(value: Prisma.JsonValue | null): LayoutFeatureWeights {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultLayoutWeights;
  }
  const object = value as Record<string, unknown>;
  return normalizeWeights({
    relationship:
      typeof object.relationship === "number"
        ? object.relationship
        : undefined,
    whitespace:
      typeof object.whitespace === "number"
        ? object.whitespace
        : undefined,
    balance:
      typeof object.balance === "number" ? object.balance : undefined,
    typography:
      typeof object.typography === "number" ? object.typography : undefined,
    imagery: typeof object.imagery === "number" ? object.imagery : undefined,
    charts: typeof object.charts === "number" ? object.charts : undefined,
  });
}

function prismaFeedbackType(kind: LayoutFeedbackKind) {
  switch (kind) {
    case "candidate-selected":
      return "CANDIDATE_SELECTED" as const;
    case "candidate-rejected":
      return "CANDIDATE_REJECTED" as const;
    case "post-layout-edit":
      return "POST_LAYOUT_EDIT" as const;
    case "published":
      return "PUBLISHED" as const;
    case "viewer-performance":
      return "VIEWER_PERFORMANCE" as const;
  }
}

function profileScopes(context: LayoutPreferenceContext) {
  const target = context.target ?? "*";
  const scopes: Array<{
    scope:
      | "USER"
      | "WORKSPACE"
      | "INDUSTRY"
      | "AUDIENCE"
      | "TARGET";
    scopeKey: string;
    target: string;
  }> = [];

  if (context.userId) {
    scopes.push({ scope: "USER", scopeKey: context.userId, target });
  }
  if (context.workspaceId) {
    scopes.push({
      scope: "WORKSPACE",
      scopeKey: context.workspaceId,
      target,
    });
  }
  if (context.industry) {
    scopes.push({
      scope: "INDUSTRY",
      scopeKey: context.industry.trim().toLowerCase(),
      target,
    });
  }
  if (context.audience) {
    scopes.push({
      scope: "AUDIENCE",
      scopeKey: context.audience.trim().toLowerCase(),
      target,
    });
  }
  if (context.target) {
    scopes.push({
      scope: "TARGET",
      scopeKey: context.target,
      target: context.target,
    });
  }

  return scopes;
}

export async function resolveLayoutPreferences(
  context: LayoutPreferenceContext & { isAdmin?: boolean },
): Promise<LayoutFeatureWeights> {
  let workspaceAllowed = false;
  if (context.workspaceId) {
    const workspace = await db.workspace.findFirst({
      where: {
        id: context.workspaceId,
        OR: [
          ...(context.userId ? [{ ownerId: context.userId }] : []),
          ...(context.userId
            ? [
                {
                  members: {
                    some: { userId: context.userId },
                  },
                },
              ]
            : []),
        ],
      },
      select: { id: true },
    });
    workspaceAllowed = Boolean(workspace) || Boolean(context.isAdmin);
  }

  const safeContext: LayoutPreferenceContext = {
    userId: context.userId,
    workspaceId: workspaceAllowed ? context.workspaceId : undefined,
    industry: context.industry,
    audience: context.audience,
    target: context.target,
  };

  const scopes = profileScopes(safeContext);
  if (!scopes.length) return defaultLayoutWeights;

  const profiles = await db.layoutPreferenceProfile.findMany({
    where: {
      OR: scopes.map((scope) => ({
        scope: scope.scope,
        scopeKey: scope.scopeKey,
        target: scope.target,
      })),
    },
  });

  return blendPreferenceWeights(
    profiles.map((profile) => ({
      weights: asWeights(profile.weights),
      confidence: profile.confidence,
    })),
  );
}

export async function recordLayoutFeedback(input: {
  context: LayoutPreferenceContext;
  artifactId?: string;
  candidateId?: string;
  kind: LayoutFeedbackKind;
  scoreFeatures: LayoutScoreFeatures;
  editDelta?: unknown;
  extraContext?: unknown;
  editMagnitude?: number;
  completionRate?: number;
  interactionRate?: number;
  conversionRate?: number;
}) {
  const reward = feedbackReward({
    kind: input.kind,
    editMagnitude: input.editMagnitude,
    completionRate: input.completionRate,
    interactionRate: input.interactionRate,
    conversionRate: input.conversionRate,
  });

  const event = await db.layoutFeedbackEvent.create({
    data: {
      userId: input.context.userId,
      workspaceId: input.context.workspaceId,
      artifactId: input.artifactId,
      candidateId: input.candidateId,
      target: input.context.target,
      industry: input.context.industry,
      audience: input.context.audience,
      feedbackType: prismaFeedbackType(input.kind),
      scoreFeatures: input.scoreFeatures as unknown as Prisma.InputJsonValue,
      context: input.extraContext as Prisma.InputJsonValue | undefined,
      editDelta: input.editDelta as Prisma.InputJsonValue | undefined,
      reward,
    },
  });

  const scopes = profileScopes(input.context);
  const updates: Array<{
    scope: string;
    scopeKey: string;
    target: string;
    weights: LayoutFeatureWeights;
    confidence: number;
    samples: number;
  }> = [];

  for (const scope of scopes) {
    const existing = await db.layoutPreferenceProfile.findUnique({
      where: {
        scope_scopeKey_target: {
          scope: scope.scope,
          scopeKey: scope.scopeKey,
          target: scope.target,
        },
      },
    });

    const current = existing
      ? asWeights(existing.weights)
      : defaultLayoutWeights;
    const next = learnWeightsFromFeedback(
      current,
      input.scoreFeatures,
      reward,
      existing ? Math.max(0.01, 0.05 / Math.sqrt(existing.samples + 1)) : 0.05,
    );
    const samples = (existing?.samples ?? 0) + 1;
    const confidence = Math.min(1, Math.log2(samples + 1) / 8);

    const profile = await db.layoutPreferenceProfile.upsert({
      where: {
        scope_scopeKey_target: {
          scope: scope.scope,
          scopeKey: scope.scopeKey,
          target: scope.target,
        },
      },
      create: {
        scope: scope.scope,
        scopeKey: scope.scopeKey,
        target: scope.target,
        weights: next as unknown as Prisma.InputJsonValue,
        samples,
        confidence,
        lastLearnedAt: new Date(),
      },
      update: {
        weights: next as unknown as Prisma.InputJsonValue,
        samples,
        confidence,
        lastLearnedAt: new Date(),
      },
    });

    await db.layoutLearningRun.create({
      data: {
        workspaceId: input.context.workspaceId,
        scope: scope.scope,
        scopeKey: scope.scopeKey,
        target: scope.target,
        sampleCount: samples,
        oldWeights: current as unknown as Prisma.InputJsonValue,
        newWeights: next as unknown as Prisma.InputJsonValue,
        metrics: {
          reward,
          feedbackType: input.kind,
          eventId: event.id,
        } as Prisma.InputJsonValue,
      },
    });

    updates.push({
      scope: profile.scope,
      scopeKey: profile.scopeKey,
      target: profile.target ?? "*",
      weights: next,
      confidence,
      samples,
    });
  }

  return { event, reward, updates };
}
