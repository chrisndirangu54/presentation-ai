export type ChartType =
  | "bar" | "stacked-bar" | "line" | "area" | "pie" | "donut"
  | "scatter" | "bubble" | "histogram" | "heatmap" | "radar"
  | "treemap" | "waterfall" | "sankey" | "gantt" | "funnel"
  | "gauge" | "choropleth" | "geo-bubble" | "box-plot"
  | "candlestick" | "combo";

export interface ChartSpec {
  type: ChartType;
  title: string;
  subtitle?: string;
  xField?: string;
  yFields?: string[];
  categoryField?: string;
  seriesField?: string;
  data: Array<Record<string, string | number | boolean | null>>;
  insight?: string;
  sourceLabel?: string;
  accessibilityLabel?: string;
}

export function recommendChart(
  rows: Array<Record<string, unknown>>,
): ChartType {
  if (!rows.length) return "bar";
  const keys = Object.keys(rows[0] ?? {});
  const numeric = keys.filter((key) =>
    rows.some((row) => typeof row[key] === "number"),
  );
  const temporal = keys.some((key) =>
    /(date|time|year|month|quarter)/i.test(key),
  );
  if (temporal && numeric.length) return "line";
  if (numeric.length >= 2) return "scatter";
  if (numeric.length === 1 && rows.length <= 8) return "bar";
  return "bar";
}
