import type { OutputKind } from "@/lib/outputs/catalog";

export interface SourceToManyRequest {
  sourceIds: string[];
  outputs: OutputKind[];
  objective?: string;
  audience?: string;
  brandKitId?: string;
  locale?: string;
}

export interface SourceToManyPlan {
  sharedFacts: string[];
  sharedVisualLanguage: {
    palette?: string[];
    tone?: string;
    density?: "light" | "balanced" | "rich";
  };
  outputs: Array<{
    kind: OutputKind;
    purpose: string;
    contentStrategy: string[];
    preferredVisuals: string[];
  }>;
}

export function buildSourceToManyPlan(
  request: SourceToManyRequest,
): SourceToManyPlan {
  const outputs = [...new Set(request.outputs)];
  return {
    sharedFacts: [],
    sharedVisualLanguage: {
      tone: "clear, visual and evidence-led",
      density: "rich",
    },
    outputs: outputs.map((kind) => ({
      kind,
      purpose: request.objective ?? "communicate the source material clearly",
      contentStrategy: [
        "reuse a shared evidence set",
        "adapt density to the output format",
        "preserve source traceability",
        "avoid duplicating unsupported claims",
      ],
      preferredVisuals:
        kind === "spreadsheet"
          ? ["tables", "charts", "conditional highlights"]
          : kind === "document" || kind === "whitepaper"
            ? ["figures", "tables", "callouts"]
            : ["charts", "diagrams", "icons", "data callouts"],
    })),
  };
}
