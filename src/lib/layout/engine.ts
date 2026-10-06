import type { SemanticGraph, SemanticNode } from "@/lib/semantic/graph";

export type LayoutTarget =
  | "deck-16x9"
  | "deck-4x3"
  | "a4-portrait"
  | "a4-landscape"
  | "dashboard-desktop"
  | "mobile"
  | "infographic"
  | "poster-a3"
  | "social-square"
  | "social-portrait"
  | "social-story";

export interface BrandTokens {
  fontFamily?: string;
  headingFontFamily?: string;
  palette?: string[];
  radius?: number;
  spacingScale?: number[];
  logoSafeArea?: number;
  minContrastRatio?: number;
}

export interface LayoutElement {
  id: string;
  semanticId?: string;
  kind: SemanticNode["kind"];
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
  hidden?: boolean;
  page: number;
  style?: Record<string, unknown>;
}

export interface LayoutPage {
  index: number;
  width: number;
  height: number;
  elements: LayoutElement[];
}

export interface AdaptiveLayoutResult {
  target: LayoutTarget;
  pages: LayoutPage[];
  warnings: string[];
  brandTokens?: BrandTokens;
}

interface TargetSpec {
  width: number;
  height: number;
  margin: number;
  columns: number;
  gap: number;
  maxTextChars: number;
  preferredDensity: number;
}

export const targetSpecs: Record<LayoutTarget, TargetSpec> = {
  "deck-16x9": { width: 1600, height: 900, margin: 72, columns: 12, gap: 24, maxTextChars: 500, preferredDensity: 0.58 },
  "deck-4x3": { width: 1200, height: 900, margin: 64, columns: 10, gap: 22, maxTextChars: 450, preferredDensity: 0.56 },
  "a4-portrait": { width: 794, height: 1123, margin: 56, columns: 6, gap: 18, maxTextChars: 1100, preferredDensity: 0.72 },
  "a4-landscape": { width: 1123, height: 794, margin: 56, columns: 8, gap: 20, maxTextChars: 900, preferredDensity: 0.68 },
  "dashboard-desktop": { width: 1440, height: 1024, margin: 32, columns: 12, gap: 18, maxTextChars: 350, preferredDensity: 0.78 },
  mobile: { width: 390, height: 844, margin: 20, columns: 4, gap: 12, maxTextChars: 260, preferredDensity: 0.82 },
  infographic: { width: 1080, height: 1920, margin: 48, columns: 8, gap: 20, maxTextChars: 700, preferredDensity: 0.74 },
  "poster-a3": { width: 1123, height: 1587, margin: 64, columns: 8, gap: 24, maxTextChars: 850, preferredDensity: 0.7 },
  "social-square": { width: 1080, height: 1080, margin: 64, columns: 6, gap: 20, maxTextChars: 300, preferredDensity: 0.62 },
  "social-portrait": { width: 1080, height: 1350, margin: 64, columns: 6, gap: 20, maxTextChars: 360, preferredDensity: 0.66 },
  "social-story": { width: 1080, height: 1920, margin: 72, columns: 6, gap: 22, maxTextChars: 420, preferredDensity: 0.64 },
};

function weight(node: SemanticNode) {
  switch (node.kind) {
    case "metric":
      return 5;
    case "chart":
    case "diagram":
    case "image":
      return 4;
    case "claim":
    case "fact":
      return 3;
    case "table":
      return 4;
    case "section":
      return 5;
    default:
      return 2;
  }
}

function preferredHeight(node: SemanticNode, spec: TargetSpec) {
  const textLength = (node.text ?? node.label ?? "").length;
  switch (node.kind) {
    case "image":
    case "chart":
    case "diagram":
      return Math.min(spec.height * 0.42, 360);
    case "metric":
      return 150;
    case "table":
      return Math.min(420, 160 + textLength * 0.25);
    case "section":
      return 120;
    default:
      return Math.max(90, Math.min(260, 80 + textLength * 0.45));
  }
}

function preferredColumns(node: SemanticNode, spec: TargetSpec) {
  switch (node.kind) {
    case "chart":
    case "diagram":
    case "image":
    case "table":
      return Math.min(spec.columns, Math.max(4, Math.ceil(spec.columns * 0.66)));
    case "metric":
      return Math.min(4, spec.columns);
    case "section":
      return spec.columns;
    default:
      return Math.min(spec.columns, Math.max(3, Math.ceil(spec.columns * 0.5)));
  }
}

export function generateAdaptiveLayout(
  graph: SemanticGraph,
  target: LayoutTarget,
  brandTokens?: BrandTokens,
): AdaptiveLayoutResult {
  const spec = targetSpecs[target];
  const usableWidth = spec.width - spec.margin * 2;
  const columnWidth = (usableWidth - spec.gap * (spec.columns - 1)) / spec.columns;
  const nodes = [...graph.nodes].sort((a, b) => weight(b) - weight(a));
  const warnings: string[] = [];
  const pages: LayoutPage[] = [];
  let page = 0;
  let cursorY = spec.margin;
  let rowX = spec.margin;
  let rowHeight = 0;

  const ensurePage = () => {
    if (!pages[page]) {
      pages[page] = { index: page, width: spec.width, height: spec.height, elements: [] };
    }
  };
  ensurePage();

  for (const node of nodes) {
    const cols = preferredColumns(node, spec);
    const width = cols * columnWidth + Math.max(0, cols - 1) * spec.gap;
    const height = preferredHeight(node, spec);

    if (rowX + width > spec.width - spec.margin + 1) {
      cursorY += rowHeight + spec.gap;
      rowX = spec.margin;
      rowHeight = 0;
    }

    if (cursorY + height > spec.height - spec.margin) {
      page += 1;
      ensurePage();
      cursorY = spec.margin;
      rowX = spec.margin;
      rowHeight = 0;
    }

    pages[page]!.elements.push({
      id: `layout-${node.id}`,
      semanticId: node.id,
      kind: node.kind,
      x: Math.round(rowX),
      y: Math.round(cursorY),
      width: Math.round(width),
      height: Math.round(height),
      priority: weight(node),
      page,
      style: {
        fontFamily: brandTokens?.fontFamily,
        headingFontFamily: brandTokens?.headingFontFamily,
        borderRadius: brandTokens?.radius,
      },
    });

    rowX += width + spec.gap;
    rowHeight = Math.max(rowHeight, height);

    const textLength = (node.text ?? node.label ?? "").length;
    if (textLength > spec.maxTextChars) {
      warnings.push(`${node.label}: content exceeds preferred text density for ${target}`);
    }
  }

  return { target, pages, warnings, brandTokens };
}

export function layoutDensity(result: AdaptiveLayoutResult) {
  const occupied = result.pages.reduce(
    (sum, page) =>
      sum + page.elements.reduce((pageSum, element) => pageSum + element.width * element.height, 0),
    0,
  );
  const total = result.pages.reduce((sum, page) => sum + page.width * page.height, 0);
  return total ? occupied / total : 0;
}
