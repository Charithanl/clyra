import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getBrandCampaignRows } from "@/lib/shared/services";

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = getBrandCampaignRows().find((entry) => String(entry.id) === id);
  if (!campaign) return <div className="brand-content"><div className="brand-placeholder"><h1>Campaign not found</h1><Link href="/brand/campaigns">Back to campaigns <ArrowLeft size={13} /></Link></div></div>;
  return <div className="brand-content"><Link className="profile-back" href="/brand/campaigns"><ArrowLeft size={13} /> Back to campaigns</Link><div className="brand-welcome"><div><div className="brand-overline">CAMPAIGN / DETAILS</div><h1>{campaign.name}</h1><p>{campaign.description}</p></div><span className={`brand-status ${campaign.status.toLowerCase()}`}>{campaign.status}</span></div><section className="brand-panel"><div className="brand-panel-head"><div><h2>{campaign.brand}</h2><p>{campaign.description}</p></div><CalendarDays size={18} /></div><div className="brand-metric-grid" style={{ marginTop: 20 }}><div className="brand-metric"><div>Platforms</div><strong>{campaign.platforms.join(" · ")}</strong></div><div className="brand-metric"><div>Creators</div><strong>{campaign.creators}</strong></div><div className="brand-metric"><div>Budget</div><strong>{campaign.budget}</strong></div><div className="brand-metric"><div>Timeline</div><strong>{campaign.start}</strong><small>to {campaign.end}</small></div></div></section></div>;
}
