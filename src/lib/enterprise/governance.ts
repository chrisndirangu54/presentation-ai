export interface EnterprisePolicySet {
  requireSso?: boolean;
  allowedDomains?: string[];
  requireApprovalBeforePublish?: boolean;
  lockBrandTokens?: boolean;
  preventExternalSharing?: boolean;
  maxModelCostUsdPerDay?: number;
  retentionDays?: number;
  dataResidency?: string;
  requireCitationForStatistics?: boolean;
}

export interface GovernanceCheck {
  allowed: boolean;
  reasons: string[];
}

export function evaluateGovernance(
  policy: EnterprisePolicySet,
  context: {
    externalShare?: boolean;
    hasApproval?: boolean;
    statisticalClaimsWithoutCitations?: number;
  },
): GovernanceCheck {
  const reasons: string[] = [];
  if (policy.preventExternalSharing && context.externalShare) reasons.push("external sharing is disabled");
  if (policy.requireApprovalBeforePublish && !context.hasApproval) reasons.push("approval is required before publishing");
  if (policy.requireCitationForStatistics && (context.statisticalClaimsWithoutCitations ?? 0) > 0) reasons.push("statistical claims need citations");
  return { allowed: reasons.length === 0, reasons };
}
