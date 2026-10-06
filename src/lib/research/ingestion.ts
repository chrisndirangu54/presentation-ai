import type { IngestionKind, ResearchSource } from "./types";

export interface IngestionRequest {
  kind: IngestionKind;
  title: string;
  uri?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestionAdapter {
  kind: IngestionKind;
  accepts: string[];
  requiresWorker: boolean;
}

export const ingestionAdapters: IngestionAdapter[] = [
  { kind: "pdf", accepts: ["application/pdf"], requiresWorker: true },
  { kind: "docx", accepts: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], requiresWorker: true },
  { kind: "pptx", accepts: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"], requiresWorker: true },
  { kind: "xlsx", accepts: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], requiresWorker: true },
  { kind: "csv", accepts: ["text/csv"], requiresWorker: false },
  { kind: "url", accepts: ["text/html"], requiresWorker: true },
  { kind: "youtube", accepts: ["video/youtube"], requiresWorker: true },
  { kind: "google-drive", accepts: ["application/x-google-drive"], requiresWorker: true },
  { kind: "text", accepts: ["text/plain", "text/markdown"], requiresWorker: false },
  { kind: "image", accepts: ["image/*"], requiresWorker: true },
  { kind: "audio", accepts: ["audio/*"], requiresWorker: true },
];

export function normalizeSource(
  id: string,
  request: IngestionRequest,
): ResearchSource {
  return {
    id,
    kind: request.kind,
    title: request.title.trim() || "Untitled source",
    uri: request.uri,
    mimeType: request.mimeType,
    metadata: request.metadata,
  };
}
