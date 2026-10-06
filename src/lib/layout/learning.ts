export interface LayoutFeatureWeights {
  relationship: number;
  whitespace: number;
  balance: number;
  typography: number;
  imagery: number;
  charts: number;
}

export interface LayoutPreferenceContext {
  userId?: string;
  workspaceId?: string;
  industry?: string;
  audience?: string;
  target?: string;
}

export interface LayoutScoreFeatures {
  relationship: number;
  whitespace: number;
  balance: number;
  typography: number;
  imagery: number;
  charts: number;
  penalties?: number;
}

export const defaultLayoutWeights: LayoutFeatureWeights = {
  relationship: 0.2,
  whitespace: 0.18,
  balance: 0.18,
  typography: 0.16,
  imagery: 0.12,
  charts: 0.16,
};

export function normalizeWeights(
  weights: Partial<LayoutFeatureWeights>,
): LayoutFeatureWeights {
  const merged = { ...defaultLayoutWeights, ...weights };
  const total =
    merged.relationship +
    merged.whitespace +
    merged.balance +
    merged.typography +
    merged.imagery +
    merged.charts;
  if (total <= 0) return defaultLayoutWeights;
  return {
    relationship: merged.relationship / total,
    whitespace: merged.whitespace / total,
    balance: merged.balance / total,
    typography: merged.typography / total,
    imagery: merged.imagery / total,
    charts: merged.charts / total,
  };
}

export function blendPreferenceWeights(
  profiles: Array<{ weights: Partial<LayoutFeatureWeights>; confidence: number }>,
): LayoutFeatureWeights {
  if (!profiles.length) return defaultLayoutWeights;

  const accumulator: LayoutFeatureWeights = {
    relationship: 0,
    whitespace: 0,
    balance: 0,
    typography: 0,
    imagery: 0,
    charts: 0,
  };
  let confidenceTotal = 0;

  for (const profile of profiles) {
    const confidence = Math.max(0.05, Math.min(1, profile.confidence));
    const normalized = normalizeWeights(profile.weights);
    confidenceTotal += confidence;
    accumulator.relationship += normalized.relationship * confidence;
    accumulator.whitespace += normalized.whitespace * confidence;
    accumulator.balance += normalized.balance * confidence;
    accumulator.typography += normalized.typography * confidence;
    accumulator.imagery += normalized.imagery * confidence;
    accumulator.charts += normalized.charts * confidence;
  }

  if (!confidenceTotal) return defaultLayoutWeights;
  return normalizeWeights({
    relationship: accumulator.relationship / confidenceTotal,
    whitespace: accumulator.whitespace / confidenceTotal,
    balance: accumulator.balance / confidenceTotal,
    typography: accumulator.typography / confidenceTotal,
    imagery: accumulator.imagery / confidenceTotal,
    charts: accumulator.charts / confidenceTotal,
  });
}

export function scoreWithLearnedWeights(
  features: LayoutScoreFeatures,
  weights: LayoutFeatureWeights,
) {
  return Math.max(
    0,
    features.relationship * weights.relationship +
      features.whitespace * weights.whitespace +
      features.balance * weights.balance +
      features.typography * weights.typography +
      features.imagery * weights.imagery +
      features.charts * weights.charts -
      (features.penalties ?? 0),
  );
}

export function learnWeightsFromFeedback(
  current: LayoutFeatureWeights,
  features: LayoutScoreFeatures,
  reward: number,
  learningRate = 0.04,
): LayoutFeatureWeights {
  const boundedReward = Math.max(-1, Math.min(1, reward));
  const centered = {
    relationship: features.relationship / 100 - 0.5,
    whitespace: features.whitespace / 100 - 0.5,
    balance: features.balance / 100 - 0.5,
    typography: features.typography / 100 - 0.5,
    imagery: features.imagery / 100 - 0.5,
    charts: features.charts / 100 - 0.5,
  };

  return normalizeWeights({
    relationship:
      current.relationship +
      learningRate * boundedReward * centered.relationship,
    whitespace:
      current.whitespace +
      learningRate * boundedReward * centered.whitespace,
    balance:
      current.balance + learningRate * boundedReward * centered.balance,
    typography:
      current.typography +
      learningRate * boundedReward * centered.typography,
    imagery:
      current.imagery + learningRate * boundedReward * centered.imagery,
    charts:
      current.charts + learningRate * boundedReward * centered.charts,
  });
}
