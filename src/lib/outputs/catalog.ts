export type OutputKind =
  | "presentation"
  | "document"
  | "spreadsheet"
  | "infographic"
  | "chart"
  | "flowchart"
  | "diagram"
  | "mind-map"
  | "timeline"
  | "dashboard"
  | "poster"
  | "social-carousel"
  | "one-pager"
  | "whitepaper";

export interface OutputDescriptor {
  id: OutputKind;
  label: string;
  description: string;
  formats: string[];
  visualFirst: boolean;
  editable: boolean;
}

export const outputCatalog: OutputDescriptor[] = [
  { id: "presentation", label: "Presentation", description: "Narrative slide decks with notes, citations and rich visuals.", formats: ["pptx","pdf","google-slides","png","svg","html"], visualFirst: true, editable: true },
  { id: "document", label: "Document", description: "Reports, proposals, briefs, manuals and handouts.", formats: ["docx","pdf","html","markdown"], visualFirst: false, editable: true },
  { id: "spreadsheet", label: "Spreadsheet", description: "Data workbooks, budgets, KPI trackers and models.", formats: ["xlsx","csv","pdf"], visualFirst: false, editable: true },
  { id: "infographic", label: "Infographic", description: "Data-rich visual explainers and executive summaries.", formats: ["png","jpg","svg","pdf","html"], visualFirst: true, editable: true },
  { id: "chart", label: "Chart", description: "Standalone analytical charts with AI-generated insights.", formats: ["png","svg","pdf","xlsx"], visualFirst: true, editable: true },
  { id: "flowchart", label: "Flowchart", description: "Processes, workflows, decisions and swimlanes.", formats: ["png","svg","pdf","pptx"], visualFirst: true, editable: true },
  { id: "diagram", label: "Diagram", description: "Architecture, networks, systems and conceptual diagrams.", formats: ["png","svg","pdf","pptx"], visualFirst: true, editable: true },
  { id: "mind-map", label: "Mind map", description: "Hierarchical idea exploration and concept mapping.", formats: ["png","svg","pdf"], visualFirst: true, editable: true },
  { id: "timeline", label: "Timeline", description: "Chronologies, roadmaps and milestone stories.", formats: ["png","svg","pdf","pptx"], visualFirst: true, editable: true },
  { id: "dashboard", label: "Dashboard", description: "KPI scorecards and visual analytics summaries.", formats: ["png","pdf","html","xlsx"], visualFirst: true, editable: true },
  { id: "poster", label: "Poster", description: "Print-ready marketing, event and academic posters.", formats: ["png","jpg","svg","pdf"], visualFirst: true, editable: true },
  { id: "social-carousel", label: "Social carousel", description: "Multi-card social storytelling for LinkedIn and Instagram.", formats: ["png","jpg","pdf"], visualFirst: true, editable: true },
  { id: "one-pager", label: "One-pager", description: "Compact business, product and program summaries.", formats: ["pdf","docx","png"], visualFirst: true, editable: true },
  { id: "whitepaper", label: "Whitepaper", description: "Long-form research and technical communication.", formats: ["pdf","docx","html"], visualFirst: false, editable: true },
];
