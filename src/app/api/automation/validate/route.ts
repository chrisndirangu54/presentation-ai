import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  validateWorkflow,
  type WorkflowSpec,
} from "@/lib/automation/workflow";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const spec = (await request.json()) as WorkflowSpec;
  const validation = validateWorkflow(spec);
  return NextResponse.json({ validation }, { status: validation.valid ? 200 : 422 });
}
