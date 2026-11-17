"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bookmark, ChevronDown, Instagram, MapPin, Search, SlidersHorizontal, Users, Youtube } from "lucide-react";
import { getCampaigns } from "../campaigns/campaignStore";
import { addInvitation } from "../invitations/invitationStore";
import { type Creator } from "./creatorData";
import { getBrandDirectoryCreators } from "@/lib/shared/services";
import "./creators.css";

const categories = ["Fashion", "Beauty", "Lifestyle", "Technology", "Food", "Travel", "Fitness"];

export default function CreatorDirectory() {
  const creators = getBrandDirectoryCreators();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All platforms");
  const [niche, setNiche] = useState("All niches");
  const [tier, setTier] = useState("All sizes");
  const [engagement, setEngagement] = useState("Any engagement");
  const [sort, setSort] = useState("Most Relevant");
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [invite, setInvite] = useState<Creator | null>(null);
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const filtered = useMemo(() => {
    const result = creators.filter((creator) => {
      const text = `${creator.name} ${creator.username} ${creator.niche} ${creator.location}`.toLowerCase();
      const matchEngagement = engagement === "Any engagement" || (engagement === "Below 2%" ? creator.engagement < 2 : engagement === "2–4%" ? creator.engagement >= 2 && creator.engagement < 4 : engagement === "4–6%" ? creator.engagement >= 4 && creator.engagement <= 6 : creator.engagement > 6);
      return text.includes(query.toLowerCase()) && (platform === "All platforms" || creator.platforms.includes(platform)) && (niche === "All niches" || creator.niche === niche) && (tier === "All sizes" || creator.tier === tier) && matchEngagement && (!shortlistedOnly || shortlist.includes(creator.id));
    });
    return result.sort((a, b) => sort === "Highest Followers" ? b.followers - a.followers : sort === "Highest Engagement" ? b.engagement - a.engagement : sort === "Recently Added" ? b.id.localeCompare(a.id) : 0);
  }, [creators, query, platform, niche, tier, engagement, sort, shortlist, shortlistedOnly]);
  const toggleShortlist = (id: string) => setShortlist((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const clearFilters = () => { setQuery(""); setPlatform("All platforms"); setNiche("All niches"); setTier("All sizes"); setEngagement("Any engagement"); };

  return <div className="brand-content creator-directory"><section className="creator-hero"><div className="creator-hero-copy"><div className="brand-overline">THE CREATOR DIRECTORY</div><h1>Find the perfect<br /><em>creators</em> for your brand.</h1><p>Discover inspiring creators, explore their audiences and find the right people for your next campaign.</p><div className="creator-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, niche or username..." /><button onClick={() => undefined}>Search</button></div><div className="popular-categories"><small>Popular categories</small>{categories.map((category) => <button key={category} onClick={() => setNiche(category)}>{category}</button>)}</div></div><div className="creator-hero-art"><div className="hero-art-card hero-art-back" /><div className="hero-art-card hero-art-front"><img src={creators[0]?.image} alt="Featured creator" /><span>CREATOR TO WATCH</span><b>Maya Brooks</b></div><div className="hero-art-note"><Users size={14} /><span><b>1,248</b><small>creators in your network</small></span></div></div></section><section className="featured-section"><div className="creator-section-head"><div><div className="brand-overline">CURATED FOR YOU</div><h2>Creators worth discovering</h2><p>Explore creators making an impact across different communities.</p></div><button onClick={() => setShortlistedOnly(!shortlistedOnly)} className={shortlistedOnly ? "shortlist-filter active" : "shortlist-filter"}><Bookmark size={14} /> {shortlistedOnly ? "Showing shortlist" : "View shortlist"}</button></div><div className="featured-grid">{creators.slice(0, 4).map((creator) => <CreatorCard key={creator.id} creator={creator} shortlisted={shortlist.includes(creator.id)} onShortlist={() => toggleShortlist(creator.id)} onInvite={() => setInvite(creator)} />)}</div></section><section className="editorial-strip"><div><div className="brand-overline">A MORE CONSIDERED SEARCH</div><h2>Bridging the gap between<br /><em>vision and influence.</em></h2></div><p>It&apos;s not just about reach. Find the voices, perspectives and communities that make your brand feel more like itself.</p></section><section className="directory-section"><div className="creator-section-head"><div><div className="brand-overline">ALL CREATORS</div><h2>Explore the directory</h2><p>{filtered.length} creators matching your discovery.</p></div><div className="sort-control"><SlidersHorizontal size={14} /><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Most Relevant</option><option>Highest Followers</option><option>Highest Engagement</option><option>Recently Added</option></select><ChevronDown size={13} /></div></div><div className="creator-filters"><label><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search creators..." /></label><select value={platform} onChange={(event) => setPlatform(event.target.value)}><option>All platforms</option><option>Instagram</option><option>YouTube</option></select><select value={niche} onChange={(event) => setNiche(event.target.value)}><option>All niches</option>{[...new Set(creators.map((item) => item.niche))].map((item) => <option key={item}>{item}</option>)}</select><select value={tier} onChange={(event) => setTier(event.target.value)}><option>All sizes</option><option>Nano</option><option>Micro</option><option>Mid-tier</option><option>Macro</option><option>Mega</option></select><select value={engagement} onChange={(event) => setEngagement(event.target.value)}><option>Any engagement</option><option>Below 2%</option><option>2–4%</option><option>4–6%</option><option>Above 6%</option></select></div>{filtered.length ? <div className="creator-grid">{filtered.map((creator) => <CreatorCard key={creator.id} creator={creator} shortlisted={shortlist.includes(creator.id)} onShortlist={() => toggleShortlist(creator.id)} onInvite={() => setInvite(creator)} />)}</div> : <div className="creator-empty"><Search size={22} /><h3>No creators match that search.</h3><p>Try a different category or clear one of your filters.</p><button onClick={clearFilters}>Clear filters</button></div>}</section>{invite ? <InviteDialog creator={invite} onClose={() => setInvite(null)} /> : null}</div>;
}

function CreatorCard({ creator, shortlisted, onShortlist, onInvite }: { creator: Creator; shortlisted: boolean; onShortlist: () => void; onInvite: () => void }) { return <article className="creator-card"><Link href={`/brand/creators/${creator.id}`} className="creator-image-wrap"><img src={creator.image} alt={creator.name} /><span className="creator-niche">{creator.niche}</span></Link><button className={shortlisted ? "shortlist-button selected" : "shortlist-button"} onClick={onShortlist} aria-label="Toggle shortlist"><Bookmark size={15} fill={shortlisted ? "currentColor" : "none"} /></button><div className="creator-card-body"><Link href={`/brand/creators/${creator.id}`}><h3>{creator.name}</h3></Link><small className="creator-handle">{creator.username}</small><p>{creator.bio}</p><div className="creator-card-stats"><span><b>{formatFollowers(creator.followers)}</b><small>followers</small></span><span><b>{creator.engagement}%</b><small>engagement</small></span><span><MapPin size={11} /><small>{creator.location.split(",")[0]}</small></span></div><div className="creator-card-footer"><span className="platform-icons">{creator.platforms.includes("Instagram") ? <Instagram size={13} /> : null}{creator.platforms.includes("YouTube") ? <Youtube size={13} /> : null}</span><button onClick={onInvite}>Invite to campaign <ArrowRight size={12} /></button></div></div></article>; }
function formatFollowers(value: number) { return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K` : String(value); }

function InviteDialog({ creator, onClose }: { creator: Creator; onClose: () => void }) {
  const campaigns = getCampaigns().filter((campaign) => campaign.status !== "Archived");
  const [campaignId, setCampaignId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const send = () => {
    const campaign = campaigns.find((item) => String(item.id) === campaignId);
    if (!campaign) { setError("Select a campaign before sending the invitation."); return; }
    const now = new Date().toISOString();
    const created = addInvitation({ id: `inv-${Date.now()}`, creatorId: creator.id, campaignId: campaign.id, organizationId: "studio-north", message: message.trim(), status: "Pending", sentAt: now, responseDeadline: campaign.end, createdAt: now, updatedAt: now });
    if (!created) { setError("An active invitation already exists for this creator and campaign."); return; }
    setError(""); setSent(true); setTimeout(onClose, 700);
  };
  return <div className="invite-backdrop" onClick={onClose}><div className="invite-dialog" onClick={(event) => event.stopPropagation()}><div className="invite-dialog-head"><div><div className="brand-overline">INVITE CREATOR</div><h2>Invite {creator.name}</h2></div><button onClick={onClose}>×</button></div><p>Choose a campaign and add an optional note for this invitation.</p><label className="invite-field"><span>Campaign</span><select value={campaignId} onChange={(event) => { setCampaignId(event.target.value); setError(""); }}><option value="">Select a campaign</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label><label className="invite-field"><span>Message <small>Optional</small></span><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell them why you think they would be a great fit..." /></label>{error ? <p role="alert" className="invite-error">{error}</p> : null}{sent ? <p role="status" className="invite-success">Invitation sent.</p> : null}<div className="invite-actions"><button onClick={onClose}>Cancel</button><button onClick={send} disabled={sent}>{sent ? "Sent" : "Send invitation"}</button></div></div></div>;
}
