import {
  layoutDensity,
  targetSpecs,
  type AdaptiveLayoutResult,
} from "./engine";

export interface LayoutQualityFinding {
  severity: "info" | "warning" | "error";
  category: "overflow" | "overlap" | "density" | "safe-area" | "brand";
  message: string;
  page?: number;
  elementIds?: string[];
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export function auditAdaptiveLayout(
  result: AdaptiveLayoutResult,
): LayoutQualityFinding[] {
  const spec = targetSpecs[result.target];
  const findings: LayoutQualityFinding[] = [];

  for (const page of result.pages) {
    for (const element of page.elements) {
      if (
        element.x < spec.margin ||
        element.y < spec.margin ||
        element.x + element.width > page.width - spec.margin ||
        element.y + element.height > page.height - spec.margin
      ) {
        findings.push({
          severity: "error",
          category: "safe-area",
          message: "Element breaches the target safe area.",
          page: page.index,
          elementIds: [element.id],
        });
      }
    }

    for (let i = 0; i < page.elements.length; i++) {
      for (let j = i + 1; j < page.elements.length; j++) {
        const a = page.elements[i]!;
        const b = page.elements[j]!;
        if (overlaps(a, b)) {
          findings.push({
            severity: "error",
            category: "overlap",
            message: "Layout elements overlap.",
            page: page.index,
            elementIds: [a.id, b.id],
          });
        }
      }
    }
  }

  const density = layoutDensity(result);
  if (density > spec.preferredDensity + 0.18) {
    findings.push({
      severity: "warning",
      category: "density",
      message: "Layout is visually dense for this target format.",
    });
  }
  if (result.warnings.length) {
    findings.push(
      ...result.warnings.map((message) => ({
        severity: "warning" as const,
        category: "overflow" as const,
        message,
      })),
    );
  }

  return findings;
}
