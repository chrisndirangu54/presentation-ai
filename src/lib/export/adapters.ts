export type ExportTarget =
  | "pptx"
  | "pdf"
  | "google-slides"
  | "docx"
  | "xlsx"
  | "csv"
  | "png"
  | "jpg"
  | "svg"
  | "html"
  | "markdown"
  | "json";

export interface ExportRequest {
  artifactId: string;
  target: ExportTarget;
  options?: {
    includeSpeakerNotes?: boolean;
    includeCitations?: boolean;
    editableText?: boolean;
    includeSourceData?: boolean;
    pageSize?: "16:9" | "4:3" | "A4" | "A3" | "square";
  };
}

export interface ExportAdapter {
  target: ExportTarget;
  label: string;
  supportsEditableOutput: boolean;
  requiresExternalProvider: boolean;
  bestFor: string[];
}

export const exportAdapters: ExportAdapter[] = [
  { target: "pptx", label: "Microsoft PowerPoint", supportsEditableOutput: true, requiresExternalProvider: false, bestFor: ["presentations","diagrams","timelines"] },
  { target: "pdf", label: "PDF", supportsEditableOutput: false, requiresExternalProvider: false, bestFor: ["documents","infographics","posters","handouts"] },
  { target: "google-slides", label: "Google Slides", supportsEditableOutput: true, requiresExternalProvider: true, bestFor: ["presentations","collaboration"] },
  { target: "docx", label: "Microsoft Word", supportsEditableOutput: true, requiresExternalProvider: false, bestFor: ["reports","proposals","whitepapers"] },
  { target: "xlsx", label: "Microsoft Excel", supportsEditableOutput: true, requiresExternalProvider: false, bestFor: ["spreadsheets","dashboards","chart data"] },
  { target: "csv", label: "CSV", supportsEditableOutput: true, requiresExternalProvider: false, bestFor: ["data tables","interchange"] },
  { target: "png", label: "PNG", supportsEditableOutput: false, requiresExternalProvider: false, bestFor: ["infographics","social","slides","charts"] },
  { target: "jpg", label: "JPG", supportsEditableOutput: false, requiresExternalProvider: false, bestFor: ["social","posters","previews"] },
  { target: "svg", label: "SVG", supportsEditableOutput: true, requiresExternalProvider: false, bestFor: ["charts","diagrams","infographics"] },
  { target: "html", label: "Interactive HTML", supportsEditableOutput: true, requiresExternalProvider: false, bestFor: ["web reports","dashboards","presentations"] },
  { target: "markdown", label: "Markdown", supportsEditableOutput: true, requiresExternalProvider: false, bestFor: ["documents","technical content"] },
  { target: "json", label: "Portable JSON", supportsEditableOutput: true, requiresExternalProvider: false, bestFor: ["templates","automation","interchange"] },
];

export function getExportAdapter(target: ExportTarget) {
  return exportAdapters.find((adapter) => adapter.target === target);
}
