export interface BuiltInTemplate {
  id: string;
  name: string;
  kind: string;
  category: string;
  tags: string[];
  infographicHeavy?: boolean;
  premium?: boolean;
}

export const builtInTemplates: BuiltInTemplate[] = [
  { id:"pitch-modern", name:"Modern Investor Pitch", kind:"presentation", category:"Startup", tags:["investor","startup","fundraising"], infographicHeavy:true },
  { id:"pitch-minimal", name:"Minimal Venture Deck", kind:"presentation", category:"Startup", tags:["minimal","venture","founder"], infographicHeavy:false },
  { id:"sales-story", name:"Sales Story", kind:"presentation", category:"Sales", tags:["sales","product","conversion"], infographicHeavy:true },
  { id:"product-launch", name:"Product Launch", kind:"presentation", category:"Marketing", tags:["launch","product","campaign"], infographicHeavy:true },
  { id:"research-defense", name:"Research Defense", kind:"presentation", category:"Academic", tags:["research","thesis","academic"], infographicHeavy:true },
  { id:"lecture-visual", name:"Visual Lecture", kind:"presentation", category:"Education", tags:["teaching","lecture","classroom"], infographicHeavy:true },
  { id:"ngo-impact", name:"NGO Impact Report", kind:"presentation", category:"Impact", tags:["ngo","impact","sdg"], infographicHeavy:true },
  { id:"annual-review", name:"Annual Business Review", kind:"presentation", category:"Business", tags:["annual","kpi","strategy"], infographicHeavy:true },
  { id:"strategy-roadmap", name:"Strategy Roadmap", kind:"presentation", category:"Strategy", tags:["roadmap","strategy","execution"], infographicHeavy:true },
  { id:"executive-brief", name:"Executive Brief", kind:"document", category:"Business", tags:["executive","brief","decision"], infographicHeavy:true },
  { id:"business-proposal", name:"Business Proposal", kind:"document", category:"Business", tags:["proposal","client","services"], infographicHeavy:true },
  { id:"whitepaper-tech", name:"Technology Whitepaper", kind:"whitepaper", category:"Technical", tags:["whitepaper","technical","research"], infographicHeavy:true },
  { id:"case-study", name:"Case Study", kind:"document", category:"Marketing", tags:["case-study","proof","customer"], infographicHeavy:true },
  { id:"grant-proposal", name:"Grant Proposal", kind:"document", category:"Nonprofit", tags:["grant","funding","impact"], infographicHeavy:false },
  { id:"feasibility-study", name:"Feasibility Study", kind:"document", category:"Strategy", tags:["feasibility","analysis","investment"], infographicHeavy:true },
  { id:"training-manual", name:"Training Manual", kind:"document", category:"Education", tags:["training","manual","learning"], infographicHeavy:true },
  { id:"kpi-dashboard", name:"KPI Dashboard", kind:"dashboard", category:"Analytics", tags:["kpi","dashboard","metrics"], infographicHeavy:true },
  { id:"financial-model", name:"Financial Model", kind:"spreadsheet", category:"Finance", tags:["finance","forecast","budget"], infographicHeavy:true },
  { id:"budget-planner", name:"Budget Planner", kind:"spreadsheet", category:"Finance", tags:["budget","planning","variance"], infographicHeavy:true },
  { id:"inventory-control", name:"Inventory Control", kind:"spreadsheet", category:"Operations", tags:["inventory","stock","operations"], infographicHeavy:true },
  { id:"crm-pipeline", name:"CRM Pipeline", kind:"spreadsheet", category:"Sales", tags:["crm","sales","pipeline"], infographicHeavy:true },
  { id:"risk-register", name:"Risk Register", kind:"spreadsheet", category:"Operations", tags:["risk","controls","governance"], infographicHeavy:true },
  { id:"data-story", name:"Data Story Infographic", kind:"infographic", category:"Analytics", tags:["data","storytelling","charts"], infographicHeavy:true },
  { id:"process-explainer", name:"Process Explainer", kind:"infographic", category:"Business", tags:["process","steps","workflow"], infographicHeavy:true },
  { id:"impact-infographic", name:"Impact Infographic", kind:"infographic", category:"Impact", tags:["impact","metrics","sdg"], infographicHeavy:true },
  { id:"market-landscape", name:"Market Landscape", kind:"infographic", category:"Strategy", tags:["market","competition","analysis"], infographicHeavy:true },
  { id:"health-explainer", name:"Health Explainer", kind:"infographic", category:"Health", tags:["health","education","statistics"], infographicHeavy:true },
  { id:"education-summary", name:"Education Summary", kind:"infographic", category:"Education", tags:["education","learning","summary"], infographicHeavy:true },
  { id:"geo-story", name:"Geospatial Story", kind:"infographic", category:"Geospatial", tags:["map","geo","location"], infographicHeavy:true },
  { id:"flow-business", name:"Business Process Flow", kind:"flowchart", category:"Business", tags:["flowchart","process","operations"], infographicHeavy:true },
  { id:"swimlane-ops", name:"Operations Swimlane", kind:"flowchart", category:"Operations", tags:["swimlane","workflow","roles"], infographicHeavy:true },
  { id:"system-architecture", name:"System Architecture", kind:"diagram", category:"Technology", tags:["architecture","software","cloud"], infographicHeavy:true },
  { id:"network-topology", name:"Network Topology", kind:"diagram", category:"Technology", tags:["network","infrastructure","it"], infographicHeavy:true },
  { id:"org-chart", name:"Organization Chart", kind:"diagram", category:"HR", tags:["org","team","hierarchy"], infographicHeavy:true },
  { id:"decision-tree", name:"Decision Tree", kind:"diagram", category:"Strategy", tags:["decision","tree","logic"], infographicHeavy:true },
  { id:"mind-map-ideas", name:"Idea Mind Map", kind:"mind-map", category:"General", tags:["mindmap","ideas","brainstorm"], infographicHeavy:true },
  { id:"timeline-history", name:"Historical Timeline", kind:"timeline", category:"Education", tags:["history","timeline","events"], infographicHeavy:true },
  { id:"roadmap-product", name:"Product Roadmap", kind:"timeline", category:"Product", tags:["roadmap","product","milestones"], infographicHeavy:true },
  { id:"academic-poster", name:"Academic Poster", kind:"poster", category:"Academic", tags:["poster","research","conference"], infographicHeavy:true },
  { id:"event-poster", name:"Event Poster", kind:"poster", category:"Marketing", tags:["event","poster","promotion"], infographicHeavy:true },
  { id:"linkedin-carousel", name:"LinkedIn Insight Carousel", kind:"social-carousel", category:"Social", tags:["linkedin","carousel","thought-leadership"], infographicHeavy:true },
  { id:"instagram-carousel", name:"Instagram Education Carousel", kind:"social-carousel", category:"Social", tags:["instagram","carousel","education"], infographicHeavy:true },
  { id:"company-onepager", name:"Company One-Pager", kind:"one-pager", category:"Business", tags:["company","overview","sales"], infographicHeavy:true },
  { id:"product-onepager", name:"Product One-Pager", kind:"one-pager", category:"Product", tags:["product","features","benefits"], infographicHeavy:true },
];
