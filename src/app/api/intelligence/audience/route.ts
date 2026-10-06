import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  simulateAudience,
  type AudienceSimulationRequest,
} from "@/lib/intelligence/audience-simulator";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as AudienceSimulationRequest;
  if (!body.persona || !body.objective || !Array.isArray(body.claims)) {
    return NextResponse.json({ error: "persona, objective and claims are required" }, { status: 400 });
  }

  return NextResponse.json({ simulation: simulateAudience(body) });
}
