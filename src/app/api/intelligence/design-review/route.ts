import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  reviewDesign,
  type DesignReviewInput,
} from "@/lib/design/critic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as DesignReviewInput;
  return NextResponse.json({ findings: reviewDesign(input) });
}
