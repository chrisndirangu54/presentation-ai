import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  infographicDensity,
  type InfographicSpec,
} from "@/lib/visuals/infographic-spec";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const spec = (await request.json()) as InfographicSpec;
  if (!spec.title?.trim() || !Array.isArray(spec.blocks) || !spec.blocks.length) {
    return NextResponse.json(
      { error: "title and at least one infographic block are required" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    spec: {
      ...spec,
      orientation: spec.orientation ?? "portrait",
    },
    metrics: infographicDensity(spec),
  });
}
