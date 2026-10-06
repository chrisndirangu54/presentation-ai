export type FreshnessStatus = "fresh" | "stale" | "unknown" | "error";

export interface FreshnessInput {
  observedAt?: string | Date | null;
  maxAgeMinutes?: number;
  failed?: boolean;
}

export function evaluateFreshness(input: FreshnessInput): FreshnessStatus {
  if (input.failed) return "error";
  if (!input.observedAt) return "unknown";
  const observed = new Date(input.observedAt).getTime();
  if (!Number.isFinite(observed)) return "unknown";
  const maxAge = Math.max(1, input.maxAgeMinutes ?? 1440) * 60_000;
  return Date.now() - observed <= maxAge ? "fresh" : "stale";
}
