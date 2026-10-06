import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  validateDiagram,
  type DiagramSpec,
} from "@/lib/visuals/diagram-spec";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const spec = (await request.json()) as DiagramSpec;
  if (!spec.title?.trim() || !Array.isArray(spec.nodes) || !Array.isArray(spec.edges)) {
    return NextResponse.json(
      { error: "title, nodes and edges are required" },
      { status: 400 },
    );
  }

  const validation = validateDiagram(spec);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Invalid diagram", validation },
      { status: 422 },
    );
  }

  return NextResponse.json({
    spec: {
      ...spec,
      direction: spec.direction ?? "LR",
    },
    validation,
  });
}
