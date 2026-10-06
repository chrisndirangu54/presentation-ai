export type WorkflowNodeType =
  | "trigger"
  | "research"
  | "transform"
  | "analyze"
  | "chart"
  | "diagram"
  | "design"
  | "review"
  | "approval"
  | "export"
  | "publish"
  | "notify";

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowSpec {
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function validateWorkflow(spec: WorkflowSpec) {
  const ids = new Set(spec.nodes.map((node) => node.id));
  const dangling = spec.edges.filter(
    (edge) => !ids.has(edge.source) || !ids.has(edge.target),
  );
  const hasTrigger = spec.nodes.some((node) => node.type === "trigger");
  return {
    valid: Boolean(spec.name.trim()) && hasTrigger && dangling.length === 0,
    hasTrigger,
    danglingEdges: dangling,
  };
}
