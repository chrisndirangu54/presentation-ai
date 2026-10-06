export type LayoutFeedbackKind =
  | "candidate-selected"
  | "candidate-rejected"
  | "post-layout-edit"
  | "published"
  | "viewer-performance";

export function feedbackReward(input: {
  kind: LayoutFeedbackKind;
  editMagnitude?: number;
  completionRate?: number;
  interactionRate?: number;
  conversionRate?: number;
}) {
  switch (input.kind) {
    case "candidate-selected":
      return 0.7;
    case "candidate-rejected":
      return -0.45;
    case "published":
      return 0.85;
    case "post-layout-edit":
      return -Math.min(0.8, Math.max(0, input.editMagnitude ?? 0));
    case "viewer-performance": {
      const completion = Math.max(0, Math.min(1, input.completionRate ?? 0));
      const interaction = Math.max(0, Math.min(1, input.interactionRate ?? 0));
      const conversion = Math.max(0, Math.min(1, input.conversionRate ?? 0));
      return Math.max(
        -1,
        Math.min(1, completion * 0.5 + interaction * 0.25 + conversion * 0.25),
      );
    }
  }
}
