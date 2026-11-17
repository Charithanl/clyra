import { getBrandCampaignRows, saveBrandCampaign, updateBrandCampaign } from "@/lib/shared/services";

export type CampaignStatus = "Active" | "Draft" | "Completed" | "Paused" | "Archived";
export type CampaignRow = { id: number; name: string; description: string; brand: string; platforms: string[]; creators: number; accepted: number; budget: string; start: string; end: string; status: CampaignStatus };

/** Compatibility adapter for the Brand campaign table. Domain state lives in campaignRepository. */
export function getCampaigns(): CampaignRow[] { return getBrandCampaignRows(); }
export function addCampaign(campaign: CampaignRow) { saveBrandCampaign(campaign); }
export function updateCampaign(id: number, changes: Partial<CampaignRow>) { updateBrandCampaign(id, changes); }
