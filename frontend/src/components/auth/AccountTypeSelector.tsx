"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Check, Search, UserRound } from "lucide-react";

type AccountType = "brand" | "creator";
const options: Array<{ type: AccountType; eyebrow: string; title: string; description: string }> = [
  { type: "brand", eyebrow: "BRAND / AGENCY", title: "I'm a Brand / Agency", description: "I manage campaigns, work with creators and measure marketing performance." },
  { type: "creator", eyebrow: "CREATOR", title: "I'm a Creator", description: "I create content, collaborate with brands and grow my creator profile." },
];

export default function AccountTypeSelector() {
  const router = useRouter();
  const [selected, setSelected] = useState<AccountType | null>(null);
  return <div className="account-type-selector"><div className="account-type-cards">{options.map((option) => { const isSelected = selected === option.type; const isBrand = option.type === "brand"; return <button key={option.type} type="button" className={`account-type-card ${isBrand ? "account-brand" : "account-creator"} ${isSelected ? "selected" : ""}`} aria-pressed={isSelected} onClick={() => setSelected(option.type)}><span className="account-card-visual">{isBrand ? <BrandVisual /> : <CreatorVisual />}</span><span className="account-card-content"><span className="account-card-eyebrow">{option.eyebrow}</span><strong>{option.title}</strong><span className="account-card-description">{option.description}</span></span><span className="account-selection-indicator">{isSelected ? <Check size={15} /> : null}</span></button>; })}</div><button type="button" className="account-continue" disabled={!selected} onClick={() => selected && router.push(`/signup?type=${selected}`)}>Continue <ArrowRight size={16} /></button><p className="account-helper">You can manage your profile and account settings later.</p></div>;
}

function BrandVisual() { return <span className="brand-visual-inner"><span className="visual-window"><small>CAMPAIGN PULSE</small><b>12</b><i /><i /><i /></span><span className="visual-node node-one"><UserRound size={14} /></span><span className="visual-node node-two"><Search size={14} /></span><span className="visual-node node-three"><BarChart3 size={14} /></span></span>; }
function CreatorVisual() { return <span className="creator-visual-inner"><span className="creator-orbit orbit-one" /><span className="creator-orbit orbit-two" /><span className="creator-avatar">AM</span><span className="creator-spark">✦</span><span className="creator-caption">YOUR PROFILE</span></span>; }
