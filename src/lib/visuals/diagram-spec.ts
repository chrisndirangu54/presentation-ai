export type DiagramType =
  | "flowchart" | "swimlane" | "org-chart" | "architecture"
  | "network" | "mind-map" | "decision-tree" | "concept-map"
  | "sequence" | "state" | "workflow" | "value-chain"
  | "supply-chain" | "causal-loop" | "funnel" | "roadmap";

export interface DiagramNode {
  id: string;
  label: string;
  subtitle?: string;
  group?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  kind?: "directed" | "undirected" | "dependency" | "feedback";
}

export interface DiagramSpec {
  type: DiagramType;
  title: string;
  direction?: "TB" | "LR" | "BT" | "RL";
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups?: Array<{ id: string; label: string }>;
  annotations?: string[];
}

export function validateDiagram(spec: DiagramSpec) {
  const ids = new Set(spec.nodes.map((node) => node.id));
  const dangling = spec.edges.filter(
    (edge) => !ids.has(edge.source) || !ids.has(edge.target),
  );
  return {
    valid: dangling.length === 0 && spec.nodes.length > 0,
    danglingEdgeIds: dangling.map((edge) => edge.id),
  };
}
