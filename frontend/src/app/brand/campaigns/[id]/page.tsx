"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import type { CampaignRow } from "@/components/brand/campaigns/campaignStore";
import { getSharedCampaignById, toLegacyCampaign } from "@/lib/shared/services";

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const repositoryId = /^\d+$/.test(id) ? `brand-${id}` : id;
    const record = getSharedCampaignById(repositoryId);
    setCampaign(record ? toLegacyCampaign(record) : null);
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <div className="brand-content">
        <div className="brand-placeholder" role="status">Loading campaign…</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="brand-content">
        <div className="brand-placeholder">
          <h1>Campaign not found</h1>
          <Link href="/brand/campaigns">Back to campaigns <ArrowLeft size={13} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-content">
      <Link className="profile-back" href="/brand/campaigns"><ArrowLeft size={13} /> Back to campaigns</Link>
      <div className="brand-welcome">
        <div>
          <div className="brand-overline">CAMPAIGN / DETAILS</div>
          <h1>{campaign.name}</h1>
          <p>{campaign.description}</p>
        </div>
        <span className={`brand-status ${campaign.status.toLowerCase()}`}>{campaign.status}</span>
      </div>
      <section className="brand-panel">
        <div className="brand-panel-head">
          <div><h2>{campaign.brand}</h2><p>{campaign.description}</p></div>
          <CalendarDays size={18} />
        </div>
        <div className="brand-metric-grid" style={{ marginTop: 20 }}>
          <div className="brand-metric"><div>Platforms</div><strong>{campaign.platforms.join(" · ")}</strong></div>
          <div className="brand-metric"><div>Accepted / participating</div><strong>{campaign.accepted} / {campaign.creators}</strong></div>
          <div className="brand-metric"><div>Budget</div><strong>{campaign.budget}</strong></div>
          <div className="brand-metric"><div>Timeline</div><strong>{campaign.start}</strong><small>to {campaign.end}</small></div>
        </div>
      </section>
    </div>
  );
}
