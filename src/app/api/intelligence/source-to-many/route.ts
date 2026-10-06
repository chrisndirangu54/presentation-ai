import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  buildSourceToManyPlan,
  type SourceToManyRequest,
} from "@/lib/pipelines/source-to-many";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SourceToManyRequest;
  if (!Array.isArray(body.sourceIds) || !body.sourceIds.length) {
    return NextResponse.json({ error: "At least one source is required" }, { status: 400 });
  }
  if (!Array.isArray(body.outputs) || !body.outputs.length) {
    return NextResponse.json({ error: "At least one output is required" }, { status: 400 });
  }

  return NextResponse.json({ plan: buildSourceToManyPlan(body) });
}
