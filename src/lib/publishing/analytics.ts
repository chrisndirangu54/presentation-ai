export interface PublishSettings {
  visibility: "private" | "workspace" | "password" | "public";
  expiresAt?: string;
  customDomain?: string;
  leadCapture?: boolean;
  allowDownload?: boolean;
  allowComments?: boolean;
}

export type EngagementEventType =
  | "view"
  | "complete"
  | "element-click"
  | "link-click"
  | "form-submit"
  | "question"
  | "download"
  | "share";

export interface EngagementSummary {
  views: number;
  completions: number;
  totalDurationMs: number;
  linkClicks: number;
  downloads: number;
}

export function completionRate(summary: EngagementSummary) {
  return summary.views === 0 ? 0 : summary.completions / summary.views;
}
