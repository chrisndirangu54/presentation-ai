export type InfographicBlockType =
  | "hero-stat" | "kpi-grid" | "comparison" | "timeline" | "process"
  | "map" | "chart" | "icon-list" | "quote" | "before-after"
  | "hierarchy" | "funnel" | "matrix" | "callout" | "source-notes";

export interface InfographicBlock {
  id: string;
  type: InfographicBlockType;
  title?: string;
  body?: string;
  data?: unknown;
  visualSpecId?: string;
  emphasis?: "low" | "medium" | "high";
}

export interface InfographicSpec {
  title: string;
  subtitle?: string;
  orientation: "portrait" | "landscape" | "square";
  blocks: InfographicBlock[];
  sourceNotes?: string[];
  brandKitId?: string;
}

export function infographicDensity(spec: InfographicSpec) {
  const weighted = spec.blocks.reduce((sum, block) => {
    const weight = ["chart","map","timeline","process","comparison"].includes(block.type) ? 2 : 1;
    return sum + weight;
  }, 0);
  return {
    blockCount: spec.blocks.length,
    visualDensity: weighted / Math.max(1, spec.blocks.length),
  };
}
