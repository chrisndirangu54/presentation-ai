export const platformCapabilities = {
  creation: [
    "AI outline and slide generation",
    "presentation director",
    "speaker notes",
    "slide expansion and compression",
    "automatic narrative planning",
    "translation and localization",
    "brand-aware generation",
  ],
  research: [
    "PDF, Office, CSV, URL and media ingestion",
    "RAG and source retrieval",
    "citation-aware generation",
    "fact-check workflow",
    "web research adapters",
    "data-to-chart recommendations",
  ],
  design: [
    "themes and brand kits",
    "AI redesign",
    "charts, diagrams and infographics",
    "maps, timelines and equations",
    "image and video generation adapters",
    "accessibility checks",
  ],
  collaboration: [
    "workspaces and organizations",
    "RBAC",
    "comments and threads",
    "version history",
    "sharing controls",
    "audit logs",
  ],
  platform: [
    "model routing",
    "usage metering",
    "API credentials",
    "webhooks",
    "templates",
    "exports",
    "admin controls",
  ],
} as const;

export type CapabilityGroup = keyof typeof platformCapabilities;
