import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { resolveLayoutPreferences } from "@/server/layout-learning";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const weights = await resolveLayoutPreferences({
    userId: session.user.id,
    workspaceId: url.searchParams.get("workspaceId") ?? undefined,
    industry: url.searchParams.get("industry") ?? undefined,
    audience: url.searchParams.get("audience") ?? undefined,
    target: url.searchParams.get("target") ?? undefined,
    isAdmin: session.user.isAdmin,
  });

  return NextResponse.json({ weights });
}
