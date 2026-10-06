import type { SemanticGraph, SemanticNode } from "@/lib/semantic/graph";
import {
  generateAdaptiveLayout,
  targetSpecs,
  type AdaptiveLayoutResult,
  type BrandTokens,
  type LayoutElement,
  type LayoutTarget,
} from "./engine";
import { auditAdaptiveLayout } from "./quality";
import { detectVisualGroups } from "./grouping";
import { fitTypography } from "./typography";
import {
  defaultLayoutWeights,
  scoreWithLearnedWeights,
  type LayoutFeatureWeights,
} from "./learning";

export interface LayoutScoreBreakdown {
  relationship: number;
  whitespace: number;
  balance: number;
  typography: number;
  imagery: number;
  charts: number;
  penalties: number;
  total: number;
}

export interface ScoredLayoutCandidate {
  id: string;
  layout: AdaptiveLayoutResult;
  score: LayoutScoreBreakdown;
  rank?: number;
}

export interface ConstraintSolverOptions {
  candidates?: number;
  iterations?: number;
  brandTokens?: BrandTokens;
  learnedWeights?: LayoutFeatureWeights;
}

type Pair = [string, string];

function relationPairs(graph: SemanticGraph): Pair[] {
  return graph.edges
    .filter((edge) =>
      ["supports", "visualizes", "contains", "references", "reuses"].includes(
        edge.kind,
      ),
    )
    .map((edge) => [edge.from, edge.to]);
}

function center(element: LayoutElement) {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  };
}

function findElement(layout: AdaptiveLayoutResult, semanticId: string) {
  for (const page of layout.pages) {
    const element = page.elements.find(
      (item) => item.semanticId === semanticId,
    );
    if (element) return element;
  }
  return undefined;
}

function relationshipScore(graph: SemanticGraph, layout: AdaptiveLayoutResult) {
  const groups = detectVisualGroups(graph);
  const pairs = relationPairs(graph);
  if (!pairs.length && !groups.length) return 100;

  let score = 0;
  let count = 0;
  for (const [aId, bId] of pairs) {
    const a = findElement(layout, aId);
    const b = findElement(layout, bId);
    if (!a || !b) continue;
    if (a.page !== b.page) {
      score += 10;
      count++;
      continue;
    }
    const ac = center(a);
    const bc = center(b);
    const distance = Math.hypot(ac.x - bc.x, ac.y - bc.y);
    const page = layout.pages[a.page]!;
    const diagonal = Math.hypot(page.width, page.height);
    score += Math.max(0, 100 - (distance / diagonal) * 120);
    count++;
  }

  for (const group of groups) {
    const elements = group.semanticIds
      .map((id) => findElement(layout, id))
      .filter((element): element is LayoutElement => Boolean(element));
    if (elements.length < 2) continue;
    const samePage = elements.every((element) => element.page === elements[0]!.page);
    score += samePage ? Math.min(100, 70 + group.strength * 12) : 15;
    count++;
  }

  return count ? score / count : 100;
}

function whitespaceScore(layout: AdaptiveLayoutResult) {
  const spec = targetSpecs[layout.target];
  let total = 0;
  for (const page of layout.pages) {
    const usableArea =
      (page.width - spec.margin * 2) * (page.height - spec.margin * 2);
    const occupied = page.elements.reduce(
      (sum, element) => sum + element.width * element.height,
      0,
    );
    const ratio = usableArea ? occupied / usableArea : 1;
    const target = spec.preferredDensity;
    total += Math.max(0, 100 - Math.abs(ratio - target) * 180);
  }
  return total / Math.max(1, layout.pages.length);
}

function balanceScore(layout: AdaptiveLayoutResult) {
  let score = 0;
  for (const page of layout.pages) {
    const totalWeight = page.elements.reduce(
      (sum, element) => sum + element.width * element.height * element.priority,
      0,
    );
    if (!totalWeight) {
      score += 100;
      continue;
    }
    const cx =
      page.elements.reduce(
        (sum, element) =>
          sum +
          (element.x + element.width / 2) *
            element.width *
            element.height *
            element.priority,
        0,
      ) / totalWeight;
    const cy =
      page.elements.reduce(
        (sum, element) =>
          sum +
          (element.y + element.height / 2) *
            element.width *
            element.height *
            element.priority,
        0,
      ) / totalWeight;
    const dx = Math.abs(cx - page.width / 2) / (page.width / 2);
    const dy = Math.abs(cy - page.height / 2) / (page.height / 2);
    score += Math.max(0, 100 - (dx + dy) * 55);
  }
  return score / Math.max(1, layout.pages.length);
}

function typographyScore(graph: SemanticGraph, layout: AdaptiveLayoutResult) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  let total = 0;
  let count = 0;

  for (const page of layout.pages) {
    for (const element of page.elements) {
      const node = element.semanticId ? nodes.get(element.semanticId) : undefined;
      if (!node || !["text", "claim", "fact", "section"].includes(node.kind)) {
        continue;
      }
      const result = fitTypography({
        text: node.text ?? node.label ?? "",
        width: Math.max(1, element.width - 24),
        height: Math.max(1, element.height - 20),
        minFontSize: node.kind === "section" ? 20 : 12,
        maxFontSize: node.kind === "section" ? 48 : 30,
      });
      element.style = {
        ...(element.style ?? {}),
        typography: result,
      };
      total += result.fits ? Math.max(65, 100 - result.estimatedLines * 2) : Math.max(0, 55 - result.overflowRatio * 80);
      count++;
    }
  }

  return count ? total / count : 100;
}

function imageScore(graph: SemanticGraph, layout: AdaptiveLayoutResult) {
  const images = graph.nodes.filter((node) => node.kind === "image");
  if (!images.length) return 100;

  let total = 0;
  for (const node of images) {
    const element = findElement(layout, node.id);
    if (!element) continue;
    const focal = node.metadata?.focalPoint as
      | { x?: number; y?: number }
      | undefined;
    const crop = element.style?.crop as
      | { objectPositionX?: number; objectPositionY?: number }
      | undefined;
    if (!focal) {
      total += 90;
      continue;
    }
    const dx = Math.abs((crop?.objectPositionX ?? 0.5) - (focal.x ?? 0.5));
    const dy = Math.abs((crop?.objectPositionY ?? 0.5) - (focal.y ?? 0.5));
    total += Math.max(0, 100 - (dx + dy) * 100);
  }

  return total / images.length;
}

function chartScore(graph: SemanticGraph, layout: AdaptiveLayoutResult) {
  const charts = graph.nodes.filter((node) => node.kind === "chart");
  if (!charts.length) return 100;

  let total = 0;
  for (const node of charts) {
    const element = findElement(layout, node.id);
    if (!element) continue;
    const chartType = String(node.metadata?.chartType ?? "bar");
    const aspect = element.width / Math.max(1, element.height);
    const preferred =
      chartType === "pie" || chartType === "donut"
        ? 1
        : chartType === "line"
          ? 1.7
          : 1.4;
    total += Math.max(0, 100 - Math.abs(aspect - preferred) * 55);
  }
  return total / charts.length;
}

export function scoreLayout(
  graph: SemanticGraph,
  layout: AdaptiveLayoutResult,
  learnedWeights: LayoutFeatureWeights = defaultLayoutWeights,
): LayoutScoreBreakdown {
  const quality = auditAdaptiveLayout(layout);
  const penalties = quality.reduce(
    (sum, finding) =>
      sum +
      (finding.severity === "error"
        ? 18
        : finding.severity === "warning"
          ? 7
          : 1),
    0,
  );
  const relationship = relationshipScore(graph, layout);
  const whitespace = whitespaceScore(layout);
  const balance = balanceScore(layout);
  const typography = typographyScore(graph, layout);
  const imagery = imageScore(graph, layout);
  const charts = chartScore(graph, layout);
  const total = scoreWithLearnedWeights(
    {
      relationship,
      whitespace,
      balance,
      typography,
      imagery,
      charts,
      penalties,
    },
    learnedWeights,
  );

  return {
    relationship,
    whitespace,
    balance,
    typography,
    imagery,
    charts,
    penalties,
    total,
  };
}

function cloneLayout(layout: AdaptiveLayoutResult): AdaptiveLayoutResult {
  return {
    ...layout,
    warnings: [...layout.warnings],
    pages: layout.pages.map((page) => ({
      ...page,
      elements: page.elements.map((element) => ({
        ...element,
        style: { ...(element.style ?? {}) },
      })),
    })),
  };
}

function relatedIds(graph: SemanticGraph, id: string) {
  const ids = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.from === id) ids.add(edge.to);
    if (edge.to === id) ids.add(edge.from);
  }
  return ids;
}

function applyFocalCrop(node: SemanticNode, element: LayoutElement) {
  if (node.kind !== "image") return;
  const focal = node.metadata?.focalPoint as
    | { x?: number; y?: number }
    | undefined;
  element.style = {
    ...(element.style ?? {}),
    crop: {
      objectFit: "cover",
      objectPositionX: focal?.x ?? 0.5,
      objectPositionY: focal?.y ?? 0.5,
    },
  };
}

function applyChartAspect(node: SemanticNode, element: LayoutElement) {
  if (node.kind !== "chart") return;
  const type = String(node.metadata?.chartType ?? "bar");
  const ratio =
    type === "pie" || type === "donut" ? 1 : type === "line" ? 1.7 : 1.4;
  element.height = Math.max(120, Math.round(element.width / ratio));
}

function mutateCandidate(
  graph: SemanticGraph,
  base: AdaptiveLayoutResult,
  variant: number,
) {
  const result = cloneLayout(base);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));

  for (const page of result.pages) {
    page.elements.sort((a, b) => {
      if (variant % 3 === 0) return b.priority - a.priority;
      if (variant % 3 === 1) return a.y - b.y || a.x - b.x;
      return (a.semanticId ?? "").localeCompare(b.semanticId ?? "");
    });

    const gapBias = variant % 2 === 0 ? 1 : -1;
    for (let i = 0; i < page.elements.length; i++) {
      const element = page.elements[i]!;
      const node = element.semanticId ? nodes.get(element.semanticId) : undefined;
      if (node) {
        applyFocalCrop(node, element);
        applyChartAspect(node, element);
      }

      const related = element.semanticId
        ? relatedIds(graph, element.semanticId)
        : new Set<string>();
      const nearRelated = page.elements.find(
        (candidate) =>
          candidate.semanticId &&
          related.has(candidate.semanticId) &&
          candidate.id !== element.id,
      );
      if (nearRelated) {
        const delta = Math.min(28, 8 + variant * 2);
        element.x +=
          Math.sign(nearRelated.x - element.x || 1) * Math.min(delta, 16);
        element.y +=
          Math.sign(nearRelated.y - element.y || 1) * Math.min(delta, 12);
      }

      element.x += gapBias * ((i + variant) % 3) * 4;
      element.y += gapBias * ((i + variant * 2) % 2) * 4;

      const spec = targetSpecs[result.target];
      element.x = Math.max(
        spec.margin,
        Math.min(element.x, page.width - spec.margin - element.width),
      );
      element.y = Math.max(
        spec.margin,
        Math.min(element.y, page.height - spec.margin - element.height),
      );
    }
  }

  return result;
}

export function solveLayoutConstraints(
  graph: SemanticGraph,
  target: LayoutTarget,
  options: ConstraintSolverOptions = {},
) {
  const candidateCount = Math.max(3, Math.min(options.candidates ?? 8, 20));
  const iterations = Math.max(1, Math.min(options.iterations ?? 2, 6));
  const seed = generateAdaptiveLayout(graph, target, options.brandTokens);
  let pool: AdaptiveLayoutResult[] = [seed];

  for (let iteration = 0; iteration < iterations; iteration++) {
    const next: AdaptiveLayoutResult[] = [];
    for (const base of pool) {
      next.push(base);
      for (let variant = 0; variant < candidateCount; variant++) {
        next.push(mutateCandidate(graph, base, variant + iteration));
      }
    }
    pool = next
      .map((layout, index) => ({
        id: `candidate-${iteration}-${index}`,
        layout,
        score: scoreLayout(graph, layout, options.learnedWeights),
      }))
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, candidateCount)
      .map((candidate) => candidate.layout);
  }

  const candidates: ScoredLayoutCandidate[] = pool
    .map((layout, index) => ({
      id: `candidate-${index + 1}`,
      layout,
      score: scoreLayout(graph, layout, options.learnedWeights),
    }))
    .sort((a, b) => b.score.total - a.score.total)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

  return {
    best: candidates[0]!,
    candidates,
  };
}
