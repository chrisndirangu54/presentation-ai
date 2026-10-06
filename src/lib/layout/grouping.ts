import type { SemanticGraph } from "@/lib/semantic/graph";

export interface VisualGroup {
  id: string;
  semanticIds: string[];
  strength: number;
  reasons: string[];
}

export function detectVisualGroups(graph: SemanticGraph): VisualGroup[] {
  const groups = new Map<string, VisualGroup>();

  for (const edge of graph.edges) {
    if (!["supports", "visualizes", "contains", "references", "reuses"].includes(edge.kind)) {
      continue;
    }
    const key = [edge.from, edge.to].sort().join("::");
    groups.set(key, {
      id: `group-${key}`,
      semanticIds: [edge.from, edge.to],
      strength: edge.weight ?? 1,
      reasons: [edge.kind],
    });
  }

  const sectionEdges = graph.edges.filter((edge) => edge.kind === "contains");
  for (const section of graph.nodes.filter((node) => node.kind === "section")) {
    const members = sectionEdges
      .filter((edge) => edge.from === section.id)
      .map((edge) => edge.to);
    if (members.length) {
      groups.set(`section::${section.id}`, {
        id: `section-${section.id}`,
        semanticIds: [section.id, ...members],
        strength: 2,
        reasons: ["section-containment"],
      });
    }
  }

  return [...groups.values()].sort((a, b) => b.strength - a.strength);
}
