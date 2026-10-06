export type SemanticNodeKind =
  | "fact" | "claim" | "metric" | "text" | "image" | "chart"
  | "diagram" | "table" | "component" | "person" | "organization"
  | "product" | "source" | "asset" | "section";

export type SemanticEdgeKind =
  | "supports" | "derived-from" | "references" | "contains" | "updates"
  | "visualizes" | "contradicts" | "related-to" | "owned-by" | "reuses";

export interface SemanticNode {
  id: string;
  kind: SemanticNodeKind;
  label: string;
  key?: string;
  value?: unknown;
  text?: string;
  unit?: string;
  metadata?: Record<string, unknown>;
}

export interface SemanticEdge {
  from: string;
  to: string;
  kind: SemanticEdgeKind;
  weight?: number;
}

export interface SemanticGraph {
  nodes: SemanticNode[];
  edges: SemanticEdge[];
}

export function validateSemanticGraph(graph: SemanticGraph) {
  const ids = new Set(graph.nodes.map((node) => node.id));
  const duplicateIds = graph.nodes
    .map((node) => node.id)
    .filter((id, index, all) => all.indexOf(id) !== index);
  const dangling = graph.edges.filter(
    (edge) => !ids.has(edge.from) || !ids.has(edge.to),
  );
  return {
    valid: duplicateIds.length === 0 && dangling.length === 0,
    duplicateIds: [...new Set(duplicateIds)],
    danglingEdges: dangling,
  };
}

export function semanticDependents(graph: SemanticGraph, nodeId: string) {
  const queue = [nodeId];
  const seen = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of graph.edges) {
      if (edge.from === current && !seen.has(edge.to)) {
        seen.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return [...seen];
}
