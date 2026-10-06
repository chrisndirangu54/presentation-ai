import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    artifactId?: string;
    gateRunId?: string;
    reason?: string;
    expiresAt?: string;
  };
  if (!body.artifactId || !body.gateRunId || !body.reason?.trim()) {
    return NextResponse.json({ error: "artifactId, gateRunId and reason are required" }, { status: 400 });
  }

  const artifact = await db.artifact.findUnique({
    where: { id: body.artifactId },
    include: { base: true, workspace: { include: { members: true } } },
  });
  if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });

  const member = artifact.workspace?.members.find((item) => item.userId === session.user.id);
  const canOverride =
    session.user.isAdmin ||
    artifact.base.userId === session.user.id ||
    Boolean(member && ["OWNER", "ADMIN"].includes(member.role));
  if (!canOverride) return NextResponse.json({ error: "Admin access is required to override a publish gate" }, { status: 403 });

  const gate = await db.qualityGateRun.findFirst({
    where: { id: body.gateRunId, artifactId: body.artifactId },
  });
  if (!gate) return NextResponse.json({ error: "Quality gate run not found" }, { status: 404 });

  const override = await db.publishGateOverride.create({
    data: {
      artifactId: body.artifactId,
      gateRunId: body.gateRunId,
      actorId: session.user.id,
      reason: body.reason.trim(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return NextResponse.json({ override }, { status: 201 });
}
