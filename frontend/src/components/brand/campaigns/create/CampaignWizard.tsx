"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Plus, Trash2 } from "lucide-react";
import { createCampaign, getSharedCampaignById } from "@/lib/shared/services";
import { canonicalIdForNewCampaign } from "@/lib/shared/campaign-id-mapping";
import type { Campaign, CampaignDeliverable, SocialPlatform } from "@/types/shared";
import "./campaign-wizard.css";

const stepLabels = ["Basic Information", "Platforms & Audience", "Campaign Brief", "Deliverables", "Budget & Timeline", "Review & Publish"];
const niches = ["Fashion", "Beauty", "Technology", "Lifestyle", "Travel", "Food", "Fitness", "Education", "Other"];
type Deliverable = { platform: string; format: string; quantity: string; description: string; submission: string; publication: string };
type Draft = { name: string; brand: string; description: string; objective: string; category: string; type: string; platforms: string[]; formats: Record<string, string[]>; location: string; age: string; gender: string; interests: string; preferredNiches: string[]; creatorSize: string[]; objectiveDetails: string; keyMessages: string; hashtags: string; mentions: string; keywords: string; disclosure: string; guidelines: string; references: string; deliverables: Deliverable[]; currency: string; compensation: string; compensationDetails: string; minBudget: string; maxBudget: string; start: string; end: string; applicationDeadline: string; selectionDeadline: string; submissionDeadline: string; publicationDate: string };
type WizardField = keyof Draft | "audience" | "brief" | `deliverables.${number}.${keyof Deliverable}`;
type ValidationIssue = { field: WizardField; message: string; step: number };

const emptyDraft: Draft = { name: "", brand: "", description: "", objective: "", category: "", type: "", platforms: [], formats: {}, location: "", age: "", gender: "All", interests: "", preferredNiches: [], creatorSize: [], objectiveDetails: "", keyMessages: "", hashtags: "", mentions: "", keywords: "", disclosure: "Paid partnership disclosure", guidelines: "", references: "", deliverables: [], currency: "INR", compensation: "Fixed Payment", compensationDetails: "", minBudget: "", maxBudget: "", start: "", end: "", applicationDeadline: "", selectionDeadline: "", submissionDeadline: "", publicationDate: "" };

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function todayDateInput() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

const currencies = ["INR", "USD", "GBP"];
const compensationTypes = ["Fixed Payment", "Product Exchange", "Affiliate Commission", "Mixed Compensation", "Negotiable"];
const deliverableFormats: Record<string, string[]> = { Instagram: ["Reel", "Story", "Feed Post"], YouTube: ["Short", "Dedicated Video"] };

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
  const normalized = value.trim().replace(/^(INR|USD|GBP)\s*/i, "").replace(/^[\u20b9$\u00a3]\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(\.\d+)?$/.test(normalized)) return Number.NaN;
  const amount = Number(normalized.replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : Number.NaN;
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
    ...draft.deliverables.flatMap((item, index) => item.platform === "Instagram" || item.platform === "YouTube" ? [] : [`Draft deliverable ${index + 1}: platform ${item.platform || "not selected"}; format ${item.format || "not selected"}; quantity ${item.quantity || "not entered"}; description ${item.description || "not entered"}; submission date ${item.submission || "not entered"}; publication date ${item.publication || "not entered"}.`]),
  ];
  const deliverables: CampaignDeliverable[] = draft.deliverables.filter((item) => item.platform === "Instagram" || item.platform === "YouTube").map((item, index) => ({
    id: `${id}-deliverable-${index + 1}`,
    campaignId: id,
    title: item.format.trim(),
    description: item.description.trim(),
    platform: item.platform === "Instagram" ? "INSTAGRAM" : "YOUTUBE",
    contentType: item.format,
    dueDate: item.submission ? dateToIso(item.submission, true) : "",
    requirements: [
      ...(item.quantity ? [`Quantity: ${item.quantity}`] : []),
      ...(item.publication ? [`Publication deadline: ${item.publication}`] : []),
    ],
  }));
  const budgetAmount = numericBudget(draft.minBudget);
  const maximumBudget = numericBudget(draft.maxBudget);
  return {
    id,
    organizationId: "org-studio-north",
    ...(draft.brand ? { clientBrandId: draft.brand } : {}),
    organizationName: "Studio North",
    title: draft.name.trim(),
    description: draft.description,
    objectives: [draft.objective, ...splitLines(draft.objectiveDetails)].filter(Boolean),
    industry: "",
    categories: draft.category ? [draft.category] : [],
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
    startDate: draft.start ? dateToIso(draft.start) : "",
    endDate: draft.end ? dateToIso(draft.end, true) : "",
    applicationDeadline: draft.applicationDeadline ? dateToIso(draft.applicationDeadline, true) : "",
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
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveError("");
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[String(key)];
      if (key === "deliverables") Object.keys(nextErrors).filter((item) => item.startsWith("deliverables.")).forEach((item) => delete nextErrors[item]);
      if (["location", "age", "interests"].includes(String(key))) delete nextErrors.audience;
      if (["objectiveDetails", "keyMessages", "guidelines", "hashtags", "mentions", "keywords"].includes(String(key))) delete nextErrors.brief;
      if (["minBudget", "maxBudget"].includes(String(key))) {
        delete nextErrors.minBudget;
        delete nextErrors.maxBudget;
      }
      if (["compensation", "compensationDetails"].includes(String(key))) {
        delete nextErrors.compensation;
        delete nextErrors.compensationDetails;
      }
      if (["start", "end", "applicationDeadline"].includes(String(key))) {
        delete nextErrors.start;
        delete nextErrors.end;
        delete nextErrors.applicationDeadline;
      }
      return nextErrors;
    });
  }

  function validateDraftValues() {
    const issues: ValidationIssue[] = [];
    const add = (field: WizardField, message: string, issueStep: number) => issues.push({ field, message, step: issueStep });
    const validPlatforms = ["Instagram", "YouTube"];

    if (draft.platforms.some((platform) => !validPlatforms.includes(platform))) add("platforms", "Choose a supported campaign platform.", 1);
    if (draft.references.trim() && !isValidHttpUrl(draft.references.trim())) add("references", "Enter a valid http or https reference link.", 2);

    draft.deliverables.forEach((item, index) => {
      const field = (name: keyof Deliverable) => `deliverables.${index}.${name}` as WizardField;
      if (item.platform && !validPlatforms.includes(item.platform)) add(field("platform"), "Choose Instagram or YouTube.", 3);
      if (item.format && item.platform && !deliverableFormats[item.platform]?.includes(item.format)) add(field("format"), `Choose a format supported by ${item.platform}.`, 3);
      if (item.quantity && (!/^\d+$/.test(item.quantity.trim()) || Number(item.quantity) <= 0)) add(field("quantity"), "Quantity must be a positive whole number.", 3);
      if (item.submission && !isValidDateInput(item.submission)) add(field("submission"), "Enter a valid submission date.", 3);
      if (item.publication && !isValidDateInput(item.publication)) add(field("publication"), "Enter a valid publication date.", 3);
    });

    const optionalDates: Array<[keyof Draft, string]> = [
      ["start", "campaign start date"], ["end", "campaign end date"], ["applicationDeadline", "application deadline"],
      ["selectionDeadline", "creator selection deadline"], ["submissionDeadline", "content submission deadline"], ["publicationDate", "expected publication date"],
    ];
    optionalDates.forEach(([field, label]) => {
      const value = draft[field] as string;
      if (value && !isValidDateInput(value)) add(field, `Enter a valid ${label}.`, 4);
    });
    if (draft.start && draft.end && isValidDateInput(draft.start) && isValidDateInput(draft.end) && draft.end <= draft.start) add("end", "Campaign end date must be after the start date.", 4);
    if (draft.start && draft.applicationDeadline && isValidDateInput(draft.start) && isValidDateInput(draft.applicationDeadline) && draft.applicationDeadline > draft.start) add("applicationDeadline", "Application deadline must be on or before the campaign start date.", 4);

    const min = numericBudget(draft.minBudget);
    const max = numericBudget(draft.maxBudget);
    if (Number.isNaN(min)) add("minBudget", "Enter a valid non-negative budget amount.", 4);
    if (Number.isNaN(max)) add("maxBudget", "Enter a valid non-negative maximum budget.", 4);
    if (typeof min === "number" && typeof max === "number" && max < min) add("maxBudget", "Maximum budget must be at least the minimum budget.", 4);
    if (!currencies.includes(draft.currency.split(" ")[0])) add("currency", "Choose a supported currency.", 4);
    if (!compensationTypes.includes(draft.compensation)) add("compensation", "Choose a supported compensation type.", 4);
    if (["Affiliate Commission", "Mixed Compensation"].includes(draft.compensation) && !draft.compensationDetails.trim()) add("compensationDetails", "Add details for this compensation type.", 4);
    return issues;
  }

  function validateForPublish() {
    const issues = validateDraftValues();
    const add = (field: WizardField, message: string, issueStep: number) => issues.push({ field, message, step: issueStep });
    if (!draft.name.trim()) add("name", "Campaign title is required.", 0);
    if (!draft.description.trim()) add("description", "Campaign description is required.", 0);
    if (!draft.brand.trim()) add("brand", "Select a client brand.", 0);
    if (!draft.objective.trim()) add("objective", "Select a campaign objective.", 0);
    if (!draft.category.trim()) add("category", "Select a campaign category.", 0);
    if (!draft.type.trim()) add("type", "Select a campaign type.", 0);

    if (!draft.platforms.length) add("platforms", "Select at least one campaign platform.", 1);
    if (![draft.location, draft.age, draft.interests].some((value) => value.trim())) add("audience", "Add at least one audience detail, such as location, age group, or interests.", 1);
    if (![draft.objectiveDetails, draft.keyMessages, draft.guidelines, draft.hashtags, draft.mentions, draft.keywords].some((value) => value.trim())) add("brief", "Add at least one campaign objective detail, key message, or content requirement.", 2);

    if (!draft.deliverables.length) add("deliverables", "Add at least one deliverable.", 3);
    draft.deliverables.forEach((item, index) => {
      const field = (name: keyof Deliverable) => `deliverables.${index}.${name}` as WizardField;
      if (!item.platform) add(field("platform"), "Select a platform for this deliverable.", 3);
      else if (!deliverableFormats[item.platform]) add(field("platform"), "Choose Instagram or YouTube.", 3);
      if (!item.format) add(field("format"), "Select a deliverable format.", 3);
      else if (!deliverableFormats[item.platform]?.includes(item.format)) add(field("format"), `Choose a format supported by ${item.platform || "the selected platform"}.`, 3);
      if (!/^\d+$/.test(item.quantity.trim()) || Number(item.quantity) <= 0) add(field("quantity"), "Quantity must be a positive whole number.", 3);
      if (!item.description.trim()) add(field("description"), "Describe this deliverable.", 3);
    });

    if (!draft.start) add("start", "Campaign start date is required to publish.", 4);
    if (!draft.end) add("end", "Campaign end date is required to publish.", 4);
    if (!draft.applicationDeadline) add("applicationDeadline", "Application deadline is required to publish.", 4);
    if (draft.applicationDeadline && isValidDateInput(draft.applicationDeadline) && draft.applicationDeadline < todayDateInput()) add("applicationDeadline", "Application deadline must be today or later to publish.", 4);
    if (draft.compensation === "Fixed Payment" && !draft.minBudget.trim() && !draft.maxBudget.trim()) add("minBudget", "Enter a budget for fixed payment, or choose another compensation type.", 4);
    return issues;
  }

  function submitValidation(issues: ValidationIssue[]) {
    if (!issues.length) {
      setErrors({});
      return true;
    }
    setErrors(Object.fromEntries(issues.map((issue) => [issue.field, issue.message])));
    setStep(Math.min(...issues.map((issue) => issue.step)));
    setSaveError("");
    return false;
  }

  function next() {
    const issues = validateForPublish().filter((issue) => issue.step === step);
    if (!submitValidation(issues)) return;
    setStep(Math.min(5, step + 1));
  }
  function goTo(nextStep: number) { if (nextStep <= step) { setStep(nextStep); setErrors({}); } }
  function finish(status: "Active" | "Draft") {
    const valid = status === "Draft" ? submitValidation(validateDraftValues()) : submitValidation(validateForPublish());
    if (!valid) return;
    setSaving(true);
    setSaveError("");
    try {
      createCampaign(toCanonicalCampaign(draft, status));
      window.setTimeout(() => { setSaving(false); setPublished(status === "Active"); setDraftSaved(status === "Draft"); window.setTimeout(() => router.push("/brand/campaigns"), 700); }, 450);
    } catch (cause) {
      setSaving(false);
      setSaveError(cause instanceof Error ? cause.message : "Campaign could not be saved. Please try again.");
    }
  }
  return (
    <div className="brand-content wizard-page">
      <div className="wizard-breadcrumb"><Link href="/brand/campaigns">Campaigns</Link><span>/</span><b>Create Campaign</b></div>
      <section className="wizard-heading"><div><div className="brand-overline">CAMPAIGN BUILDER</div><h1>Create a Campaign</h1><p>Set up your campaign, define your requirements and find the right creators.</p></div><div className="wizard-heading-actions"><Link href="/brand/campaigns">Cancel</Link><button onClick={() => finish("Draft")} disabled={saving || draftSaved || published}>Save as Draft</button></div></section>
      <div className="wizard-shell">
        <div className="wizard-progress">{stepLabels.map((label, index) => <button key={label} className={index === step ? "current" : index < step ? "complete" : ""} onClick={() => goTo(index)} disabled={index > step}><span>{index < step ? <Check size={12} /> : `0${index + 1}`}</span><small>{label}</small></button>)}</div>
        <div className="wizard-step-count">Step {step + 1} of 6</div>
        <section className="wizard-form">
          {step === 0 ? <BasicInformation draft={draft} update={update} errors={errors} /> : null}
          {step === 1 ? <PlatformsAudience draft={draft} update={update} errors={errors} /> : null}
          {step === 2 ? <CampaignBrief draft={draft} update={update} errors={errors} /> : null}
          {step === 3 ? <Deliverables draft={draft} update={update} errors={errors} /> : null}
          {step === 4 ? <BudgetTimeline draft={draft} update={update} errors={errors} /> : null}
          {step === 5 ? <Review draft={draft} onEdit={goTo} /> : null}
          {saveError ? <p className="wizard-error" role="alert">{saveError}</p> : null}
          {draftSaved ? <p className="wizard-success" role="status"><Check size={15} />Draft saved. Returning to campaigns…</p> : null}
          {published ? <p className="wizard-success"><Check size={15} />Campaign published. Returning to campaigns…</p> : null}
        </section>
        <div className="wizard-actions"><button className="wizard-back" disabled={step === 0 || saving || draftSaved || published} onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button>{step < 5 ? <button className="wizard-continue" onClick={next} disabled={saving || draftSaved || published}>Continue <ArrowRight size={15} /></button> : <button className="wizard-continue" onClick={() => finish("Active")} disabled={saving || draftSaved || published}>{saving ? "Publishing…" : "Publish Campaign"}<ArrowRight size={15} /></button>}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, textarea = false, error }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; textarea?: boolean; error?: string }) {
  return <label className="wizard-field"><span>{label}</span>{textarea ? <textarea aria-invalid={Boolean(error)} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /> : <input aria-invalid={Boolean(error)} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}{error ? <small role="alert" style={{ display: "block", color: "var(--wine)", fontSize: 9, marginTop: 5 }}>{error}</small> : null}</label>;
}
function SelectField({ label, value, onChange, options, error }: { label: string; value: string; onChange: (value: string) => void; options: string[]; error?: string }) {
  return <label className="wizard-field"><span>{label}</span><select aria-invalid={Boolean(error)} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select one</option>{options.map((option) => <option key={option}>{option}</option>)}</select>{error ? <small role="alert" style={{ display: "block", color: "var(--wine)", fontSize: 9, marginTop: 5 }}>{error}</small> : null}</label>;
}
function StepTitle({ title, text }: { title: string; text: string }) { return <div className="wizard-step-title"><h2>{title}</h2><p>{text}</p></div>; }
function BasicInformation({ draft, update, errors }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void; errors: Record<string, string> }) {
  return <><StepTitle title="Let’s start with the basics" text="Give your campaign a name and tell us what you’re looking to achieve." /><div className="wizard-grid">
    <Field label="Campaign Name *" value={draft.name} onChange={(value) => update("name", value)} placeholder="e.g. Summer Style Stories" error={errors.name} />
    <SelectField label="Client Brand *" value={draft.brand} onChange={(value) => update("brand", value)} options={["Aurelia Fashion", "Glow Cosmetics", "Nexora Tech", "Earth & Co."]} error={errors.brand} />
    <Field label="Campaign Description *" value={draft.description} onChange={(value) => update("description", value)} placeholder="Briefly describe the campaign..." textarea error={errors.description} />
    <SelectField label="Campaign Objective *" value={draft.objective} onChange={(value) => update("objective", value)} options={["Brand Awareness", "Engagement", "Product Promotion", "Website Traffic", "Lead Generation", "Sales & Conversions"]} error={errors.objective} />
    <SelectField label="Campaign Category *" value={draft.category} onChange={(value) => update("category", value)} options={niches} error={errors.category} />
    <SelectField label="Campaign Type *" value={draft.type} onChange={(value) => update("type", value)} options={["Product Seeding", "Paid Collaboration", "Sponsored Content", "Affiliate Campaign", "Brand Ambassador"]} error={errors.type} />
  </div></>;
}
function PlatformsAudience({ draft, update, errors }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void; errors: Record<string, string> }) {
  const togglePlatform = (platform: string) => update("platforms", draft.platforms.includes(platform) ? draft.platforms.filter((item) => item !== platform) : [...draft.platforms, platform]);
  return <><StepTitle title="Who are you trying to reach?" text="Choose your platforms and define the audience for this campaign." /><div className="wizard-section-label">Platforms</div><div className="option-row">{["Instagram", "YouTube"].map((platform) => <button type="button" className={draft.platforms.includes(platform) ? "select-option selected" : "select-option"} key={platform} onClick={() => togglePlatform(platform)}><span>{draft.platforms.includes(platform) ? <Check size={13} /> : null}</span>{platform}</button>)}</div>{errors.platforms ? <small role="alert" style={{ display: "block", color: "var(--wine)", fontSize: 9, marginTop: 6 }}>{errors.platforms}</small> : null}{draft.platforms.length ? <div className="format-note">{draft.platforms.map((platform) => <span key={platform}><b>{platform} formats</b> · {(platform === "Instagram" ? ["Reels", "Stories", "Feed Posts", "Carousel Posts"] : ["Shorts", "Dedicated Videos", "Integrated Videos"]).join(" · ")}</span>)}</div> : null}<div className="wizard-section-label audience-label">Audience information</div><div className="wizard-grid"><Field label="Target location" value={draft.location} onChange={(value) => update("location", value)} placeholder="Country, state or city" /><SelectField label="Target age group" value={draft.age} onChange={(value) => update("age", value)} options={["18–24", "25–34", "35–44", "45–54", "55+"]} /><SelectField label="Target gender" value={draft.gender} onChange={(value) => update("gender", value)} options={["All", "Women", "Men", "Custom / Other"]} /><Field label="Audience interests" value={draft.interests} onChange={(value) => update("interests", value)} placeholder="e.g. styling, skincare, travel" /></div>{errors.audience ? <small role="alert" style={{ display: "block", color: "var(--wine)", fontSize: 9, marginTop: -10, marginBottom: 12 }}>{errors.audience}</small> : null}<div className="wizard-section-label">Preferred creator niches</div><div className="chip-grid">{niches.map((niche) => <button type="button" className={draft.preferredNiches.includes(niche) ? "chip selected" : "chip"} key={niche} onClick={() => update("preferredNiches", draft.preferredNiches.includes(niche) ? draft.preferredNiches.filter((item) => item !== niche) : [...draft.preferredNiches, niche])}>{niche}</button>)}</div></>;
}
function CampaignBrief({ draft, update, errors }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void; errors: Record<string, string> }) {
  return <><StepTitle title="Define your campaign requirements" text="Tell creators what they need to include in their content." />{errors.brief ? <p className="wizard-error" role="alert">{errors.brief}</p> : null}<Field label="Campaign Objective Details" value={draft.objectiveDetails} onChange={(value) => update("objectiveDetails", value)} placeholder="Describe the message and expected outcome..." textarea /><div className="wizard-grid"><Field label="Key Messages" value={draft.keyMessages} onChange={(value) => update("keyMessages", value)} placeholder="One message per line" textarea /><Field label="Required Hashtags" value={draft.hashtags} onChange={(value) => update("hashtags", value)} placeholder="#SummerStyle, #Aurelia" textarea /><Field label="Mandatory Brand Mentions" value={draft.mentions} onChange={(value) => update("mentions", value)} placeholder="@brandname" textarea /><Field label="Mandatory Keywords" value={draft.keywords} onChange={(value) => update("keywords", value)} placeholder="Words or phrases" textarea /></div><SelectField label="Disclosure Requirements" value={draft.disclosure} onChange={(value) => update("disclosure", value)} options={["Paid partnership disclosure", "Sponsored content disclosure", "Custom disclosure text"]} /><Field label="Content Guidelines" value={draft.guidelines} onChange={(value) => update("guidelines", value)} placeholder="What should creators do and avoid?" textarea /><Field label="Reference Links" value={draft.references} onChange={(value) => update("references", value)} placeholder="https://..." error={errors.references} /></>;
}
function Deliverables({ draft, update, errors }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void; errors: Record<string, string> }) {
  const change = (index: number, key: keyof Deliverable, value: string) => update("deliverables", draft.deliverables.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  return <><StepTitle title="What should creators deliver?" text="Specify the content creators need to produce for this campaign." />{errors.deliverables ? <p className="wizard-error" role="alert">{errors.deliverables}</p> : null}<div className="deliverable-list">{draft.deliverables.map((item, index) => <div className="deliverable-card" key={index}><div className="deliverable-card-head"><b>Deliverable {index + 1}</b>{draft.deliverables.length > 1 ? <button type="button" onClick={() => update("deliverables", draft.deliverables.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button> : null}</div><div className="wizard-grid">
    <SelectField label="Platform" value={item.platform} onChange={(value) => change(index, "platform", value)} options={["Instagram", "YouTube"]} error={errors[`deliverables.${index}.platform`]} />
    <SelectField label="Content format" value={item.format} onChange={(value) => change(index, "format", value)} options={deliverableFormats[item.platform] ?? ["Reel", "Story", "Feed Post", "Short", "Dedicated Video"]} error={errors[`deliverables.${index}.format`]} />
    <Field label="Quantity" value={item.quantity} onChange={(value) => change(index, "quantity", value)} placeholder="1" error={errors[`deliverables.${index}.quantity`]} />
    <Field label="Description" value={item.description} onChange={(value) => change(index, "description", value)} placeholder="Describe the deliverable..." textarea error={errors[`deliverables.${index}.description`]} />
    <Field label="Submission deadline" value={item.submission} onChange={(value) => change(index, "submission", value)} placeholder="YYYY-MM-DD" error={errors[`deliverables.${index}.submission`]} />
    <Field label="Publication deadline" value={item.publication} onChange={(value) => change(index, "publication", value)} placeholder="YYYY-MM-DD" error={errors[`deliverables.${index}.publication`]} />
  </div></div>)}</div><button type="button" className="add-deliverable" onClick={() => update("deliverables", [...draft.deliverables, { platform: "Instagram", format: "Reel", quantity: "1", description: "", submission: "", publication: "" }])}><Plus size={14} /> Add Deliverable</button></>;
}
function BudgetTimeline({ draft, update, errors }: { draft: Draft; update: <K extends keyof Draft>(key: K, value: Draft[K]) => void; errors: Record<string, string> }) {
  return <><StepTitle title="Set your budget and campaign timeline" text="Define the campaign budget, compensation and important dates." /><div className="wizard-grid"><Field label="Total Campaign Budget" value={draft.minBudget} onChange={(value) => update("minBudget", value)} placeholder="0" error={errors.minBudget} /><SelectField label="Currency" value={draft.currency} onChange={(value) => update("currency", value)} options={currencies} error={errors.currency} /><Field label="Maximum Campaign Budget" value={draft.maxBudget} onChange={(value) => update("maxBudget", value)} placeholder="Optional" error={errors.maxBudget} /><SelectField label="Compensation Type" value={draft.compensation} onChange={(value) => update("compensation", value)} options={compensationTypes} error={errors.compensation} /><Field label="Compensation Details" value={draft.compensationDetails} onChange={(value) => update("compensationDetails", value)} placeholder="Optional details" error={errors.compensationDetails} /></div><div className="wizard-section-label">Campaign timeline</div><div className="wizard-grid date-grid"><DateField label="Campaign Start Date" value={draft.start} onChange={(value) => update("start", value)} error={errors.start} /><DateField label="Campaign End Date" value={draft.end} onChange={(value) => update("end", value)} error={errors.end} /><DateField label="Application Deadline" value={draft.applicationDeadline} onChange={(value) => update("applicationDeadline", value)} error={errors.applicationDeadline} /><DateField label="Creator Selection Deadline" value={draft.selectionDeadline} onChange={(value) => update("selectionDeadline", value)} error={errors.selectionDeadline} /><DateField label="Content Submission Deadline" value={draft.submissionDeadline} onChange={(value) => update("submissionDeadline", value)} error={errors.submissionDeadline} /><DateField label="Expected Publication Date" value={draft.publicationDate} onChange={(value) => update("publicationDate", value)} error={errors.publicationDate} /></div></>;
}
function DateField({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return <label className="wizard-field"><span>{label}</span><span className="date-input"><CalendarDays size={14} /><input aria-invalid={Boolean(error)} type="date" value={value} onChange={(event) => onChange(event.target.value)} /></span>{error ? <small role="alert" style={{ display: "block", color: "var(--wine)", fontSize: 9, marginTop: 5 }}>{error}</small> : null}</label>;
}
function Review({ draft, onEdit }: { draft: Draft; onEdit: (step: number) => void }) {
  const sections = [{ title: "Basic Information", value: draft.name || "Not completed", step: 0 }, { title: "Platforms & Audience", value: draft.platforms.length ? draft.platforms.join(" · ") : "Not completed", step: 1 }, { title: "Campaign Brief", value: draft.objectiveDetails || "No objective details added", step: 2 }, { title: "Deliverables", value: `${draft.deliverables.length} deliverable${draft.deliverables.length === 1 ? "" : "s"}`, step: 3 }, { title: "Budget & Timeline", value: draft.start && draft.end ? `${draft.start} → ${draft.end}` : "Not completed", step: 4 }];
  return <><StepTitle title="Review your campaign" text="Everything looks good? Review your campaign details before publishing." /><div className="review-list">{sections.map((section) => <div className="review-section" key={section.title}><span><b>{section.title}</b><small>{section.value}</small></span><button onClick={() => onEdit(section.step)}>Edit</button></div>)}</div><div className="review-summary"><b>{draft.name || "Untitled campaign"}</b><span>{draft.brand || "Client brand not selected"} · {draft.objective || "Objective not selected"}</span><small>Publishing will set this campaign to Active in your campaign listing.</small></div></>;
}
