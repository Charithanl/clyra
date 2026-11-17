"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, CircleHelp, FlaskConical, LayoutDashboard, LineChart, Mail, Megaphone, Menu, Search, Settings, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import "./brand-workspace.css";

if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest("button");
    if (target?.textContent?.trim() === "Log Out") window.location.assign("/account-type");
  });
}

const mainNav = [{ label: "Overview", href: "/brand/overview", icon: LayoutDashboard }, { label: "Campaigns", href: "/brand/campaigns", icon: Megaphone }, { label: "Creator Directory", href: "/brand/creators", icon: Users }, { label: "Invitations", href: "/brand/invitations", icon: Mail }, { label: "Content Review", href: "/brand/content-review", icon: ClipboardIcon }, { label: "Analytics", href: "/brand/analytics", icon: LineChart }];
const toolNav = [{ label: "Simulation Lab", href: "/brand/simulation-lab", icon: FlaskConical }];

export default function BrandWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [mobileOpen, setMobileOpen] = useState(false); const [userOpen, setUserOpen] = useState(false); const [noticeOpen, setNoticeOpen] = useState(false);
  useEffect(() => { const redirectCreateCampaign = (event: MouseEvent) => { const anchor = (event.target as HTMLElement).closest("a"); if (anchor?.getAttribute("href") === "/brand/campaigns" && anchor.textContent?.includes("Create Campaign")) { event.preventDefault(); router.push("/brand/campaigns/new"); } }; document.addEventListener("click", redirectCreateCampaign); return () => document.removeEventListener("click", redirectCreateCampaign); }, [router]);
  const current = [...mainNav, ...toolNav].find((item) => pathname.startsWith(item.href));
  return <div className="brand-app"><aside className={mobileOpen ? "brand-sidebar mobile-open" : "brand-sidebar"}><div className="brand-sidebar-head"><Link className="brand-workmark" href="/"><span>clyra</span><small>CREATOR INTELLIGENCE</small></Link><button className="close-mobile" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><button className="brand-workspace-switcher"><span className="brand-workspace-avatar">N</span><span><b>Studio North</b><small>Brand workspace</small></span><ChevronDown size={14} /></button><BrandNav label="WORKSPACE" items={mainNav} pathname={pathname} onNavigate={() => setMobileOpen(false)} /><BrandNav label="DEVELOPER TOOLS" items={toolNav} pathname={pathname} onNavigate={() => setMobileOpen(false)} /><div className="brand-sidebar-bottom"><Link className={pathname.startsWith("/brand/settings") ? "brand-nav-item active" : "brand-nav-item"} href="/brand/settings"><Settings size={16} /><span>Settings</span></Link><div className="brand-user-mini"><span>AM</span><div><b>Alex Morgan</b><small>Administrator</small></div><ChevronDown size={13} /></div></div></aside>{mobileOpen ? <button className="brand-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /> : null}<main className="brand-main"><header className="brand-topbar"><div className="brand-breadcrumb"><button className="brand-mobile-trigger" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><span>Studio North</span><b>/</b><strong>{current?.label ?? "Workspace"}</strong></div><div className="brand-top-actions"><label className="brand-search"><Search size={15} /><input placeholder="Search workspace..." /></label><button className="brand-top-icon" onClick={() => setNoticeOpen(!noticeOpen)} aria-label="Notifications"><Bell size={17} /><i /></button>{noticeOpen ? <div className="brand-popover notification-popover"><b>Notifications</b><p>No new notifications</p></div> : null}<button className="brand-top-icon" aria-label="Help"><CircleHelp size={17} /></button><button className="brand-profile-button" onClick={() => setUserOpen(!userOpen)}><span>AM</span><ChevronDown size={13} /></button>{userOpen ? <div className="brand-popover user-popover"><Link href="#">My Account</Link><Link href="/brand/settings">Workspace Settings</Link><Link href="#">Help & Support</Link><button onClick={() => setUserOpen(false)}>Log Out</button></div> : null}</div></header>{children}</main></div>;
}

function BrandNav({ label, items, pathname, onNavigate }: { label: string; items: Array<{ label: string; href: string; icon: React.ComponentType<{ size?: number }> }>; pathname: string; onNavigate: () => void }) { return <div className="brand-nav-group"><small>{label}</small><nav>{items.map(({ label: itemLabel, href, icon: Icon }) => <Link key={href} href={href} onClick={onNavigate} className={pathname.startsWith(href) ? "brand-nav-item active" : "brand-nav-item"}><Icon size={16} /><span>{itemLabel}</span>{itemLabel === "Content Review" ? <em>8</em> : null}</Link>)}</nav></div>; }
function ClipboardIcon({ size = 16 }: { size?: number }) { return <span className="clipboard-icon" style={{ width: size, height: size }}>✓</span>; }
