export type IntegrationCategory =
  | "storage"
  | "presentation"
  | "research"
  | "media"
  | "collaboration"
  | "analytics"
  | "data"
  | "crm"
  | "automation"
  | "billing";

export interface IntegrationDescriptor {
  id: string;
  name: string;
  category: IntegrationCategory;
  capabilities: string[];
  envKeys?: string[];
}

export const integrations: IntegrationDescriptor[] = [
  { id:"google-drive", name:"Google Drive", category:"storage", capabilities:["import Docs/Sheets/Slides","source sync","asset browsing"], envKeys:["GOOGLE_DRIVE_CLIENT_ID","GOOGLE_DRIVE_CLIENT_SECRET"] },
  { id:"google-sheets", name:"Google Sheets", category:"data", capabilities:["live tabular data","scheduled refresh","chart data binding"], envKeys:["GOOGLE_DRIVE_CLIENT_ID","GOOGLE_DRIVE_CLIENT_SECRET"] },
  { id:"google-slides", name:"Google Slides", category:"presentation", capabilities:["editable export","deck synchronization"], envKeys:["GOOGLE_DRIVE_CLIENT_ID","GOOGLE_DRIVE_CLIENT_SECRET"] },
  { id:"microsoft-graph", name:"Microsoft Graph", category:"presentation", capabilities:["OneDrive import","Excel data","PowerPoint interoperability"], envKeys:["MICROSOFT_GRAPH_CLIENT_ID","MICROSOFT_GRAPH_CLIENT_SECRET"] },
  { id:"airtable", name:"Airtable", category:"data", capabilities:["base data sync","record-driven generation"] },
  { id:"notion", name:"Notion", category:"data", capabilities:["page/database ingestion","knowledge sync"] },
  { id:"sql", name:"SQL Databases", category:"data", capabilities:["query-backed charts","scheduled KPI refresh"] },
  { id:"rest-api", name:"REST APIs", category:"data", capabilities:["custom JSON feeds","webhook-triggered refresh"] },
  { id:"power-bi", name:"Power BI", category:"analytics", capabilities:["dataset/report references","analytics interchange"] },
  { id:"tableau", name:"Tableau", category:"analytics", capabilities:["visual analytics references","dashboard interchange"] },
  { id:"salesforce", name:"Salesforce", category:"crm", capabilities:["pipeline data","account reporting","sales decks"] },
  { id:"hubspot", name:"HubSpot", category:"crm", capabilities:["marketing metrics","CRM reporting","campaign summaries"] },
  { id:"tavily", name:"Tavily", category:"research", capabilities:["web research","source discovery"], envKeys:["TAVILY_API_KEY"] },
  { id:"youtube", name:"YouTube", category:"research", capabilities:["video source metadata","transcript ingestion"] },
  { id:"uploadthing", name:"UploadThing", category:"storage", capabilities:["document upload","media upload"], envKeys:["UPLOADTHING_TOKEN"] },
  { id:"replicate", name:"Replicate", category:"media", capabilities:["image generation","video generation"], envKeys:["REPLICATE_API_TOKEN"] },
  { id:"elevenlabs", name:"ElevenLabs", category:"media", capabilities:["narration","voice generation"], envKeys:["ELEVENLABS_API_KEY"] },
  { id:"slack", name:"Slack", category:"collaboration", capabilities:["share artifacts","review notifications"], envKeys:["SLACK_CLIENT_ID","SLACK_CLIENT_SECRET"] },
  { id:"zapier", name:"Zapier", category:"automation", capabilities:["workflow triggers","cross-app actions"] },
  { id:"make", name:"Make", category:"automation", capabilities:["workflow orchestration","scheduled actions"] },
  { id:"stripe", name:"Stripe", category:"billing", capabilities:["subscriptions","usage billing","marketplace payments"], envKeys:["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET"] },
];

export function getIntegration(id: string) {
  return integrations.find((integration) => integration.id === id);
}
