export interface ContentComponentDescriptor {
  id: string;
  label: string;
  category: "content" | "data" | "legal" | "brand" | "visual";
  placeholders: string[];
  canLock: boolean;
}

export const contentComponents: ContentComponentDescriptor[] = [
  { id: "company-overview", label: "Company overview", category: "content", placeholders: ["companyName","summary"], canLock: true },
  { id: "team-bio", label: "Team bio", category: "content", placeholders: ["name","role","bio","photo"], canLock: false },
  { id: "approved-stat", label: "Approved statistic", category: "data", placeholders: ["value","label","source"], canLock: true },
  { id: "legal-disclaimer", label: "Legal disclaimer", category: "legal", placeholders: ["text"], canLock: true },
  { id: "brand-footer", label: "Brand footer", category: "brand", placeholders: ["logo","website","legal"], canLock: true },
  { id: "kpi-card", label: "KPI card", category: "visual", placeholders: ["value","label","delta"], canLock: false },
  { id: "case-study", label: "Case study", category: "content", placeholders: ["challenge","solution","result"], canLock: false },
  { id: "citation-block", label: "Citation block", category: "legal", placeholders: ["source","locator","url"], canLock: true },
];
