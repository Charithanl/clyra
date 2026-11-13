"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPageContent() {
  const type = useSearchParams().get("type");
  if (type !== "brand" && type !== "creator") return <main className="signup-page invalid-signup"><div className="signup-invalid-card"><div className="signup-eyebrow">LET&apos;S START OVER</div><h1>Choose your<br /><em>account type.</em></h1><p>Tell us which experience fits you best so we can personalize your signup.</p><Link className="signup-primary link-button" href="/account-type">Choose account type →</Link></div></main>;
  const brand = type === "brand";
  return <main className={brand ? "signup-page brand-signup" : "signup-page creator-signup"}><aside className="signup-brand-panel"><Link className="signup-logo" href="/"><span>clyra</span><small>CREATOR INTELLIGENCE</small></Link><div className="signup-panel-copy"><div className="signup-eyebrow">{brand ? "FOR BRANDS & AGENCIES" : "FOR CREATORS"}</div><h1>{brand ? <>Build better<br /><em>creator partnerships.</em></> : <>Turn your creativity<br />into <em>opportunities.</em></>}</h1><p>{brand ? "Bring your campaigns, creator relationships and content workflows together in one organised workspace." : "Build your profile, discover exciting brand collaborations and manage your creator journey in one place."}</p><ul>{(brand ? ["Discover creators that align with your brand.", "Manage campaigns and collaborations.", "Track content and campaign performance."] : ["Build your creator profile.", "Discover relevant brand campaigns.", "Manage collaborations and submissions."]).map((item) => <li key={item}><span><CheckIcon /></span>{item}</li>)}</ul></div><div className="signup-panel-foot">{brand ? "A clearer path from brief to impact." : "Your creativity deserves better opportunities."}</div></aside><div className="signup-form-side"><div className="signup-mobile-logo"><Link className="signup-logo" href="/"><span>clyra</span><small>CREATOR INTELLIGENCE</small></Link><Link href="/account-type">Change account type</Link></div><SignupForm type={brand ? "brand" : "creator"} /></div></main>;
}

function CheckIcon() { return <span>✓</span>; }
