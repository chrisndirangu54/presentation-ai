export interface BrandExtractionInput {
  html?: string;
  css?: string;
  text?: string;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function extractBrandSignals(input: BrandExtractionInput) {
  const source = [input.html, input.css].filter(Boolean).join("\n");
  const colors = unique(
    [...source.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0].toLowerCase()),
  ).slice(0, 12);
  const fontFamilies = unique(
    [...source.matchAll(/font-family\s*:\s*([^;}]+)/gi)]
      .map((match) => match[1]?.trim().replace(/["']/g, ""))
      .filter((value): value is string => Boolean(value)),
  ).slice(0, 8);
  const logoCandidates = unique(
    [...source.matchAll(/(?:src|href)=["']([^"']*(?:logo|brand)[^"']*)["']/gi)]
      .map((match) => match[1]!)
      .filter(Boolean),
  ).slice(0, 8);
  const text = input.text ?? "";
  const toneWords = ["professional", "friendly", "bold", "minimal", "premium", "technical", "playful"]
    .filter((word) => text.toLowerCase().includes(word));

  return {
    colors,
    fontFamilies,
    logoCandidates,
    toneHints: toneWords,
    confidence: {
      colors: colors.length ? "medium" : "low",
      typography: fontFamilies.length ? "medium" : "low",
      logos: logoCandidates.length ? "medium" : "low",
    },
  };
}
