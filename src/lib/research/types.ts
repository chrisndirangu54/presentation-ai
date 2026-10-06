export type IngestionKind =
  | "pdf"
  | "docx"
  | "pptx"
  | "xlsx"
  | "csv"
  | "url"
  | "youtube"
  | "google-drive"
  | "text"
  | "image"
  | "audio";

export interface ResearchSource {
  id: string;
  kind: IngestionKind;
  title: string;
  uri?: string;
  mimeType?: string;
  contentHash?: string;
  metadata?: Record<string, unknown>;
}

export interface EvidenceClaim {
  claim: string;
  sourceIds: string[];
  confidence: number;
  locator?: string;
  requiresReview?: boolean;
}

export interface ResearchPacket {
  query: string;
  sources: ResearchSource[];
  claims: EvidenceClaim[];
  unresolvedQuestions: string[];
}

export function scoreEvidence(claim: EvidenceClaim) {
  const bounded = Math.max(0, Math.min(1, claim.confidence));
  const sourceBonus = Math.min(0.2, claim.sourceIds.length * 0.05);
  return Math.min(1, bounded + sourceBonus);
}
