import CreatorCampaignWorkspace from "@/components/creator/CreatorCampaignWorkspace";
export default async function CampaignWorkspacePage({ params }: { params: Promise<{ campaignId: string }> }) { const { campaignId } = await params; return <CreatorCampaignWorkspace campaignId={campaignId} />; }
