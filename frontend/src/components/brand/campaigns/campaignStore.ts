export type CampaignStatus = "Active" | "Draft" | "Completed" | "Paused" | "Archived";
export type Campaign = { id: number; name: string; description: string; brand: string; platforms: string[]; creators: number; accepted: number; budget: string; start: string; end: string; status: CampaignStatus };

let campaigns: Campaign[] = [
  { id: 1, name: "Summer Style Stories", description: "Summer fashion creator collaboration.", brand: "Aurelia Fashion", platforms: ["Instagram"], creators: 18, accepted: 12, budget: "\u20b91,50,000", start: "Jun 01, 2026", end: "Jun 30, 2026", status: "Active" },
  { id: 2, name: "Everyday Beauty Edit", description: "Skincare and everyday beauty campaign.", brand: "Glow Cosmetics", platforms: ["Instagram", "YouTube"], creators: 15, accepted: 9, budget: "\u20b92,00,000", start: "Jun 08, 2026", end: "Jul 12, 2026", status: "Active" },
  { id: 3, name: "Tech Made Simple", description: "Technology product awareness campaign.", brand: "Nexora Tech", platforms: ["YouTube"], creators: 10, accepted: 0, budget: "\u20b91,20,000", start: "Jul 15, 2026", end: "Aug 04, 2026", status: "Draft" },
  { id: 4, name: "The Sustainable Living Project", description: "Promoting sustainable lifestyle products.", brand: "Earth & Co.", platforms: ["Instagram"], creators: 20, accepted: 16, budget: "\u20b91,80,000", start: "Apr 18, 2026", end: "May 28, 2026", status: "Completed" },
  { id: 5, name: "A Softer Kind of Ritual", description: "Slow living and wellness storytelling.", brand: "Hearth Home", platforms: ["Instagram", "YouTube"], creators: 24, accepted: 21, budget: "\u20b92,40,000", start: "May 05, 2026", end: "Jun 20, 2026", status: "Active" },
  { id: 6, name: "Move With Intention", description: "A performance-led fitness creator series.", brand: "Forma Athletics", platforms: ["YouTube"], creators: 12, accepted: 8, budget: "\u20b91,60,000", start: "Mar 10, 2026", end: "Apr 18, 2026", status: "Completed" },
  { id: 7, name: "Weekend Table", description: "Food, hosting and shared moments.", brand: "Morrow Kitchen", platforms: ["Instagram"], creators: 9, accepted: 4, budget: "\u20b990,000", start: "Aug 01, 2026", end: "Aug 30, 2026", status: "Paused" },
  { id: 8, name: "The New Neutral", description: "A creator-led launch for the new collection.", brand: "Aurelia Fashion", platforms: ["Instagram"], creators: 16, accepted: 0, budget: "\u20b91,35,000", start: "Sep 02, 2026", end: "Sep 30, 2026", status: "Archived" },
];

export function getCampaigns() { return campaigns.map((campaign) => ({ ...campaign, platforms: [...campaign.platforms] })); }
export function addCampaign(campaign: Campaign) { campaigns = [campaign, ...campaigns]; }
