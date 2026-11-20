"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Plus, Trash2, Upload } from "lucide-react";
import { createCampaign, getSharedCampaignById } from "@/lib/shared/services";
import { canonicalIdForNewCampaign } from "@/lib/shared/campaign-id-mapping";
import type { Campaign, CampaignDeliverable, SocialPlatform } from "@/types/shared";
import "./campaign-wizard.css";

const stepLabels = ["Basic Information", "Platforms & Audience", "Campaign Brief", "Deliverables", "Budget & Timeline", "Review & Publish"];
const niches = ["Fashion", "Beauty", "Technology", "Lifestyle", "Travel", "Food", "Fitness", "Education", "Other"];
type Deliverable = { platform: string; format: string; quantity: string; description: string; submission: string; publication: string };
type Draft = { name: string; brand: string; description: string; objective: string; category: string; type: string; platforms: string[]; formats: Record<string, string[]>; location: string; age: string; gender: string; interests: string; preferredNiches: string[]; creatorSize: string[]; objectiveDetails: string; keyMessages: string; hashtags: string; mentions: string; keywords: string; disclosure: string; guidelines: string; references: string; deliverables: Deliverable[]; currency: string; compensation: string; compensationDetails: string; minBudget: string; maxBudget: string; start: string; end: string; applicationDeadline: string; selectionDeadline: string; submissionDeadline: string; publicationDate: string };

const emptyDraft: Draft = { name: "", brand: "Aurelia Fashion", description: "", objective: "", category: "", type: "", platforms: [], formats: {}, location: "", age: "", gender: "All", interests: "", preferredNiches: [], creatorSize: [], objectiveDetails: "", keyMessages: "", hashtags: "", mentions: "", keywords: "", disclosure: "Paid partnership disclosure", guidelines: "", references: "", deliverables: [{ platform: "Instagram", format: "Reel", quantity: "1", description: "", submission: "", publication: "" }], currency: "INR (₹)", compensation: "Fixed Payment", compensationDetails: "", minBudget: "", maxBudget: "", start: "", end: "", applicationDeadline: "", selectionDeadline: "", submissionDeadline: "", publicationDate: "" };

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function dateToIso(value: string, endOfDay = false) {
  return `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
}

function splitEntries(value: string) {
  return value.split(/[\r\n,]+/).map((entry) => entry.trim()).filter(Boolean);
}

function splitLines(value: string) {
  return value.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
}

function numericBudget(value: string) {
  if (!value.trim()) return undefined;
  const amount = Number(value.replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.NaN;
}

function campaignId() {
  let legacyId = Date.now();
  while (getSharedCampaignById(`brand-${legacyId}`)) legacyId += 1;
  return canonicalIdForNewCampaign(legacyId);
}

function toCanonicalCampaign(draft: Draft, status: "Active" | "Draft"): Campaign {
  const id = campaignId();
  const now = new Date().toISOString();
  const list = (value: string) => splitEntries(value);
  const wizardRequirements = [
    ...splitLines(draft.guidelines),
    ...splitLines(draft.keyMessages).map((value) => `Key message: ${value}`),
    ...splitLines(draft.objectiveDetails).map((value) => `Objective detail: ${value}`),
    ...splitLines(draft.compensationDetails).map((value) => `Compensation detail: ${value}`),
    ...(draft.type ? [`Campaign type: ${draft.type}`] : []),
    ...splitLines(draft.references).map((value) => `Reference link: ${value}`),
    ...Object.entries(draft.formats).flatMap(([platform, formats]) => formats.map((format) => `${platform} format: ${format}`)),
    ...draft.preferredNiches.map((value) => `Preferred creator niche: ${value}`),
    ...draft.creatorSize.map((value) => `Preferred creator size: ${value}`),
    ...(draft.selectionDeadline ? [`Creator selection deadline: ${draft.selectionDeadline}`] : []),
    ...(draft.submissionDeadline ? [`Campaign submission deadline: ${draft.submissionDeadline}`] : []),
    ...(draft.publicationDate ? [`Expected publication date: ${draft.publicationDate}`] : []),
  ];
  const deliverables: CampaignDeliverable[] = draft.deliverables.map((item, index) => ({
    id: `${id}-deliverable-${index + 1}`,
    campaignId: id,
    title: item.format.trim() || `Deliverable ${index + 1}`,
    description: item.description.trim(),
    platform: item.platform === "Instagram" ? "INSTAGRAM" : "YOUTUBE",
    contentType: item.format,
    dueDate: item.submission ? dateToIso(item.submission, true) : "TBD",
    requirements: [
      `Quantity: ${item.quantity}`,
      ...(item.publication ? [`Publication deadline: ${item.publication}`] : []),
    ],
  }));
  const budgetAmount = numericBudget(draft.minBudget);
  const maximumBudget = numericBudget(draft.maxBudget);
  return {
    id,
    organizationId: "org-studio-north",
    clientBrandId: draft.brand,
    organizationName: "Studio North",
    title: draft.name.trim(),
    description: draft.description,
    objectives: [draft.objective, ...splitLines(draft.objectiveDetails)].filter(Boolean),
    industry: "Creator marketing",
    categories: [draft.category],
    platforms: draft.platforms.map((platform) => platform === "Instagram" ? "INSTAGRAM" : "YOUTUBE") as SocialPlatform[],
    targetAudience: [
      draft.location && `Location: ${draft.location}`,
      draft.age && `Age: ${draft.age}`,
      draft.gender && `Gender: ${draft.gender}`,
      draft.interests && `Interests: ${draft.interests}`,
    ].filter(Boolean).join("; "),
    budget: {
      ...(budgetAmount !== undefined && !Number.isNaN(budgetAmount) ? { min: budgetAmount } : {}),
      ...(maximumBudget !== undefined && !Number.isNaN(maximumBudget) ? { max: maximumBudget } : {}),
      currency: draft.currency.split(" ")[0],
    },
    compensationType: draft.compensation,
    startDate: dateToIso(draft.start),
    endDate: dateToIso(draft.end, true),
    applicationDeadline: dateToIso(draft.applicationDeadline, true),
    status: status === "Active" ? "PUBLISHED" : "DRAFT",
    requirements: wizardRequirements,
    hashtags: list(draft.hashtags),
    brandMentions: list(draft.mentions),
    keywords: list(draft.keywords),
    disclosureRequirements: list(draft.disclosure),
    deliverables,
    createdAt: now,
    updatedAt: now,
    ...(status === "Active" ? { publishedAt: now } : {}),
  };
}

export default function CampaignWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0); const [draft, setDraft] = useState<Draft>(emptyDraft); const [error, setError] = useState(""); const [saving, setSaving] = useState(false); const [published, setPublished] = useState(false);
  function update<K extends keyof Draft>(key: K, value: Draft[K]) { setDraft((current) => ({ ...current, [key]: value })); setError(""); }
  function validate(target = step, forPublish = false) {
    if (target === 0 && (!draft.name.trim() || !draft.brand || !draft.objective || !draft.category || !draft.type)) return "Add a campaign name, client brand, objective, category and type.";
    if (target === 1 && draft.platforms.length === 0) return "Select at least one campaign platform.";
    if (target === 3) {
      if (draft.deliverables.length === 0) return "Add at least one deliverable.";
      for (const [index, item] of draft.deliverables.entries()) {
        if (item.submission && !isValidDateInput(item.submission)) return `Enter a valid submission deadline for deliverable ${index + 1}.`;
        if (item.publication && !isValidDateInput(item.publication)) return `Enter a valid publication deadline for deliverable ${index + 1}.`;
      }
    }
    if (target === 4) {
      if (!draft.start || !draft.end || !draft.applicationDeadline) return "Add the campaign start date, end date and application deadline.";
      for (const [label, value] of [["start date", draft.start], ["end date", draft.end], ["application deadline", draft.applicationDeadline]] as const) {
        if (!isValidDateInput(value)) return `Enter a valid campaign ${label}.`;
      }
      for (const [label, value] of [["creator selection deadline", draft.selectionDeadline], ["content submission deadline", draft.submissionDeadline], ["expected publication date", draft.publicationDate]] as const) {
        if (value && !isValidDateInput(value)) return `Enter a valid ${label}.`;
      }
      if (draft.end <= draft.start) return "Campaign end date must be after the start date.";
      if (draft.applicationDeadline > draft.start) return "Application deadline must be on or before the campaign start date.";
      if (forPublish && draft.applicationDeadline < new Date().toISOString().slice(0, 10)) return "Application deadline must be today or later to publish this campaign.";
      if (Number.isNaN(numericBudget(draft.minBudget))) return "Enter a valid non-negative campaign budget.";
    }
    return "";
  }
  function next() { const message = validate(); if (message) { setError(message); return; } setStep(Math.min(5, step + 1)); }
  function goTo(nextStep: number) { if (nextStep <= step) { setStep(nextStep); setError(""); } }
  function finish(status: "Active" | "Draft") {
    for (let index = 0; index <= 4; index += 1) {
      const message = validate(index, status === "Active");
      if (message) { setStep(index); setError(message); return; }
    }
    setSaving(true);
    setError("");
    try {
      createCampaign(toCanonicalCampaign(draft, status));
      window.setTimeout(() => { setSaving(false); setPublished(status === "Active"); window.setTimeout(() => router.push("/brand/campaigns"), 700); }, 450);
    } catch (cause) {
      setSaving(false);
      setError(cause instanceof Error ? cause.message : "Campaign could not be saved. Please try again.");
    }
  }
  return <div className="brand-content wizard-page"><div className="wizard-breadcrumb"><Link href="/brand/campaigns">Campaigns</Link><span>/</span><b>Create Campaign</b></div><section className="wizard-heading"><div><div className="brand-overline">CAMPAIGN BUILDER</div><h1>Create a Campaign</h1><p>Set up your campaign, define your requirements and find the right creators.</p></div><div className="wizard-heading-actions"><Link href="/brand/campaigns">Cancel</Link><button onClick={() => finish("Draft")} disabled={saving}>Save as Draft</button></div></section><div className="wizard-shell"><div className="wizard-progress">{stepLabels.map((label, index) => <button key={label} className={index === step ? "current" : index < step ? "complete" : ""} onClick={() => goTo(index)} disabled={index > step}><span>{index < step ? <Check size={12} /> : `0${index + 1}`}</span><small>{label}</small></button>)}</div><div className="wizard-step-count">Step {step + 1} of 6</div><section className="wizard-form">{step === 0 ? <BasicInformation draft={draft} update={update} /> : null}{step === 1 ? <PlatformsAudience draft={draft} update={update} /> : null}{step === 2 ? <CampaignBrief draft={draft} update={update} /> : null}{step === 3 ? <Deliverables draft={draft} update={update} /> : null}{step === 4 ? <BudgetTimeline draft={draft} update={update} /> : null}{step === 5 ? <Review draft={draft} onEdit={goTo} /> : null}{error ? <p className="wizard-error">{error}</p> : null}{published ? <p className="wizard-success"><Check size={15} />Campaign published. Returning to campaigns…</p> : null}</section><div className="wizard-actions"><button className="wizard-back" disabled={step === 0 || saving} onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button>{step < 5 ? <button className="wizard-continue" onClick={next} disabled={saving}>Continue <ArrowRight size={15} /></button> : <button className="wizard-continue" onClick={() => finish("Active")} disabled={saving}>{saving ? "Publishing…" : "Publish Campaign"}<ArrowRight size={15} /></button>}</div></div></div>;
}

function Field({ label, value, onChange, placeholder, textarea = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; textarea?: boolean }) { return <label className="wizard-field"><span>{label}</span>{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}</label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="wizard-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select one</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function StepTitle({ title, text }: { title: string; text: string }) { return <div className="wizard-step-title"><h2>{title}</h2><p>{text}</p></div>; }
function BasicInformation({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) { return <><StepTitle title="Let&apos;s start with the basics" text="Give your campaign a name and tell us what you&apos;re looking to achieve." /><div className="wizard-grid"><Field label="Campaign Name *" value={draft.name} onChange={(value) => update("name", value)} placeholder="e.g. Summer Style Stories" /><SelectField label="Client Brand *" value={draft.brand} onChange={(value) => update("brand", value)} options={["Aurelia Fashion", "Glow Cosmetics", "Nexora Tech", "Earth & Co.", "＋ Add a new client brand"]} /><Field label="Campaign Description" value={draft.description} onChange={(value) => update("description", value)} placeholder="Briefly describe the campaign..." textarea /><SelectField label="Campaign Objective *" value={draft.objective} onChange={(value) => update("objective", value)} options={["Brand Awareness", "Engagement", "Product Promotion", "Website Traffic", "Lead Generation", "Sales & Conversions"]} /><SelectField label="Campaign Category *" value={draft.category} onChange={(value) => update("category", value)} options={niches} /><SelectField label="Campaign Type *" value={draft.type} onChange={(value) => update("type", value)} options={["Product Seeding", "Paid Collaboration", "Sponsored Content", "Affiliate Campaign", "Brand Ambassador"]} /></div></>; }
function PlatformsAudience({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) { const togglePlatform = (platform: string) => update("platforms", draft.platforms.includes(platform) ? draft.platforms.filter((item) => item !== platform) : [...draft.platforms, platform]); return <><StepTitle title="Who are you trying to reach?" text="Choose your platforms and define the audience for this campaign." /><div className="wizard-section-label">Platforms</div><div className="option-row">{["Instagram", "YouTube"].map((platform) => <button type="button" className={draft.platforms.includes(platform) ? "select-option selected" : "select-option"} key={platform} onClick={() => togglePlatform(platform)}><span>{draft.platforms.includes(platform) ? <Check size={13} /> : null}</span>{platform}</button>)}</div>{draft.platforms.length ? <div className="format-note">{draft.platforms.map((platform) => <span key={platform}><b>{platform} formats</b> · {(platform === "Instagram" ? ["Reels", "Stories", "Feed Posts", "Carousel Posts"] : ["Shorts", "Dedicated Videos", "Integrated Videos"]).join(" · ")}</span>)}</div> : null}<div className="wizard-section-label audience-label">Audience information</div><div className="wizard-grid"><Field label="Target location" value={draft.location} onChange={(value) => update("location", value)} placeholder="Country, state or city" /><SelectField label="Target age group" value={draft.age} onChange={(value) => update("age", value)} options={["18–24", "25–34", "35–44", "45–54", "55+"]} /><SelectField label="Target gender" value={draft.gender} onChange={(value) => update("gender", value)} options={["All", "Women", "Men", "Custom / Other"]} /><Field label="Audience interests" value={draft.interests} onChange={(value) => update("interests", value)} placeholder="e.g. styling, skincare, travel" /></div><div className="wizard-section-label">Preferred creator niches</div><div className="chip-grid">{niches.map((niche) => <button type="button" className={draft.preferredNiches.includes(niche) ? "chip selected" : "chip"} key={niche} onClick={() => update("preferredNiches", draft.preferredNiches.includes(niche) ? draft.preferredNiches.filter((item) => item !== niche) : [...draft.preferredNiches, niche])}>{niche}</button>)}</div></>; }
function CampaignBrief({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) { return <><StepTitle title="Define your campaign requirements" text="Tell creators what they need to include in their content." /><Field label="Campaign Objective Details" value={draft.objectiveDetails} onChange={(value) => update("objectiveDetails", value)} placeholder="Describe the message and expected outcome..." textarea /><div className="wizard-grid"><Field label="Key Messages" value={draft.keyMessages} onChange={(value) => update("keyMessages", value)} placeholder="One message per line" textarea /><Field label="Required Hashtags" value={draft.hashtags} onChange={(value) => update("hashtags", value)} placeholder="#SummerStyle, #Aurelia" textarea /><Field label="Mandatory Brand Mentions" value={draft.mentions} onChange={(value) => update("mentions", value)} placeholder="@brandname" textarea /><Field label="Mandatory Keywords" value={draft.keywords} onChange={(value) => update("keywords", value)} placeholder="Words or phrases" textarea /></div><SelectField label="Disclosure Requirements" value={draft.disclosure} onChange={(value) => update("disclosure", value)} options={["Paid partnership disclosure", "Sponsored content disclosure", "Custom disclosure text"]} /><Field label="Content Guidelines" value={draft.guidelines} onChange={(value) => update("guidelines", value)} placeholder="What should creators do and avoid?" textarea /><Field label="Reference Links" value={draft.references} onChange={(value) => update("references", value)} placeholder="https://..." /></>; }
function Deliverables({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) { const change = (index: number, key: keyof Deliverable, value: string) => update("deliverables", draft.deliverables.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)); return <><StepTitle title="What should creators deliver?" text="Specify the content creators need to produce for this campaign." /><div className="deliverable-list">{draft.deliverables.map((item, index) => <div className="deliverable-card" key={index}><div className="deliverable-card-head"><b>Deliverable {index + 1}</b>{draft.deliverables.length > 1 ? <button onClick={() => update("deliverables", draft.deliverables.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button> : null}</div><div className="wizard-grid"><SelectField label="Platform" value={item.platform} onChange={(value) => change(index, "platform", value)} options={["Instagram", "YouTube"]} /><SelectField label="Content format" value={item.format} onChange={(value) => change(index, "format", value)} options={["Reel", "Story", "Feed Post", "Short", "Dedicated Video"]} /><Field label="Quantity" value={item.quantity} onChange={(value) => change(index, "quantity", value)} placeholder="1" /><Field label="Description" value={item.description} onChange={(value) => change(index, "description", value)} placeholder="Describe the deliverable..." textarea /><Field label="Submission deadline" value={item.submission} onChange={(value) => change(index, "submission", value)} placeholder="YYYY-MM-DD" /><Field label="Publication deadline" value={item.publication} onChange={(value) => change(index, "publication", value)} placeholder="YYYY-MM-DD" /></div></div>)}</div><button className="add-deliverable" onClick={() => update("deliverables", [...draft.deliverables, { platform: "Instagram", format: "Reel", quantity: "1", description: "", submission: "", publication: "" }])}><Plus size={14} /> Add Deliverable</button></>; }
function BudgetTimeline({ draft, update }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) { return <><StepTitle title="Set your budget and campaign timeline" text="Define the campaign budget, compensation and important dates." /><div className="wizard-grid"><Field label="Total Campaign Budget" value={draft.minBudget} onChange={(value) => update("minBudget", value)} placeholder="₹ 0" /><SelectField label="Currency" value={draft.currency} onChange={(value) => update("currency", value)} options={["INR (₹)", "USD ($)", "GBP (£)"]} /><SelectField label="Compensation Type" value={draft.compensation} onChange={(value) => update("compensation", value)} options={["Fixed Payment", "Product Exchange", "Affiliate Commission", "Mixed Compensation", "Negotiable"]} /><Field label="Compensation Details" value={draft.compensationDetails} onChange={(value) => update("compensationDetails", value)} placeholder="Optional details" /></div><div className="wizard-section-label">Campaign timeline</div><div className="wizard-grid date-grid"><DateField label="Campaign Start Date" value={draft.start} onChange={(value) => update("start", value)} /><DateField label="Campaign End Date" value={draft.end} onChange={(value) => update("end", value)} /><DateField label="Application Deadline" value={draft.applicationDeadline} onChange={(value) => update("applicationDeadline", value)} /><DateField label="Creator Selection Deadline" value={draft.selectionDeadline} onChange={(value) => update("selectionDeadline", value)} /><DateField label="Content Submission Deadline" value={draft.submissionDeadline} onChange={(value) => update("submissionDeadline", value)} /><DateField label="Expected Publication Date" value={draft.publicationDate} onChange={(value) => update("publicationDate", value)} /></div></>; }
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="wizard-field"><span>{label}</span><span className="date-input"><CalendarDays size={14} /><input type="date" value={value} onChange={(event) => onChange(event.target.value)} /></span></label>; }
function Review({ draft, onEdit }: { draft: Draft; onEdit: (step: number) => void }) { const sections = [{ title: "Basic Information", value: draft.name || "Not completed", step: 0 }, { title: "Platforms & Audience", value: draft.platforms.length ? draft.platforms.join(" · ") : "Not completed", step: 1 }, { title: "Campaign Brief", value: draft.objectiveDetails || "No objective details added", step: 2 }, { title: "Deliverables", value: `${draft.deliverables.length} deliverable${draft.deliverables.length === 1 ? "" : "s"}`, step: 3 }, { title: "Budget & Timeline", value: draft.start && draft.end ? `${draft.start} → ${draft.end}` : "Not completed", step: 4 }]; return <><StepTitle title="Review your campaign" text="Everything looks good? Review your campaign details before publishing." /><div className="review-list">{sections.map((section) => <div className="review-section" key={section.title}><span><b>{section.title}</b><small>{section.value}</small></span><button onClick={() => onEdit(section.step)}>Edit</button></div>)}</div><div className="review-summary"><b>{draft.name || "Untitled campaign"}</b><span>{draft.brand} · {draft.objective || "Objective not selected"}</span><small>Publishing will set this campaign to Active in your campaign listing.</small></div></>; }
