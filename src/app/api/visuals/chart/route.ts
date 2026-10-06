import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  recommendChart,
  type ChartSpec,
  type ChartType,
} from "@/lib/visuals/chart-spec";

interface ChartRequest {
  title: string;
  data: Array<Record<string, string | number | boolean | null>>;
  type?: ChartType;
  subtitle?: string;
  sourceLabel?: string;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ChartRequest;
  if (!body.title?.trim() || !Array.isArray(body.data) || !body.data.length) {
    return NextResponse.json(
      { error: "A title and non-empty data array are required" },
      { status: 400 },
    );
  }

  const keys = Object.keys(body.data[0] ?? {});
  const numeric = keys.filter((key) =>
    body.data.some((row) => typeof row[key] === "number"),
  );
  const dimensions = keys.filter((key) => !numeric.includes(key));

  const spec: ChartSpec = {
    type: body.type ?? recommendChart(body.data),
    title: body.title.trim(),
    subtitle: body.subtitle,
    xField: dimensions[0],
    yFields: numeric,
    categoryField: dimensions[0],
    data: body.data,
    sourceLabel: body.sourceLabel,
    accessibilityLabel: `${body.title}. Chart generated from ${body.data.length} data rows.`,
  };

  return NextResponse.json({ spec });
}
