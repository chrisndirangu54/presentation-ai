export type SegmentationProvider =
  | "manual-mask"
  | "sam2"
  | "grounded-sam2"
  | "custom";

export type ImageEditOperation =
  | "segment"
  | "remove"
  | "replace"
  | "recolor"
  | "background-remove"
  | "background-replace"
  | "blur"
  | "desaturate"
  | "crop"
  | "extend";

export interface SegmentationSelection {
  id: string;
  label?: string;
  prompt?: string;
  maskUrl?: string;
  polygon?: Array<{ x: number; y: number }>;
  score?: number;
}

export interface ImageEditCommand {
  id: string;
  operation: ImageEditOperation;
  selectionId?: string;
  prompt?: string;
  color?: string;
  strength?: number;
  parameters?: Record<string, unknown>;
  createdAt: string;
}

export interface ImageEditDocument {
  sourceUrl: string;
  selections: SegmentationSelection[];
  commands: ImageEditCommand[];
  activeSelectionId?: string;
}

export interface SegmentationRequest {
  imageUrl: string;
  provider?: SegmentationProvider;
  prompt?: string;
  points?: Array<{ x: number; y: number; label: 0 | 1 }>;
  box?: { x1: number; y1: number; x2: number; y2: number };
}

export interface SegmentationProviderDescriptor {
  id: SegmentationProvider;
  label: string;
  promptable: boolean;
  automatic: boolean;
  description: string;
}

export const segmentationProviders: SegmentationProviderDescriptor[] = [
  {
    id: "manual-mask",
    label: "Manual mask",
    promptable: false,
    automatic: false,
    description: "Brush or polygon selection performed directly in the editor.",
  },
  {
    id: "sam2",
    label: "SAM 2",
    promptable: false,
    automatic: true,
    description: "Point/box-based object segmentation adapter.",
  },
  {
    id: "grounded-sam2",
    label: "Grounded SAM 2",
    promptable: true,
    automatic: true,
    description: "Text-prompt object grounding followed by segmentation.",
  },
  {
    id: "custom",
    label: "Custom segmentation service",
    promptable: true,
    automatic: true,
    description: "Workspace-configured segmentation endpoint.",
  },
];

export function appendImageEdit(
  document: ImageEditDocument,
  command: ImageEditCommand,
): ImageEditDocument {
  return {
    ...document,
    commands: [...document.commands, command],
  };
}

export function undoImageEdit(
  document: ImageEditDocument,
): ImageEditDocument {
  return {
    ...document,
    commands: document.commands.slice(0, -1),
  };
}
