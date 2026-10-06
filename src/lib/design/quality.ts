export interface SlideAuditInput {
  title?: string;
  bodyText?: string;
  citationCount?: number;
  imageAltText?: string;
  foregroundHex?: string;
  backgroundHex?: string;
  hasChart?: boolean;
  chartHasLabel?: boolean;
}

export interface QualityFinding {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
}

export function auditSlide(slide: SlideAuditInput): QualityFinding[] {
  const findings: QualityFinding[] = [];
  const title = slide.title?.trim() ?? "";
  const body = slide.bodyText?.trim() ?? "";

  if (!title) {
    findings.push({
      code: "missing-title",
      severity: "error",
      message: "Add a clear slide title.",
    });
  } else if (title.length > 90) {
    findings.push({
      code: "long-title",
      severity: "warning",
      message: "Shorten the title so the conclusion is scannable.",
    });
  }

  const words = body ? body.split(/\s+/).length : 0;
  if (words > 90) {
    findings.push({
      code: "dense-slide",
      severity: "warning",
      message: "This slide is text-heavy; split or compress it.",
    });
  }

  if (/\b\d+(?:\.\d+)?%\b/.test(body) && !slide.citationCount) {
    findings.push({
      code: "uncited-statistic",
      severity: "warning",
      message: "Quantitative claims should have a traceable citation.",
    });
  }

  if (slide.hasChart && !slide.chartHasLabel) {
    findings.push({
      code: "chart-label",
      severity: "warning",
      message: "Add a descriptive chart title or accessible label.",
    });
  }

  if (slide.imageAltText !== undefined && !slide.imageAltText.trim()) {
    findings.push({
      code: "image-alt",
      severity: "warning",
      message: "Add alternative text for meaningful images.",
    });
  }

  if (!findings.length) {
    findings.push({
      code: "clean",
      severity: "info",
      message: "No basic quality issues detected.",
    });
  }

  return findings;
}
