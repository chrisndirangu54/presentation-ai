export interface QualityContext {
  title?: string;
  bodyText?: string;
  unresolvedCitations?: number;
  staleSources?: number;
  inconsistentMetrics?: number;
  missingAltText?: number;
  brandViolations?: number;
  contrastViolations?: number;
  restrictedDataExposed?: boolean;
}

export interface QualityGateResult {
  status: "pass" | "warn" | "block";
  score: number;
  findings: Array<{
    category: string;
    severity: "info" | "warning" | "error";
    message: string;
  }>;
}

export function runQualityGate(context: QualityContext): QualityGateResult {
  const findings: QualityGateResult["findings"] = [];
  let score = 100;

  const add = (category: string, severity: "info" | "warning" | "error", message: string, penalty: number) => {
    findings.push({ category, severity, message });
    score -= penalty;
  };

  if ((context.bodyText ?? "").split(/\s+/).filter(Boolean).length > 180) {
    add("readability", "warning", "Content is unusually dense.", 8);
  }
  if ((context.unresolvedCitations ?? 0) > 0) {
    add("evidence", "error", "One or more quantitative/important claims lack validated citations.", 20);
  }
  if ((context.staleSources ?? 0) > 0) {
    add("freshness", "warning", "One or more linked sources are stale.", 10);
  }
  if ((context.inconsistentMetrics ?? 0) > 0) {
    add("consistency", "error", "Conflicting metric values exist across linked artifacts.", 25);
  }
  if ((context.missingAltText ?? 0) > 0) {
    add("accessibility", "warning", "Some visual elements are missing alt text.", 8);
  }
  if ((context.brandViolations ?? 0) > 0) {
    add("brand", "warning", "Brand policy violations remain.", 10);
  }
  if ((context.contrastViolations ?? 0) > 0) {
    add("accessibility", "error", "Contrast issues may prevent accessible publishing.", 15);
  }
  if (context.restrictedDataExposed) {
    add("security", "error", "Restricted content is exposed to a broader audience.", 40);
  }

  score = Math.max(0, score);
  const hasError = findings.some((item) => item.severity === "error");
  return {
    status: hasError ? "block" : findings.length ? "warn" : "pass",
    score,
    findings,
  };
}
