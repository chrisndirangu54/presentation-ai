import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { checkConsistency, type ConsistencyItem } from "@/lib/intelligence/consistency";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { items?: ConsistencyItem[] };
  if (!Array.isArray(body.items)) return NextResponse.json({ error: "items is required" }, { status: 400 });
  return NextResponse.json({ findings: checkConsistency(body.items) });
}
