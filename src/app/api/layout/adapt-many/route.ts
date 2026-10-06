import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  generateAdaptiveLayout,
  type BrandTokens,
  type LayoutTarget,
} from "@/lib/layout/engine";
import { auditAdaptiveLayout } from "@/lib/layout/quality";
import { decideResponsiveContent } from "@/lib/layout/transform";
import type { SemanticGraph } from "@/lib/semantic/graph";

const DEFAULT_TARGETS: LayoutTarget[] = [
  "deck-16x9",
  "a4-portrait",
  "dashboard-desktop",
  "mobile",
  "infographic",
  "poster-a3",
  "social-square",
  "social-portrait",
];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    graph?: SemanticGraph;
    targets?: LayoutTarget[];
    brandTokens?: BrandTokens;
  };

  if (!body.graph) {
    return NextResponse.json({ error: "graph is required" }, { status: 400 });
  }

  const targets = body.targets?.length ? body.targets : DEFAULT_TARGETS;
  const variants = targets.map((target) => {
    const layout = generateAdaptiveLayout(body.graph!, target, body.brandTokens);
    return {
      target,
      layout,
      quality: auditAdaptiveLayout(layout),
      contentDecisions: decideResponsiveContent(body.graph!, target),
    };
  });

  return NextResponse.json({ variants });
}
