import { notFound } from "next/navigation";
import CreatorCampaignDetail from "@/components/creator/CreatorCampaignDetail";
import { getCreatorCampaignById } from "@/lib/shared/services";
export default async function CampaignDetailPage({ params }: { params: Promise<{ campaignId: string }> }) { const { campaignId } = await params; const campaign = getCreatorCampaignById(campaignId); if (!campaign) notFound(); return <CreatorCampaignDetail campaign={campaign} />; }
