export interface TypographyFitRequest {
  text: string;
  width: number;
  height: number;
  minFontSize?: number;
  maxFontSize?: number;
  lineHeight?: number;
}

export interface TypographyFitResult {
  fontSize: number;
  lineHeight: number;
  estimatedLines: number;
  fits: boolean;
  overflowRatio: number;
}

export function fitTypography(input: TypographyFitRequest): TypographyFitResult {
  const min = input.minFontSize ?? 12;
  const max = input.maxFontSize ?? 44;
  const lineHeight = input.lineHeight ?? 1.25;
  const chars = input.text.length;

  for (let size = max; size >= min; size--) {
    const charsPerLine = Math.max(1, Math.floor(input.width / (size * 0.54)));
    const lines = Math.max(1, Math.ceil(chars / charsPerLine));
    const requiredHeight = lines * size * lineHeight;
    if (requiredHeight <= input.height) {
      return {
        fontSize: size,
        lineHeight,
        estimatedLines: lines,
        fits: true,
        overflowRatio: 0,
      };
    }
  }

  const charsPerLine = Math.max(1, Math.floor(input.width / (min * 0.54)));
  const lines = Math.max(1, Math.ceil(chars / charsPerLine));
  const requiredHeight = lines * min * lineHeight;
  return {
    fontSize: min,
    lineHeight,
    estimatedLines: lines,
    fits: false,
    overflowRatio: Math.max(0, requiredHeight / input.height - 1),
  };
}
