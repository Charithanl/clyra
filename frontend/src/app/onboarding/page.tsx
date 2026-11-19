"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Instagram, Sparkles, Youtube } from "lucide-react";
import { clearDraft, readDraft, ROLE_ONBOARDING_DRAFT_KEY, writeDraft } from "@/lib/draft-storage";
import "./onboarding.css";

type Role = "brand" | "creator" | null;
type RoleDraft = { role: Exclude<Role, null>; step: number; fields?: Record<string, string> };
function isRoleDraft(value: unknown): value is RoleDraft { if (!value || typeof value !== "object") return false; const draft = value as Partial<RoleDraft>; const fieldsValid = draft.fields === undefined || (Boolean(draft.fields) && typeof draft.fields === "object" && !Array.isArray(draft.fields) && Object.keys(draft.fields).length <= 80 && Object.entries(draft.fields).every(([key, field]) => key.length <= 160 && typeof field === "string" && field.length <= 2000)); return fieldsValid && ((draft.role === "brand" && Number.isInteger(draft.step) && draft.step! >= 0 && draft.step! <= 3) || (draft.role === "creator" && Number.isInteger(draft.step) && draft.step! >= 0 && draft.step! <= 5)); }
const steps = {
  brand: ["Your organization", "Workspace setup", "Invite your team", "Ready to go"],
  creator: ["Your profile", "Your niche", "Connect accounts", "Your audience", "Portfolio", "Ready to go"],
};

export default function OnboardingPage() {
  return <Suspense fallback={<main className="onboarding-page"><Brand /></main>}><OnboardingFlow /></Suspense>;
}

function OnboardingFlow() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role");
  const [role, setRole] = useState<Role>(initialRole === "brand" || initialRole === "creator" ? initialRole : null);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [draftReady, setDraftReady] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const activeSteps = role ? steps[role] : [];
  const isLast = role !== null && step === activeSteps.length - 1;

  useEffect(() => {
    const draft = readDraft(ROLE_ONBOARDING_DRAFT_KEY, isRoleDraft);
    if (draft && (!initialRole || draft.role === initialRole)) { setRole(draft.role); setStep(draft.step); setFields(draft.fields ?? {}); }
    setDraftReady(true);
  }, [initialRole]);

  useEffect(() => {
    if (!draftReady) return;
    if (role) writeDraft(ROLE_ONBOARDING_DRAFT_KEY, { role, step, fields });
    else clearDraft(ROLE_ONBOARDING_DRAFT_KEY);
  }, [draftReady, fields, role, step]);

  useEffect(() => {
    const root = formRef.current;
    if (!root || !role) return;
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement>(".field input, .field select").forEach((control) => {
      const label = control.closest(".field")?.querySelector("span")?.textContent?.trim();
      const value = label ? fields[`${role}-${step}-${label}`] : undefined;
      if (value !== undefined) control.value = value;
    });
    const saveField = (event: Event) => {
      const control = event.target;
      if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;
      const label = control.closest(".field")?.querySelector("span")?.textContent?.trim();
      if (label) setFields((current) => ({ ...current, [`${role}-${step}-${label}`]: control.value }));
    };
    root.addEventListener("input", saveField);
    root.addEventListener("change", saveField);
    return () => { root.removeEventListener("input", saveField); root.removeEventListener("change", saveField); };
  }, [fields, role, step]);

  async function completeOnboarding() {
    if (!role) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Dev-User-Id": "local-user" },
        body: JSON.stringify({ account_type: role, profile_data: { completed_steps: activeSteps.length } }),
      });
      if (!response.ok) throw new Error("Could not save your onboarding details.");
      clearDraft(ROLE_ONBOARDING_DRAFT_KEY);
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your onboarding details.");
    } finally {
      setSaving(false);
    }
  }

  if (!role) return <main className="onboarding-page"><Brand /><button className="help-button"><CircleHelp size={15} /> Need help?</button><section className="role-selection"><div className="onboarding-intro"><div className="overline">WELCOME TO CLYRA</div><h1>Let&apos;s make something<br /><em>meaningful.</em></h1><p>First, tell us a little about how you&apos;ll be using Clyra.</p><p className="onboarding-demo-note">Demo onboarding - no account is created.</p></div><div className="role-grid"><RoleCard role="brand" onClick={() => setRole("brand")} /><RoleCard role="creator" onClick={() => setRole("creator")} /></div><p className="signin-note">Already have an account? <a href="/login">Sign in</a></p></section></main>;

  return <main className="onboarding-page"><Brand /><button className="help-button"><CircleHelp size={15} /> Need help?</button><section className="setup-layout"><div className="setup-aside"><button className="back-link" onClick={() => setRole(null)}><ArrowLeft size={14} /> Change account type</button><div><div className="overline">{role === "brand" ? "BRAND / AGENCY SETUP" : "CREATOR SETUP"}</div><h1>{role === "brand" ? <>Build your<br /><em>workspace.</em></> : <>Put your<br /><em>best self</em><br />forward.</>}</h1><p>{role === "brand" ? "A thoughtful home for every creator partnership." : "A profile that opens the right doors."}</p><p className="onboarding-demo-note">Demo setup only - no authenticated account is created.</p></div><div className="setup-tip"><Sparkles size={15} /><span><b>A little note</b><small>You can always update these details later from Settings.</small></span></div></div><div className="setup-main"><div className="progress-rail">{activeSteps.map((label, index) => <div className={index <= step ? "progress-step active" : "progress-step"} key={label}><span>{index < step ? <Check size={12} /> : index + 1}</span><small>{label}</small></div>)}</div><div className="setup-form" ref={formRef}>{role === "brand" ? <BrandForm step={step} /> : <CreatorForm step={step} />}{error ? <p className="form-error">{error}</p> : null}</div><div className="form-actions"><button className="secondary-btn" onClick={() => step > 0 ? setStep(step - 1) : setRole(null)}>{step > 0 ? "Back" : "Cancel"}</button><button className="primary-btn" disabled={saving} onClick={() => isLast ? completeOnboarding() : setStep(step + 1)}>{saving ? "Saving…" : isLast ? "Enter workspace" : "Continue"}<ArrowRight size={15} /></button></div></div></section></main>;
}

function Brand() { return <div className="onboarding-brand"><span>clyra</span><small>CREATOR INTELLIGENCE</small></div>; }
function RoleCard({ role, onClick }: { role: "brand" | "creator"; onClick: () => void }) { const brand = role === "brand"; return <button className="role-card" onClick={onClick}><span className="role-number">{brand ? "01" : "02"}</span><span className={`role-illustration ${brand ? "brand-illustration" : "creator-illustration"}`}>{brand ? <><span className="mini-window"><b>Campaign</b><i /><i /><i /></span><span className="mini-person">✦</span></> : <><span className="mini-profile">AM</span><span className="mini-bars"><i /><i /><i /><i /></span><span className="mini-heart">♡</span></>}</span><span className="role-copy"><strong>{brand ? "Brand / Agency" : "Creator"}</strong><small>{brand ? "Discover creators, manage campaigns and measure the impact of your partnerships." : "Build your profile, discover opportunities and collaborate with brands you love."}</small><span className="role-cta">Continue as {brand ? "Brand / Agency" : "Creator"} <ArrowRight size={15} /></span></span></button>; }
function Field({ label, placeholder }: { label: string; placeholder: string }) { return <label className="field"><span>{label}</span><input placeholder={placeholder} /></label>; }
function BrandForm({ step }: { step: number }) { if (step === 0) return <Form title="Tell us about your organization" kicker="STEP 01 / 04" subtitle="This helps us tailor Clyra to the way you work."><div className="form-grid"><Field label="Organization name" placeholder="e.g. Studio North" /><Field label="Website" placeholder="https://yourwebsite.com" /><Field label="Organization type" placeholder="Brand or Agency" /><Field label="Industry" placeholder="e.g. Fashion & beauty" /></div></Form>; if (step === 1) return <Form title="Shape your workspace" kicker="STEP 02 / 04" subtitle="Give your team a shared place to make meaningful work."><Field label="Workspace name" placeholder="e.g. Studio North" /><Field label="Short description" placeholder="What does your organization do?" /><div className="upload-card"><span>＋</span><b>Upload a workspace logo</b><small>PNG or JPG · up to 5MB</small></div></Form>; if (step === 2) return <Form title="Bring your team along" kicker="STEP 03 / 04" subtitle="Invite collaborators now, or skip this and do it later."><Field label="Team member email" placeholder="name@company.com" /><Field label="Role" placeholder="Campaign Manager" /><button className="add-row">＋ Add another teammate</button></Form>; return <Ready title="Your workspace is ready." subtitle="Studio North is ready for its first campaign. You can invite creators and teammates whenever you&apos;re ready." />; }
function CreatorForm({ step }: { step: number }) { if (step === 0) return <Form title="Start with the basics" kicker="STEP 01 / 06" subtitle="This is how brands will get to know you."><Field label="Display name" placeholder="e.g. Alex Morgan" /><Field label="Bio" placeholder="Tell the world what you create..." /><div className="form-grid"><Field label="Location" placeholder="e.g. New York, NY" /><Field label="Languages" placeholder="e.g. English, Spanish" /></div></Form>; if (step === 1) return <Form title="What do you create?" kicker="STEP 02 / 06" subtitle="Choose all the categories that feel like you."><div className="choice-grid">{["Fashion", "Beauty", "Lifestyle", "Technology", "Gaming", "Food", "Travel", "Fitness", "Education"].map((item, index) => <button className={index === 0 || index === 2 ? "choice active" : "choice"} key={item}>{item}</button>)}</div></Form>; if (step === 2) return <Form title="Connect your world" kicker="STEP 03 / 06" subtitle="Connect the accounts you want brands to discover."><div className="social-card"><Youtube size={20} /><span><b>YouTube</b><small>Bring your public channel insights into Clyra.</small></span><button>Connect</button></div><div className="social-card"><Instagram size={20} /><span><b>Instagram <em>Simulated data</em></b><small>We use synthetic data for Instagram profiles in this MVP.</small></span><button>Connect</button></div></Form>; if (step === 3) return <Form title="Help us understand your audience" kicker="STEP 04 / 06" subtitle="You can connect an account or add these details manually."><div className="form-grid"><Field label="Total followers" placeholder="e.g. 24,500" /><Field label="Engagement rate" placeholder="e.g. 4.8%" /><Field label="Top audience location" placeholder="e.g. United States" /><Field label="Primary age group" placeholder="e.g. 25–34" /></div><p className="source-note">ⓘ Manually entered · YouTube API data will be labelled when connected.</p></Form>; if (step === 4) return <Form title="Showcase your work" kicker="STEP 05 / 06" subtitle="A few examples help the right campaigns find you."><Field label="Portfolio link" placeholder="https://yourportfolio.com" /><Field label="Previous collaboration" placeholder="Brand or campaign name" /><button className="add-row">＋ Add another link</button></Form>; return <Ready title="Your creator profile is ready." subtitle="You&apos;re ready to discover campaigns that feel like a good fit." />; }
function Form({ kicker, title, subtitle, children }: { kicker: string; title: string; subtitle: string; children: React.ReactNode }) { return <><div className="form-kicker">{kicker}</div><h2>{title}</h2><p className="form-subtitle">{subtitle}</p>{children}</>; }
function Ready({ title, subtitle }: { title: string; subtitle: string }) { return <><div className="ready-mark"><Check size={24} /></div><div className="form-kicker">ALL SET</div><h2>{title}</h2><p className="form-subtitle">{subtitle}</p><div className="summary-card"><span className="summary-avatar">✓</span><span><b>Profile saved</b><small>Your details are ready for the next step.</small></span><Check size={16} /></div></>; }
