import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    name?: string;
    target?: string;
    constraints?: unknown;
    brandTokens?: unknown;
    isDefault?: boolean;
  };

  if (!body.name || !body.target || !body.constraints) {
    return NextResponse.json(
      { error: "name, target and constraints are required" },
      { status: 400 },
    );
  }

  if (body.workspaceId) {
    const workspace = await db.workspace.findFirst({
      where: {
        id: body.workspaceId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "ADMIN", "EDITOR"] },
              },
            },
          },
        ],
      },
    });
    if (!workspace && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const profile = await db.adaptiveLayoutProfile.create({
    data: {
      workspaceId: body.workspaceId,
      name: body.name.trim(),
      target: body.target,
      constraints: body.constraints as Prisma.InputJsonValue,
      brandTokens: body.brandTokens as Prisma.InputJsonValue | undefined,
      isDefault: body.isDefault ?? false,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}
