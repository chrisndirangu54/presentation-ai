import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { normalizeRenderable } from "@/lib/export/normalize";
import {
  renderBinary,
  type BinaryExportTarget,
} from "@/lib/export/renderers";

const targets = new Set<BinaryExportTarget>(["pptx", "docx", "xlsx", "pdf"]);

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "artifact";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    documentId?: string;
    target?: BinaryExportTarget;
  };

  if (!body.documentId || !body.target || !targets.has(body.target)) {
    return NextResponse.json(
      { error: "documentId and target (pptx, docx, xlsx, pdf) are required" },
      { status: 400 },
    );
  }

  const base = await db.baseDocument.findUnique({
    where: { id: body.documentId },
    include: {
      presentation: true,
      artifact: true,
      workspace: { include: { members: true } },
    },
  });

  if (!base) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const isOwner = base.userId === session.user.id;
  const isWorkspaceMember = base.workspace?.members.some(
    (member) => member.userId === session.user.id,
  );
  if (!isOwner && !isWorkspaceMember && !session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = base.presentation?.content ?? base.artifact?.content ?? {};
  const normalized = normalizeRenderable(base.title, payload);
  const rendered = await renderBinary(body.target, normalized);
  const fileName = `${safeFilename(base.title)}.${rendered.extension}`;

  const bodyBuffer = rendered.bytes.buffer.slice(
    rendered.bytes.byteOffset,
    rendered.bytes.byteOffset + rendered.bytes.byteLength,
  ) as ArrayBuffer;

  return new Response(bodyBuffer, {
    status: 200,
    headers: {
      "content-type": rendered.contentType,
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "private, no-store",
    },
  });
}
