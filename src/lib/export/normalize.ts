export interface RenderBlock {
  type: "heading" | "paragraph" | "image" | "chart" | "table" | "list";
  text?: string;
  imageUrl?: string;
  data?: unknown;
}

export interface RenderPage {
  title?: string;
  blocks: RenderBlock[];
}

export interface RenderDocument {
  title: string;
  pages: RenderPage[];
  rows?: Array<Record<string, string | number | boolean | null>>;
}

function textFromNode(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const value = node as Record<string, unknown>;
  if (typeof value.text === "string") return value.text;
  const children = Array.isArray(value.children) ? value.children : [];
  return children.map(textFromNode).join(" ").replace(/\s+/g, " ").trim();
}

function blocksFromNodes(nodes: unknown[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const value = node as Record<string, unknown>;
    const type = String(value.type ?? "");
    if (type === "img") {
      blocks.push({ type: "image", imageUrl: String(value.url ?? ""), text: String(value.query ?? "") });
      continue;
    }
    if (type === "chart") {
      blocks.push({ type: "chart", data: value.data, text: String(value.chartType ?? "chart") });
      continue;
    }
    const text = textFromNode(value);
    if (!text) continue;
    blocks.push({
      type: type.startsWith("h") ? "heading" : "paragraph",
      text,
    });
  }
  return blocks;
}

export function normalizeRenderable(
  title: string,
  payload: unknown,
): RenderDocument {
  const root = (payload ?? {}) as Record<string, unknown>;
  const slides = Array.isArray(root.slides)
    ? root.slides
    : Array.isArray(payload)
      ? payload
      : [];

  if (slides.length) {
    return {
      title,
      pages: slides.map((slide) => {
        const s = (slide ?? {}) as Record<string, unknown>;
        const nodes = Array.isArray(s.content) ? s.content : [];
        const blocks = blocksFromNodes(nodes);
        const heading = blocks.find((block) => block.type === "heading")?.text;
        return { title: heading, blocks };
      }),
    };
  }

  const rows = Array.isArray(root.rows)
    ? (root.rows as Array<Record<string, string | number | boolean | null>>)
    : undefined;

  const content = Array.isArray(root.content) ? root.content : [];
  return {
    title,
    pages: [{ title, blocks: blocksFromNodes(content) }],
    rows,
  };
}
