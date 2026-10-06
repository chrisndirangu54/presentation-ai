export type ExportTarget =
  | "pptx"
  | "pdf"
  | "google-slides"
  | "docx"
  | "png"
  | "svg"
  | "json";

export interface ExportRequest {
  presentationId: string;
  target: ExportTarget;
  options?: {
    includeSpeakerNotes?: boolean;
    includeCitations?: boolean;
    editableText?: boolean;
    pageSize?: "16:9" | "4:3" | "A4";
  };
}

export interface ExportAdapter {
  target: ExportTarget;
  label: string;
  supportsEditableOutput: boolean;
  requiresExternalProvider: boolean;
}

export const exportAdapters: ExportAdapter[] = [
  { target: "pptx", label: "Microsoft PowerPoint", supportsEditableOutput: true, requiresExternalProvider: false },
  { target: "pdf", label: "PDF", supportsEditableOutput: false, requiresExternalProvider: false },
  { target: "google-slides", label: "Google Slides", supportsEditableOutput: true, requiresExternalProvider: true },
  { target: "docx", label: "Word handout", supportsEditableOutput: true, requiresExternalProvider: false },
  { target: "png", label: "PNG slide images", supportsEditableOutput: false, requiresExternalProvider: false },
  { target: "svg", label: "SVG slide images", supportsEditableOutput: true, requiresExternalProvider: false },
  { target: "json", label: "Portable presentation JSON", supportsEditableOutput: true, requiresExternalProvider: false },
];

export function getExportAdapter(target: ExportTarget) {
  return exportAdapters.find((adapter) => adapter.target === target);
}
