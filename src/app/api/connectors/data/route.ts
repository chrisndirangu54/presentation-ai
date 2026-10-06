import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    workspaceId?: string;
    name?: string;
    kind?: "GOOGLE_SHEETS" | "EXCEL" | "REST_API";
    configuration?: Record<string, unknown>;
    oauthConnectionId?: string;
  };

  if (!body.workspaceId || !body.name || !body.kind || !body.configuration) {
    return NextResponse.json({ error: "workspaceId, name, kind and configuration are required" }, { status: 400 });
  }

  const workspace = await db.workspace.findFirst({
    where: {
      id: body.workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id, role: { in: ["OWNER","ADMIN","EDITOR"] } } } },
      ],
    },
  });
  if (!workspace && !session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (body.oauthConnectionId) {
    const oauth = await db.oAuthConnection.findFirst({
      where: { id: body.oauthConnectionId, userId: session.user.id },
    });
    if (!oauth) return NextResponse.json({ error: "OAuth connection not found" }, { status: 404 });
  }

  const connection = await db.dataConnection.create({
    data: {
      workspaceId: body.workspaceId,
      name: body.name,
      kind: body.kind,
      configuration: body.configuration as Prisma.InputJsonValue,
      secretRef: body.oauthConnectionId,
    },
  });

  return NextResponse.json({ connection }, { status: 201 });
}
