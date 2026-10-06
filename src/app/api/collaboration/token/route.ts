import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

function sign(payload: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artifactId = new URL(request.url).searchParams.get("artifactId");
  if (!artifactId) return NextResponse.json({ error: "artifactId is required" }, { status: 400 });

  const base = await db.baseDocument.findUnique({
    where: { id: artifactId },
    include: { workspace: { include: { members: true } } },
  });
  if (!base) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });

  const allowed =
    base.userId === session.user.id ||
    session.user.isAdmin ||
    base.workspace?.members.some((member) => member.userId === session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = Buffer.from(JSON.stringify({
    artifactId,
    userId: session.user.id,
    exp: Date.now() + 5 * 60 * 1000,
  })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;

  return NextResponse.json({
    token,
    wsUrl: process.env.NEXT_PUBLIC_COLLABORATION_URL ?? null,
  });
}
