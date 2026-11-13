"use client";

import { useState } from "react";
import Landing from "@/components/LandingPage";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  FlaskConical,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Campaigns", icon: Megaphone },
  { label: "Creators", icon: Users },
  { label: "Content Review", icon: FileCheck2, count: 12 },
  { label: "Analytics", icon: LineChart },
  { label: "Simulation Lab", icon: FlaskConical },
];

const campaigns = [
  { name: "Summer Style Stories", brand: "Studio North", creators: "18 creators", progress: 76, status: "Active", color: "sage" },
  { name: "Everyday Beauty Edit", brand: "Aster & Co.", creators: "12 creators", progress: 48, status: "In review", color: "yellow" },
  { name: "Tech Made Simple", brand: "Form Studio", creators: "8 creators", progress: 24, status: "Draft", color: "grey" },
];

const activity = [
  { icon: Check, title: "Content approved", detail: "Maya Brooks · The Summer Edit", time: "12 min ago", tone: "green" },
  { icon: FileCheck2, title: "Campaign brief updated", detail: "Everyday · Alex Morgan", time: "46 min ago", tone: "cream" },
  { icon: Users, title: "Creator joined campaign", detail: "Noah Williams · Move with intention", time: "1 hour ago", tone: "rose" },
  { icon: Megaphone, title: "Campaign went live", detail: "A softer kind of ritual", time: "2 hours ago", tone: "yellow" },
];

const reviews = [
  { name: "Ella Chen", detail: "The Summer Edit · Instagram Reel", status: "Missing #ad" },
  { name: "Noah Williams", detail: "Move with intention · TikTok video", status: "To review" },
  { name: "Jules Martin", detail: "Everyday elevated · Instagram Story", status: "To review" },
];

export default function Home() {
  const [showLanding, setShowLanding] = useState(true);
  const [active, setActive] = useState("Overview");
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState("");

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  if (showLanding) return <Landing onEnter={() => setShowLanding(false)} />;

  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className="sidebar">
        <div className="wordmark"><span className="wordmark-mark">✦</span><span>clyra<small>CREATOR INTELLIGENCE</small></span></div>
        <button className="workspace-switcher" onClick={() => notify("Workspace switcher is ready for agency client accounts.")}>
          <span className="workspace-avatar">N</span><span className="workspace-copy"><b>Studio North</b><small>Brand workspace</small></span><ChevronDown size={14} />
        </button>
        <div className="side-label">WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon, count }) => (
            <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => { setActive(label); notify(label === "Overview" ? "Overview selected" : `${label} workspace is next in the build.`); }}>
              <Icon size={16} strokeWidth={1.8} /><span>{label}</span>{count ? <em>{count}</em> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => notify("Settings opened")}><Settings2 size={16} strokeWidth={1.8} /><span>Settings</span></button>
          <div className="profile-mini"><span className="profile-avatar">AM</span><span><b>Alex Morgan</b><small>A closer view. A greater impact.</small></span><MoreHorizontal size={16} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Studio North</span><ChevronRight size={13} /><b>{active}</b></div>
          <div className="top-actions"><label className="search-box"><Search size={14} /><input placeholder="Search anything..." /></label><button aria-label="Toggle appearance" className="top-icon" onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="top-icon" onClick={() => notify("You are all caught up.")}><Bell size={17} /><i /></button><button className="top-profile" onClick={() => notify("Profile menu opened")}>AM <ChevronDown size={12} /></button></div>
        </header>

        <div className="content-wrap">
          <section className="page-intro">
            <div><div className="overline">STUDIO NORTH / OVERVIEW</div><h1>Good morning, Alex.</h1><p>Here&apos;s what&apos;s happening across your campaigns today.</p></div>
            <div className="intro-actions"><button className="date-control"><CalendarDays size={14} /> Jun 1 – Jun 30, 2026 <ChevronDown size={13} /></button><button className="primary-btn" onClick={() => notify("Campaign creation flow is ready to connect.")}><Plus size={16} /> Create Campaign</button></div>
          </section>

          <section className="kpi-grid">
            <Kpi label="Active Campaigns" value="12" note="+2" sub="vs. last month" icon={<Megaphone size={15} />} />
            <Kpi label="Total Creators" value="148" note="+18.4%" sub="vs. last month" icon={<Users size={15} />} />
            <Kpi label="Pending Reviews" value="12" note="8 ready" sub="4 need attention" icon={<FileCheck2 size={15} />} highlight />
            <Kpi label="Average Engagement" value="4.86%" note="+0.7 pts" sub="vs. last month" icon={<Activity size={15} />} />
          </section>

          <section className="panel chart-panel">
            <div className="panel-heading"><div><h2>Campaign performance</h2><p>A little momentum, a meaningful impact.</p></div><div className="chart-controls"><button className="segmented active">Impressions</button><button className="segmented">Engagement</button></div></div>
            <div className="metric-line"><strong>2.84M</strong><span className="positive">↗ 24.8%</span><small>vs. previous period</small></div>
            <div className="chart-key"><span><i className="legend-line" />This month</span><span><i className="legend-dash" />Last month</span></div>
            <Chart />
          </section>

          <section className="lower-grid">
            <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent campaign activity</h2><p>The latest across Studio North.</p></div><button className="text-btn" onClick={() => notify("Showing all activity")}>View all <ChevronRight size={13} /></button></div><div className="activity-list">{activity.map(({ icon: Icon, title, detail, time, tone }) => <div className="activity-row" key={title}><span className={`activity-icon ${tone}`}><Icon size={14} /></span><span><b>{title}</b><small>{detail}</small></span><time>{time}</time></div>)}</div></section>
            <section className="panel review-panel"><div className="panel-heading"><div><h2>Pending content review <span className="count-badge">12</span></h2><p>8 to review · 3 changes requested · 1 audit flag</p></div><button className="text-btn" onClick={() => { setActive("Content Review"); notify("Content Review selected"); }}>Review all <ChevronRight size={13} /></button></div><div className="review-list">{reviews.map((review) => <button className="review-row" key={review.name} onClick={() => notify(`${review.name}'s submission opened`)}><span><b>{review.name}</b><small>{review.detail}</small></span><em className={review.status === "Missing #ad" ? "flag" : "review-state"}>{review.status}</em></button>)}</div></section>
          </section>

          <section className="panel campaign-panel"><div className="panel-heading"><div><h2>Active campaigns</h2><p>Keep a close eye on what&apos;s moving.</p></div><button className="text-btn" onClick={() => { setActive("Campaigns"); notify("Campaigns selected"); }}>View all <ChevronRight size={13} /></button></div><div className="campaign-table"><div className="table-header"><span>CAMPAIGN</span><span>CREATORS</span><span>PROGRESS</span><span>STATUS</span><span /></div>{campaigns.map((campaign) => <div className="campaign-row" key={campaign.name}><span><b>{campaign.name}</b><small>{campaign.brand}</small></span><span className="muted">{campaign.creators}</span><span><div className="progress-track"><i style={{ width: `${campaign.progress}%` }} /></div><small>{campaign.progress}% complete</small></span><span><em className={`status ${campaign.color}`}>{campaign.status}</em></span><MoreHorizontal size={16} className="muted" /></div>)}</div></section>
        </div>
      </main>
      {toast ? <div className="toast"><Sparkles size={15} />{toast}</div> : null}
    </div>
  );
}

function LegacyLanding({ onEnter }: { onEnter: () => void }) {
  return <main className="landing-page"><nav className="landing-nav"><div className="landing-logo">clyra<span>CREATOR INTELLIGENCE</span></div><div className="landing-links"><a href="#product">Product</a><a href="#features">Features</a><a href="#brands">For brands</a><a href="#creators">For creators</a></div><div className="landing-nav-actions"><button className="landing-signin" onClick={() => window.location.assign("/onboarding")}>Sign in</button><button className="landing-nav-cta" onClick={() => window.location.assign("/onboarding")}>Get started <ArrowRight size={14} /></button></div></nav><section className="landing-hero" id="product"><div className="hero-copy"><div className="landing-overline">THE CREATOR PARTNERSHIP PLATFORM</div><h1>Make work that<br /><em>moves people.</em></h1><p>Clyra brings brands, agencies and creators together to build better campaigns — from first brief to final result.</p><div className="hero-actions"><button className="landing-primary" onClick={() => window.location.assign("/onboarding")}>Get started <ArrowRight size={16} /></button><button className="landing-secondary" onClick={onEnter}>Explore the platform <span>↓</span></button></div><div className="hero-proof"><span className="proof-avatars"><i>MC</i><i>JW</i><i>AM</i><i>+</i></span><span><b>1,200+ creators</b><small>already making an impact</small></span></div></div><div className="hero-preview"><div className="preview-top"><span className="preview-brand">clyra</span><span>Studio North <ChevronDown size={11} /></span></div><div className="preview-body"><div className="preview-side"><b>Studio North</b><small>Brand workspace</small><i className="preview-active" /><i /><i /><i /><i /></div><div className="preview-main"><small>STUDIO NORTH / OVERVIEW</small><h3>Good morning, Alex.</h3><div className="preview-kpis"><i /><i /><i /><i /></div><div className="preview-chart"><span>Campaign performance</span><svg viewBox="0 0 500 100" preserveAspectRatio="none"><path d="M0,78 L30,67 L65,73 L90,50 L125,61 L160,39 L198,52 L230,30 L270,43 L300,25 L340,34 L375,15 L410,26 L445,10 L500,4" fill="none" stroke="#aa1945" strokeWidth="3" /></svg></div><div className="preview-bottom"><i /><i /></div></div></div></div></section><section className="landing-feature-row" id="features"><div><span>01</span><b>Find the right people</b><p>Discover creators by niche, audience, location and the kind of work they love to make.</p></div><div><span>02</span><b>Build with intention</b><p>Turn a thoughtful brief into a campaign that keeps everyone moving together.</p></div><div><span>03</span><b>Know what works</b><p>See the story behind your performance, with audits and analytics you can trust.</p></div></section><section className="landing-split" id="brands"><div><div className="landing-overline">FOR BRANDS & AGENCIES</div><h2>A clearer path from<br /><em>brief to impact.</em></h2><p>Bring discovery, collaboration, compliance and performance into one considered workspace.</p><button className="text-landing" onClick={() => window.location.assign("/onboarding")}>Build your workspace <ArrowRight size={15} /></button></div><div className="landing-quote"><span>“</span><p>The best partnerships don&apos;t feel like transactions. They feel like momentum.</p><small>— the Clyra point of view</small></div></section><footer className="landing-footer"><div className="landing-logo">clyra<span>CREATOR INTELLIGENCE</span></div><small>Made for the work between people.</small><div><a href="#features">Features</a><a href="#creators">For creators</a><a href="#">Privacy</a></div></footer></main>;
}

function Kpi({ label, value, note, sub, icon, highlight = false }: { label: string; value: string; note: string; sub: string; icon: React.ReactNode; highlight?: boolean }) {
  return <div className={highlight ? "kpi-card highlight" : "kpi-card"}><div className="kpi-label"><span>{label}</span>{icon}</div><div className="kpi-value">{value}</div><div className="kpi-foot"><b>{note}</b><span>{sub}</span></div></div>;
}

function Chart() {
  return <div className="chart-wrap"><div className="y-labels"><span>3.0M</span><span>2.0M</span><span>1.0M</span><span>500K</span><span>0</span></div><svg viewBox="0 0 900 176" preserveAspectRatio="none" className="chart-svg" role="img" aria-label="Campaign impressions trend"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#aa1945" stopOpacity=".16" /><stop offset="100%" stopColor="#aa1945" stopOpacity="0" /></linearGradient></defs><path d="M0,130 L30,120 L60,126 L90,111 L120,116 L150,104 L180,114 L210,96 L240,103 L270,87 L300,81 L330,92 L360,78 L390,74 L420,86 L450,64 L480,74 L510,58 L540,67 L570,45 L600,57 L630,51 L660,31 L690,42 L720,26 L750,38 L780,21 L810,29 L840,13 L870,22 L900,7 L900,176 L0,176 Z" fill="url(#area)" /><path d="M0,130 L30,120 L60,126 L90,111 L120,116 L150,104 L180,114 L210,96 L240,103 L270,87 L300,81 L330,92 L360,78 L390,74 L420,86 L450,64 L480,74 L510,58 L540,67 L570,45 L600,57 L630,51 L660,31 L690,42 L720,26 L750,38 L780,21 L810,29 L840,13 L870,22 L900,7" fill="none" stroke="#aa1945" strokeWidth="2.5" vectorEffect="non-scaling-stroke" /><path d="M0,145 L45,137 L90,141 L135,132 L180,139 L225,124 L270,130 L315,113 L360,119 L405,102 L450,108 L495,94 L540,101 L585,83 L630,91 L675,70 L720,76 L765,61 L810,66 L855,50 L900,56" fill="none" stroke="#c58b91" strokeDasharray="4 5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg><div className="x-labels"><span>Jun 1</span><span>Jun 5</span><span>Jun 10</span><span>Jun 15</span><span>Jun 20</span><span>Jun 25</span><span>Jun 30</span></div></div>;
}
