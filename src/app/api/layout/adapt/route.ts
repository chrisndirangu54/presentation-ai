import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import type { BrandTokens, LayoutTarget } from "@/lib/layout/engine";
import { auditAdaptiveLayout } from "@/lib/layout/quality";
import { solveLayoutConstraints } from "@/lib/layout/solver";
import { decideResponsiveContent } from "@/lib/layout/transform";
import type { SemanticGraph } from "@/lib/semantic/graph";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    graph?: SemanticGraph;
    target?: LayoutTarget;
    brandTokens?: BrandTokens;
    candidates?: number;
    iterations?: number;
  };

  if (!body.graph || !body.target) {
    return NextResponse.json(
      { error: "graph and target are required" },
      { status: 400 },
    );
  }

  const solved = solveLayoutConstraints(body.graph, body.target, {
    brandTokens: body.brandTokens,
    candidates: body.candidates,
    iterations: body.iterations,
  });
  const layout = solved.best.layout;
  const quality = auditAdaptiveLayout(layout);
  const contentDecisions = decideResponsiveContent(body.graph, body.target);

  return NextResponse.json({
    layout,
    quality,
    contentDecisions,
    solver: {
      bestScore: solved.best.score,
      candidates: solved.candidates.map((candidate) => ({
        id: candidate.id,
        rank: candidate.rank,
        score: candidate.score,
        layout: candidate.layout,
      })),
    },
  });
}
