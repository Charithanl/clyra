"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, BarChart3, CalendarDays, Check, FileCheck2, Megaphone, Plus, Send, Users } from "lucide-react";
import type { CampaignRow } from "@/components/brand/campaigns/campaignStore";
import type { Campaign, CampaignInvitation, ContentReview, ContentSubmission, CreatorProfile } from "@/types/shared";
import { getBrandCampaignRows, getBrandDirectoryCreatorCount, getContentReviews, getCreatorProfiles, getInvitationRecords, getSharedCampaignById, getSubmissions } from "@/lib/shared/services";

type Activity = { id: string; text: string; detail: string; timestamp: string; tone: string };
type DashboardData = {
  campaigns: CampaignRow[];
  creators: CreatorProfile[];
  creatorCount: number;
  invitations: CampaignInvitation[];
  submissions: ContentSubmission[];
  reviews: ContentReview[];
  campaignRecords: Campaign[];
  now: Date;
};

function loadDashboardData(): DashboardData {
  const campaigns = getBrandCampaignRows();
  const campaignRecords = campaigns.map((campaign) => getSharedCampaignById(`brand-${campaign.id}`)).filter((campaign): campaign is Campaign => Boolean(campaign));
  const campaignIds = new Set(campaignRecords.map((campaign) => campaign.id));
  const invitations = getInvitationRecords().filter((invitation) => campaignIds.has(invitation.campaignId));
  const submissions = getSubmissions().filter((submission) => campaignIds.has(submission.campaignId));
  const submissionIds = new Set(submissions.map((submission) => submission.id));

  return {
    campaigns,
    creators: getCreatorProfiles(),
    creatorCount: getBrandDirectoryCreatorCount(),
    invitations,
    submissions,
    reviews: getContentReviews().filter((review) => submissionIds.has(review.submissionId)),
    campaignRecords,
    now: new Date(),
  };
}

function dateLabel(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function recentActivities(data: DashboardData): Activity[] {
  const campaignNames = new Map(data.campaignRecords.map((campaign) => [campaign.id, campaign.title]));
  const creatorNames = new Map(data.creators.map((creator) => [creator.id, creator.displayName]));
  const submissionMap = new Map(data.submissions.map((submission) => [submission.id, submission]));
  const items: Activity[] = [];

  for (const campaign of data.campaignRecords) {
    if (campaign.createdAt) items.push({ id: `campaign-created-${campaign.id}`, text: "Campaign created", detail: campaign.title, timestamp: campaign.createdAt, tone: "wine" });
    if (campaign.publishedAt) items.push({ id: `campaign-published-${campaign.id}`, text: "Campaign published", detail: campaign.title, timestamp: campaign.publishedAt, tone: "yellow" });
  }
  for (const invitation of data.invitations) {
    items.push({ id: `invitation-sent-${invitation.id}`, text: "Creator invitation sent", detail: campaignNames.get(invitation.campaignId) ?? "Campaign", timestamp: invitation.sentAt, tone: "green" });
    if (invitation.respondedAt) {
      const response = invitation.status === "ACCEPTED" ? "accepted" : invitation.status === "DECLINED" ? "declined" : "responded to";
      items.push({ id: `invitation-response-${invitation.id}`, text: `Creator ${response} an invitation`, detail: campaignNames.get(invitation.campaignId) ?? "Campaign", timestamp: invitation.respondedAt, tone: invitation.status === "ACCEPTED" ? "green" : "rose" });
    }
  }
  for (const submission of data.submissions) {
    if (submission.submittedAt) {
      const creator = creatorNames.get(submission.creatorId);
      items.push({ id: `submission-${submission.id}`, text: creator ? `${creator} submitted content` : "Creator submitted content", detail: campaignNames.get(submission.campaignId) ?? "Campaign", timestamp: submission.submittedAt, tone: "rose" });
    }
  }
  for (const review of data.reviews) {
    const submission = submissionMap.get(review.submissionId);
    const decision = review.decision === "APPROVED" ? "Content approved" : review.decision === "REJECTED" ? "Content rejected" : "Revision requested";
    items.push({ id: `review-${review.id}`, text: decision, detail: submission ? campaignNames.get(submission.campaignId) ?? "Campaign" : "Submission", timestamp: review.reviewedAt, tone: review.decision === "APPROVED" ? "green" : review.decision === "REJECTED" ? "rose" : "yellow" });
  }

  return items
    .filter((item) => Number.isFinite(Date.parse(item.timestamp)) && Date.parse(item.timestamp) <= data.now.getTime())
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 5);
}

export default function BrandOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    try {
      setData(loadDashboardData());
      setError("");
    } catch {
      setError("Dashboard data could not be loaded. Please try again.");
    }
  }, [reload]);

  if (error) {
    return <div className="brand-content"><div className="brand-placeholder" role="alert"><h1>Dashboard unavailable</h1><p>{error}</p><button className="brand-create-button" onClick={() => { setData(null); setReload((value) => value + 1); }}>Retry</button></div></div>;
  }

  if (!data) {
    return <div className="brand-content"><div className="brand-placeholder" role="status"><h1>Loading dashboard…</h1><p>Loading the latest workspace records.</p></div></div>;
  }

  const activeCampaigns = data.campaigns.filter((campaign) => campaign.status === "Active");
  const draftCount = data.campaigns.filter((campaign) => campaign.status === "Draft").length;
  const completedCount = data.campaigns.filter((campaign) => campaign.status === "Completed").length;
  const pendingInvitations = data.invitations.filter((invitation) => invitation.status === "PENDING");
  const pendingSubmissions = [...new Map(data.submissions
    .filter((submission) => submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW")
    .map((submission) => [submission.id, submission])).values()];
  const pendingReviewIds = new Set(pendingSubmissions.map((submission) => submission.id));
  const activity = recentActivities(data);
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(data.now);

  return (
    <div className="brand-content">
      <section className="brand-welcome">
        <div><div className="brand-overline">{today}</div><h1>Good morning, Alex.</h1><p>Here&apos;s what&apos;s happening with your creator campaigns today.</p></div>
        <Link className="brand-create-button" href="/brand/campaigns"><Plus size={16} /> Create Campaign</Link>
      </section>

      <section className="brand-metric-grid" aria-label="Workspace metrics">
        <Metric icon={<Megaphone />} label="Total Campaigns" value={data.campaigns.length} note="Across this workspace" />
        <Metric icon={<Megaphone />} label="Active Campaigns" value={activeCampaigns.length} note="Published campaigns" />
        <Metric icon={<CalendarDays />} label="Draft Campaigns" value={draftCount} note="Not yet published" />
        <Metric icon={<Check />} label="Completed Campaigns" value={completedCount} note="Completed records" />
        <Metric icon={<Users />} label="Creator Profiles" value={data.creatorCount} note="Available creator profiles" />
        <Metric icon={<Send />} label="Pending Invitations" value={pendingInvitations.length} note="Awaiting creator response" />
        <Metric icon={<FileCheck2 />} label="Pending Reviews" value={pendingReviewIds.size} note="Submitted or under review" highlight />
      </section>

      <section className="brand-panel brand-chart-panel">
        <div className="brand-panel-head"><div><h2>Campaign Performance</h2><p>Historical reach and engagement are not available in the current campaign records.</p></div><span className="brand-date-select"><CalendarDays size={14} /> {dateLabel(data.now)}</span></div>
        <div className="brand-empty-state" role="status" style={{ display: "grid", justifyItems: "center", gap: 6, minHeight: 150, padding: 20, color: "var(--muted)", textAlign: "center" }}><BarChart3 size={20} /><span>Performance chart unavailable</span><small>Reach and engagement time-series data has not been recorded yet.</small></div>
      </section>

      <div className="brand-two-col">
        <section className="brand-panel">
          <PanelHead title="Active Campaigns" action="View All Campaigns" href="/brand/campaigns" />
          {activeCampaigns.length ? <div className="brand-table"><div className="brand-table-head"><span>CAMPAIGN</span><span>PLATFORM</span><span>CREATORS</span><span>BUDGET</span><span>STATUS</span></div>{activeCampaigns.slice(0, 5).map((campaign) => <div className="brand-table-row" key={campaign.id}><span><b>{campaign.name}</b><small>Ends {dateLabel(campaign.end)}</small></span><span>{campaign.platforms.join(" · ") || "—"}</span><span>{campaign.creators}</span><span>{campaign.budget}</span><span><em className={`brand-status ${campaign.status.toLowerCase()}`}>{campaign.status}</em></span></div>)}</div> : <EmptyState message="There are no active campaigns in this workspace." />}
        </section>

        <section className="brand-panel">
          <PanelHead title="Pending Actions" action="View all" href="/brand/content-review" />
          <div className="brand-action-list">
            {pendingReviewIds.size ? <Link className="brand-action-row" href="/brand/content-review"><span className="brand-action-icon"><FileCheck2 size={14} /></span><span><b>{pendingReviewIds.size} submissions need review</b><small>Submitted or currently under review</small></span><span aria-hidden="true">›</span></Link> : null}
            {pendingInvitations.length ? <Link className="brand-action-row" href="/brand/invitations"><span className="brand-action-icon"><Send size={14} /></span><span><b>{pendingInvitations.length} invitations awaiting response</b><small>Pending canonical invitation records</small></span><span aria-hidden="true">›</span></Link> : null}
            {draftCount ? <Link className="brand-action-row" href="/brand/campaigns"><span className="brand-action-icon"><Megaphone size={14} /></span><span><b>{draftCount} draft campaigns</b><small>Ready for review and publishing</small></span><span aria-hidden="true">›</span></Link> : null}
            {!pendingReviewIds.size && !pendingInvitations.length && !draftCount ? <EmptyState message="There are no outstanding actions." /> : null}
          </div>
        </section>
      </div>

      <div className="brand-two-col bottom-grid">
        <section className="brand-panel">
          <PanelHead title="Recent Activity" action="See all" href="/brand/analytics" />
          {activity.length ? <div className="brand-activity-list">{activity.map((item) => <div className="brand-activity-row" key={item.id}><i className={item.tone}><Check size={12} /></i><span><b>{item.text}</b><small>{item.detail}</small></span><time dateTime={item.timestamp}>{dateLabel(item.timestamp)}</time></div>)}</div> : <EmptyState message="No dated campaign, invitation, submission, or review activity is available." />}
        </section>
        <section className="brand-panel quick-actions">
          <PanelHead title="Quick Actions" action="" href="#" />
          <Link href="/brand/campaigns"><Plus size={15} /> Create Campaign <ArrowUpRight size={13} /></Link>
          <Link href="/brand/creators"><Users size={15} /> Find Creators <ArrowUpRight size={13} /></Link>
          <Link href="/brand/content-review"><FileCheck2 size={15} /> Review Submissions <ArrowUpRight size={13} /></Link>
          <Link href="/brand/analytics"><BarChart3 size={15} /> View Analytics <ArrowUpRight size={13} /></Link>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, note, highlight = false }: { icon: React.ReactNode; label: string; value: number; note: string; highlight?: boolean }) {
  return <article className={highlight ? "brand-metric highlight" : "brand-metric"}><div><span>{label}</span>{icon}</div><strong>{value}</strong><small>{note}</small></article>;
}

function PanelHead({ title, action, href }: { title: string; action: string; href: string }) {
  return <div className="brand-panel-head"><div><h2>{title}</h2></div>{action ? <Link className="brand-panel-link" href={href}>{action} <ArrowUpRight size={13} /></Link> : null}</div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="brand-empty-state" style={{ display: "grid", placeItems: "center", minHeight: 70, padding: 16, color: "var(--muted)", textAlign: "center", fontSize: 10 }}>{message}</div>;
}
