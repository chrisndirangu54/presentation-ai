export interface ConsistencyItem {
  key: string;
  artifactId: string;
  elementId?: string;
  value: string | number | boolean | null;
  unit?: string;
  observedAt?: string;
}

export interface ConsistencyFinding {
  key: string;
  severity: "warning" | "error";
  message: string;
  items: ConsistencyItem[];
}

export function checkConsistency(items: ConsistencyItem[]): ConsistencyFinding[] {
  const groups = new Map<string, ConsistencyItem[]>();
  for (const item of items) {
    const current = groups.get(item.key) ?? [];
    current.push(item);
    groups.set(item.key, current);
  }

  const findings: ConsistencyFinding[] = [];
  for (const [key, values] of groups) {
    if (values.length < 2) continue;
    const normalized = new Set(
      values.map((item) => `${item.unit ?? ""}:${String(item.value)}`),
    );
    if (normalized.size > 1) {
      findings.push({
        key,
        severity: "error",
        message: `Conflicting values detected for ${key}`,
        items: values,
      });
    }
  }
  return findings;
}
