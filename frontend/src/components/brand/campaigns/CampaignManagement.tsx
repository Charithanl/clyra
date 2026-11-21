"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Archive, BarChart3, Check, Copy, Download, Edit3, Filter, Grid2X2, List, Megaphone, MoreHorizontal, Plus, Search, Users, X } from "lucide-react";
import { archiveCampaign, cancelCampaign, completeCampaign, getBrandCampaignRows, pauseCampaign, publishCampaign, resumeCampaign, saveBrandCampaign } from "@/lib/shared/services";
import type { CampaignRow } from "./campaignStore";
import "./campaigns.css";

type CampaignStatus = CampaignRow["status"];
type LifecycleAction = "publish" | "pause" | "resume" | "complete" | "cancel" | "archive";
const statuses: Array<"All" | CampaignStatus> = ["All", "Active", "Draft", "Completed", "Paused", "Cancelled", "Archived"];

function allowedActions(status: CampaignStatus): LifecycleAction[] {
  switch (status) {
    case "Draft": return ["publish", "cancel", "archive"];
    case "Active": return ["pause", "complete", "cancel", "archive"];
    case "Paused": return ["resume", "complete", "cancel", "archive"];
    case "Completed":
    case "Cancelled": return ["archive"];
    case "Archived": return [];
  }
}

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(getBrandCampaignRows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<typeof statuses[number]>("All");
  const [platform, setPlatform] = useState("All platforms");
  const [brand, setBrand] = useState("All brands");
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const operationLock = useRef(false);
  const pageSize = 5;
  const brands = ["All brands", ...Array.from(new Set(campaigns.map((campaign) => campaign.brand)))];
  const filtered = useMemo(() => campaigns.filter((campaign) => `${campaign.name} ${campaign.description} ${campaign.brand}`.toLowerCase().includes(query.toLowerCase()) && (status === "All" || campaign.status === status) && (platform === "All platforms" || campaign.platforms.includes(platform)) && (brand === "All brands" || campaign.brand === brand)), [campaigns, query, status, platform, brand]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const refresh = () => setCampaigns(getBrandCampaignRows());

  async function runLifecycle(campaign: CampaignRow, action: LifecycleAction) {
    if (operationLock.current) return;
    if (!allowedActions(campaign.status).includes(action)) {
      setFeedback({ type: "error", message: `The ${action} action is not valid while this campaign is ${campaign.status.toLowerCase()}.` });
      return;
    }
    if (action === "cancel" && !window.confirm(`Cancel “${campaign.name}”? This will stop the campaign and remove it from Creator discovery.`)) return;
    if (action === "archive" && !window.confirm(`Archive “${campaign.name}”? This will hide it from active campaign management and Creator discovery.`)) return;

    operationLock.current = true;
    const key = `${campaign.id}:${action}`;
    setBusyKey(key);
    setFeedback(null);
    try {
      await Promise.resolve();
      const id = `brand-${campaign.id}`;
      const operation = action === "publish" ? publishCampaign : action === "pause" ? pauseCampaign : action === "resume" ? resumeCampaign : action === "complete" ? completeCampaign : action === "cancel" ? cancelCampaign : archiveCampaign;
      const result = operation(id);
      if (!result) throw new Error(`Campaign “${campaign.name}” could not be found. Refresh the page and try again.`);
      refresh();
      setFeedback({ type: "success", message: `Campaign ${action === "publish" ? "published" : action === "pause" ? "paused" : action === "resume" ? "resumed" : action === "complete" ? "completed" : action === "cancel" ? "cancelled" : "archived"}.` });
    } catch (caught) {
      setFeedback({ type: "error", message: caught instanceof Error ? caught.message : "Campaign status could not be updated." });
    } finally {
      operationLock.current = false;
      setBusyKey(null);
    }
  }

  function duplicate(campaign: CampaignRow) {
    saveBrandCampaign({ ...campaign, id: Date.now(), name: `${campaign.name} — Copy`, status: "Draft" });
    refresh();
  }
  function exportCsv() {
    const headers = ["Campaign", "Description", "Client Brand", "Platform", "Budget", "Start", "End", "Status"];
    const rows = filtered.map((campaign) => [campaign.name, campaign.description, campaign.brand, campaign.platforms.join(" + "), campaign.budget, campaign.start, campaign.end, campaign.status]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "clyra-campaigns.csv"; link.click(); URL.revokeObjectURL(url);
  }
  const clearFilters = () => { setQuery(""); setStatus("All"); setPlatform("All platforms"); setBrand("All brands"); setPage(1); };
  const menuProps = { onDuplicate: duplicate, onLifecycle: runLifecycle, busyKey };

  return <div className="brand-content campaigns-page">
    <section className="campaigns-header"><div><div className="brand-overline">STUDIO NORTH / WORKSPACE</div><h1>Campaigns</h1><p>Create, manage and track your creator marketing campaigns.</p></div><div className="campaign-header-actions"><button className="campaign-export" onClick={exportCsv}><Download size={14} /> Export</button><Link className="brand-create-button" href="/brand/campaigns/new"><Plus size={16} /> Create Campaign</Link></div></section>
    <section className="campaign-summary-grid"><Summary icon={<Megaphone />} label="Total Campaigns" value={String(campaigns.length)} /><Summary icon={<BarChart3 />} label="Active Campaigns" value={String(campaigns.filter((item) => item.status === "Active").length)} accent="wine" /><Summary icon={<Edit3 />} label="Draft Campaigns" value={String(campaigns.filter((item) => item.status === "Draft").length)} accent="yellow" /><Summary icon={<Check />} label="Completed Campaigns" value={String(campaigns.filter((item) => item.status === "Completed").length)} accent="sage" /></section>
    {feedback ? <p className={`campaign-feedback ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.message}</p> : null}
    <section className="campaign-toolbar"><label className="campaign-search"><Search size={15} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search campaigns..." /></label><select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}><option value="All">All statuses</option>{statuses.slice(1).map((item) => <option key={item}>{item}</option>)}</select><select value={platform} onChange={(event) => { setPlatform(event.target.value); setPage(1); }}><option>All platforms</option><option>Instagram</option><option>YouTube</option></select><select value={brand} onChange={(event) => { setBrand(event.target.value); setPage(1); }}>{brands.map((item) => <option key={item}>{item}</option>)}</select><button className="campaign-clear" onClick={clearFilters}><X size={14} /> Clear</button><span className="view-toggle"><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={15} /></button><button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}><Grid2X2 size={15} /></button></span></section>
    {filtered.length === 0 ? <EmptyState onClear={clearFilters} /> : view === "list" ? <CampaignTable campaigns={visible} menuProps={menuProps} /> : <div className="campaign-card-grid">{visible.map((campaign) => <CampaignCard campaign={campaign} key={campaign.id} menuProps={menuProps} />)}</div>}
    <div className="campaign-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} campaigns</span><div><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>{Array.from({ length: totalPages }, (_, index) => <button className={page === index + 1 ? "active" : ""} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button></div></div>
  </div>;
}

type MenuProps = { onDuplicate: (campaign: CampaignRow) => void; onLifecycle: (campaign: CampaignRow, action: LifecycleAction) => void; busyKey: string | null };
function Summary({ icon, label, value, accent = "default" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) { return <article className={`campaign-summary ${accent}`}><div>{icon}<span>{label}</span></div><strong>{value}</strong><small>Shared campaign data</small></article>; }
function CampaignTable({ campaigns, menuProps }: { campaigns: CampaignRow[]; menuProps: MenuProps }) { return <div className="campaign-table-wrap"><table className="campaign-list-table"><thead><tr><th>CAMPAIGN</th><th>PLATFORM</th><th>CREATORS</th><th>BUDGET</th><th>TIMELINE</th><th>STATUS</th><th /></tr></thead><tbody>{campaigns.map((campaign) => <tr key={campaign.id}><td><b>{campaign.name}</b><small>{campaign.description}</small><em>{campaign.brand}</em></td><td>{campaign.platforms.join(" · ")}</td><td><strong>{campaign.accepted}</strong> / {campaign.creators}<small>accepted</small></td><td>{campaign.budget}</td><td>{campaign.start}<small>to {campaign.end}</small></td><td><span className={`campaign-status ${campaign.status.toLowerCase()}`}>{campaign.status}</span></td><td><CampaignMenu campaign={campaign} {...menuProps} /></td></tr>)}</tbody></table></div>; }
function CampaignCard({ campaign, menuProps }: { campaign: CampaignRow; menuProps: MenuProps }) { return <article className="campaign-card"><div className="campaign-card-top"><span className={`campaign-status ${campaign.status.toLowerCase()}`}>{campaign.status}</span><CampaignMenu campaign={campaign} {...menuProps} /></div><div className="campaign-card-brand">{campaign.brand}</div><h3>{campaign.name}</h3><p>{campaign.description}</p><div className="campaign-card-meta"><span><Users size={13} /> {campaign.accepted}/{campaign.creators}</span><span>{campaign.budget}</span></div><div className="campaign-card-footer"><span>{campaign.platforms.join(" · ")}</span><span>{campaign.end}</span></div></article>; }
function CampaignMenu({ campaign, onDuplicate, onLifecycle, busyKey }: MenuProps & { campaign: CampaignRow }) {
  const actions = allowedActions(campaign.status);
  const actionLabel: Record<LifecycleAction, string> = { publish: "Publish", pause: "Pause", resume: "Resume", complete: "Complete", cancel: "Cancel", archive: "Archive" };
  return <details className="campaign-menu"><summary aria-label={`Actions for ${campaign.name}`}><MoreHorizontal size={16} /></summary><div><Link href={`/brand/campaigns/${campaign.id}`}>View Campaign</Link><Link href={`/brand/campaigns/${campaign.id}/edit`}>Edit Campaign</Link>{actions.map((action) => <button key={action} disabled={busyKey !== null} onClick={() => onLifecycle(campaign, action)}>{action === "archive" ? <><Archive size={12} /> {actionLabel[action]}</> : actionLabel[action]}{busyKey === `${campaign.id}:${action}` ? "…" : ""}</button>)}<button onClick={() => onDuplicate(campaign)} disabled={busyKey !== null}><Copy size={12} /> Duplicate</button></div></details>;
}
function EmptyState({ onClear }: { onClear: () => void }) { return <div className="campaign-empty"><Filter size={22} /><h2>No campaigns found</h2><p>Try adjusting your search or filters, or create a new campaign.</p><button onClick={onClear}>Clear filters</button></div>; }
