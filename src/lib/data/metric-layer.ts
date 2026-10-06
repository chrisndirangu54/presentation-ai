export interface MetricDefinitionInput {
  name: string;
  description?: string;
  formula?: string;
  aggregation?: "sum" | "avg" | "min" | "max" | "count" | "latest";
  unit?: string;
  dimensions?: string[];
}

export function validateMetricDefinition(input: MetricDefinitionInput) {
  const issues: string[] = [];
  if (!input.name.trim()) issues.push("Metric name is required");
  if (input.formula && /;|\b(drop|delete|insert|update|alter|truncate)\b/i.test(input.formula)) {
    issues.push("Metric formula contains disallowed mutation syntax");
  }
  return { valid: issues.length === 0, issues };
}
