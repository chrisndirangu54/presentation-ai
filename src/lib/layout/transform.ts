import type { SemanticGraph } from "@/lib/semantic/graph";
import type { LayoutTarget } from "./engine";

export interface ResponsiveContentDecision {
  semanticId: string;
  action: "keep" | "compress" | "split" | "hide";
  reason: string;
}

export function decideResponsiveContent(
  graph: SemanticGraph,
  target: LayoutTarget,
): ResponsiveContentDecision[] {
  const compact = ["mobile", "social-square", "social-portrait", "social-story"].includes(target);
  return graph.nodes.map((node) => {
    const textLength = (node.text ?? node.label ?? "").length;
    if (compact && node.kind === "table") {
      return { semanticId: node.id, action: "split", reason: "Tables should become cards or multiple panels on compact formats." };
    }
    if (compact && textLength > 320) {
      return { semanticId: node.id, action: "compress", reason: "Text is too dense for the target viewport." };
    }
    if (target.startsWith("deck") && node.kind === "text" && textLength > 500) {
      return { semanticId: node.id, action: "split", reason: "Long-form text should become multiple slides." };
    }
    return { semanticId: node.id, action: "keep", reason: "Content fits the target format." };
  });
}
