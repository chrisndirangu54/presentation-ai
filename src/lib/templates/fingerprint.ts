import { createHash } from "node:crypto";

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function fingerprint(value: unknown) {
  return createHash("sha256").update(stable(value)).digest("hex");
}

export function similarityByHash(a: string, b: string) {
  if (a.length !== b.length || !a.length) return 0;
  let same = 0;
  for (let index = 0; index < a.length; index++) if (a[index] === b[index]) same++;
  return same / a.length;
}
