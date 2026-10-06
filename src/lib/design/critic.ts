export type ReviewDimension =
  | "hierarchy"
  | "contrast"
  | "spacing"
  | "typography"
  | "accessibility"
  | "brand"
  | "data-integrity"
  | "evidence"
  | "readability";

export interface DesignReviewInput {
  title?: string;
  bodyText?: string;
  hasCitation?: boolean;
  hasAltText?: boolean;
  chartAxisStartsAtZero?: boolean;
  brandCompliant?: boolean;
  contrastRatio?: number;
}

export interface DesignReviewFinding {
  dimension: ReviewDimension;
  severity: "info" | "warning" | "error";
  message: string;
}

export function reviewDesign(
  input: DesignReviewInput,
): DesignReviewFinding[] {
  const findings: DesignReviewFinding[] = [];
  const words = (input.bodyText ?? "").trim().split(/\s+/).filter(Boolean).length;

  if ((input.title ?? "").length > 90) {
    findings.push({ dimension: "hierarchy", severity: "warning", message: "Use a shorter conclusion-style title." });
  }
  if (words > 120) {
    findings.push({ dimension: "readability", severity: "warning", message: "Reduce text density or split the content." });
  }
  if (input.contrastRatio !== undefined && input.contrastRatio < 4.5) {
    findings.push({ dimension: "contrast", severity: "error", message: "Increase text/background contrast." });
  }
  if (input.hasAltText === false) {
    findings.push({ dimension: "accessibility", severity: "warning", message: "Add meaningful alt text." });
  }
  if (input.brandCompliant === false) {
    findings.push({ dimension: "brand", severity: "warning", message: "Apply the workspace brand policy." });
  }
  if (input.hasCitation === false && /\b\d+(?:\.\d+)?%\b/.test(input.bodyText ?? "")) {
    findings.push({ dimension: "evidence", severity: "warning", message: "Cite quantitative claims." });
  }
  if (input.chartAxisStartsAtZero === false) {
    findings.push({ dimension: "data-integrity", severity: "warning", message: "Review the axis scale for potentially misleading emphasis." });
  }

  return findings.length
    ? findings
    : [{ dimension: "readability", severity: "info", message: "No basic review issues detected." }];
}
