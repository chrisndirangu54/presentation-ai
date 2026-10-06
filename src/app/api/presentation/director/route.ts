import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  createDeterministicPresentationPlan,
  type DirectorBrief,
} from "@/lib/ai/presentation-director";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brief = (await request.json()) as DirectorBrief;
  if (!brief.topic?.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  const plan = createDeterministicPresentationPlan(brief);
  return NextResponse.json({ plan });
}
