export type InPlaceTarget =
  | "text"
  | "image"
  | "chart"
  | "diagram"
  | "shape"
  | "table"
  | "data"
  | "theme";

export type InPlaceCommand =
  | "rewrite"
  | "shorten"
  | "expand"
  | "restyle"
  | "replace"
  | "remove"
  | "recolor"
  | "resize"
  | "reframe"
  | "regenerate"
  | "bind-data"
  | "convert-visual";

export interface InPlaceEditRequest {
  artifactId?: string;
  elementId: string;
  target: InPlaceTarget;
  command: InPlaceCommand;
  instruction?: string;
  selection?: {
    start?: number;
    end?: number;
    selectionId?: string;
  };
  parameters?: Record<string, unknown>;
}

export interface InPlaceEditPlan {
  target: InPlaceTarget;
  command: InPlaceCommand;
  destructive: boolean;
  preservesHistory: boolean;
  steps: string[];
}

export function planInPlaceEdit(
  request: InPlaceEditRequest,
): InPlaceEditPlan {
  const destructive = request.command === "remove";
  return {
    target: request.target,
    command: request.command,
    destructive,
    preservesHistory: true,
    steps: [
      "snapshot current element state",
      "apply edit to the selected element only",
      "validate layout and accessibility constraints",
      "persist an undoable operation",
    ],
  };
}
