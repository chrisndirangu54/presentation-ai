export interface TemplateStyleSystem {
  typography?: unknown;
  palette?: unknown;
  spacing?: unknown;
  charts?: unknown;
  icons?: unknown;
  motion?: unknown;
}

export interface TemplateRemixRequest {
  layoutSource?: TemplateStyleSystem;
  typographySource?: TemplateStyleSystem;
  visualSource?: TemplateStyleSystem;
}

export function remixTemplate(input: TemplateRemixRequest): TemplateStyleSystem {
  return {
    spacing: input.layoutSource?.spacing,
    typography: input.typographySource?.typography ?? input.layoutSource?.typography,
    palette: input.visualSource?.palette ?? input.layoutSource?.palette,
    charts: input.visualSource?.charts,
    icons: input.visualSource?.icons,
    motion: input.visualSource?.motion,
  };
}
