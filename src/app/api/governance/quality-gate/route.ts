import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { runQualityGate, type QualityContext } from "@/lib/governance/quality-gate";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    artifactId?: string;
    workspaceId?: string;
    context?: QualityContext;
  };
  if (!body.artifactId || !body.context) {
    return NextResponse.json({ error: "artifactId and context are required" }, { status: 400 });
  }

  const artifact = await db.artifact.findUnique({
    where: { id: body.artifactId },
    include: { base: true, workspace: { include: { members: true } } },
  });
  if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });

  const member = artifact.workspace?.members.find((item) => item.userId === session.user.id);
  const allowed =
    artifact.base.userId === session.user.id ||
    session.user.isAdmin ||
    Boolean(member && ["OWNER","ADMIN","EDITOR"].includes(member.role));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = runQualityGate(body.context);
  const run = await db.qualityGateRun.create({
    data: {
      workspaceId: body.workspaceId ?? artifact.workspaceId,
      artifactId: artifact.id,
      status: result.status === "pass" ? "PASS" : result.status === "warn" ? "WARN" : "BLOCK",
      score: result.score,
      findings: result.findings as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ gateRunId: run.id, ...result });
}
