import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { extractBrandSignals, type BrandExtractionInput } from "@/lib/brand/extractor";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as BrandExtractionInput;
  if (!body.html && !body.css && !body.text) {
    return NextResponse.json({ error: "html, css or text is required" }, { status: 400 });
  }
  return NextResponse.json({ brand: extractBrandSignals(body) });
}
