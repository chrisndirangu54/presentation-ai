import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  planInPlaceEdit,
  type InPlaceEditRequest,
} from "@/lib/editor/in-place";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as InPlaceEditRequest;
  if (!input.elementId || !input.target || !input.command) {
    return NextResponse.json(
      { error: "elementId, target and command are required" },
      { status: 400 },
    );
  }

  return NextResponse.json({ plan: planInPlaceEdit(input) });
}
