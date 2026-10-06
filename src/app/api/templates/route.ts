import { NextResponse } from "next/server";
import { builtInTemplates } from "@/lib/templates/built-in";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q")?.toLowerCase();

  const templates = builtInTemplates.filter((template) => {
    if (kind && template.kind !== kind) return false;
    if (category && template.category !== category) return false;
    if (q) {
      const haystack = [template.name, template.kind, template.category, ...template.tags]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return NextResponse.json({ templates, count: templates.length });
}
