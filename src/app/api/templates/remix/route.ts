import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { remixTemplate, type TemplateRemixRequest } from "@/lib/templates/remix";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as TemplateRemixRequest;
  return NextResponse.json({ styleSystem: remixTemplate(body) });
}
