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
  ["pitch-modern","Modern Investor Pitch","presentation","Startup",["investor","startup","fundraising"],true],
  ["pitch-minimal","Minimal Venture Deck","presentation","Startup",["minimal","venture","founder"],false],
  ["sales-story","Sales Story","presentation","Sales",["sales","product","conversion"],true],
  ["product-launch","Product Launch","presentation","Marketing",["launch","product","campaign"],true],
  ["research-defense","Research Defense","presentation","Academic",["research","thesis","academic"],true],
  ["lecture-visual","Visual Lecture","presentation","Education",["teaching","lecture","classroom"],true],
  ["ngo-impact","NGO Impact Report","presentation","Impact",["ngo","impact","sdg"],true],
  ["annual-review","Annual Business Review","presentation","Business",["annual","kpi","strategy"],true],
  ["strategy-roadmap","Strategy Roadmap","presentation","Strategy",["roadmap","strategy","execution"],true],
  ["executive-brief","Executive Brief","document","Business",["executive","brief","decision"],true],
  ["business-proposal","Business Proposal","document","Business",["proposal","client","services"],true],
  ["whitepaper-tech","Technology Whitepaper","whitepaper","Technical",["whitepaper","technical","research"],true],
  ["case-study","Case Study","document","Marketing",["case-study","proof","customer"],true],
  ["grant-proposal","Grant Proposal","document","Nonprofit",["grant","funding","impact"],false],
  ["feasibility-study","Feasibility Study","document","Strategy",["feasibility","analysis","investment"],true],
  ["training-manual","Training Manual","document","Education",["training","manual","learning"],true],
  ["kpi-dashboard","KPI Dashboard","dashboard","Analytics",["kpi","dashboard","metrics"],true],
  ["financial-model","Financial Model","spreadsheet","Finance",["finance","forecast","budget"],true],
  ["budget-planner","Budget Planner","spreadsheet","Finance",["budget","planning","variance"],true],
  ["inventory-control","Inventory Control","spreadsheet","Operations",["inventory","stock","operations"],true],
  ["crm-pipeline","CRM Pipeline","spreadsheet","Sales",["crm","sales","pipeline"],true],
  ["risk-register","Risk Register","spreadsheet","Operations",["risk","controls","governance"],true],
  ["data-story","Data Story Infographic","infographic","Analytics",["data","storytelling","charts"],true],
  ["process-explainer","Process Explainer","infographic","Business",["process","steps","workflow"],true],
  ["impact-infographic","Impact Infographic","infographic","Impact",["impact","metrics","sdg"],true],
  ["market-landscape","Market Landscape","infographic","Strategy",["market","competition","analysis"],true],
  ["health-explainer","Health Explainer","infographic","Health",["health","education","statistics"],true],
  ["education-summary","Education Summary","infographic","Education",["education","learning","summary"],true],
  ["geo-story","Geospatial Story","infographic","Geospatial",["map","geo","location"],true],
  ["flow-business","Business Process Flow","flowchart","Business",["flowchart","process","operations"],true],
  ["swimlane-ops","Operations Swimlane","flowchart","Operations",["swimlane","workflow","roles"],true],
  ["system-architecture","System Architecture","diagram","Technology",["architecture","software","cloud"],true],
  ["network-topology","Network Topology","diagram","Technology",["network","infrastructure","it"],true],
  ["org-chart","Organization Chart","diagram","HR",["org","team","hierarchy"],true],
  ["decision-tree","Decision Tree","diagram","Strategy",["decision","tree","logic"],true],
  ["mind-map-ideas","Idea Mind Map","mind-map","General",["mindmap","ideas","brainstorm"],true],
  ["timeline-history","Historical Timeline","timeline","Education",["history","timeline","events"],true],
  ["roadmap-product","Product Roadmap","timeline","Product",["roadmap","product","milestones"],true],
  ["academic-poster","Academic Poster","poster","Academic",["poster","research","conference"],true],
  ["event-poster","Event Poster","poster","Marketing",["event","poster","promotion"],true],
  ["linkedin-carousel","LinkedIn Insight Carousel","social-carousel","Social",["linkedin","carousel","thought-leadership"],true],
  ["instagram-carousel","Instagram Education Carousel","social-carousel","Social",["instagram","carousel","education"],true],
  ["company-onepager","Company One-Pager","one-pager","Business",["company","overview","sales"],true],
  ["product-onepager","Product One-Pager","one-pager","Product",["product","features","benefits"],true],
].map(([id,name,kind,category,tags,infographicHeavy]) => ({
  id: id as string,
  name: name as string,
  kind: kind as string,
  category: category as string,
  tags: tags as string[],
  infographicHeavy: Boolean(infographicHeavy),
}));
