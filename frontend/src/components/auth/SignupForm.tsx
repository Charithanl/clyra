"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Check, ChevronRight, Eye, EyeOff, Instagram, LockKeyhole, Mail, Upload, UserRound, Youtube } from "lucide-react";
import "./role-onboarding.css";
import "./role-onboarding-overrides.css";
import { clearSignupDraft, readSignupDraft, writeSignupDraft } from "@/lib/draft-storage";

type SignupType = "brand" | "creator";
type FormState = { name: string; email: string; password: string; confirm: string; terms: boolean };
type Errors = Partial<Record<keyof FormState, string>>;

export default function SignupForm({ type }: { type: SignupType }) {
  const router = useRouter();
  const brand = type === "brand";
  const [form, setForm] = useState<FormState>({ name: "", email: "", password: "", confirm: "", terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const [onboardingFields, setOnboardingFields] = useState<Record<string, string>>({});
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const draft = readSignupDraft();
    if (draft && draft.type !== type) clearSignupDraft();
    else if (draft && (draft.flow === "signup" || draft.flow === "onboarding")) {
      setForm({ name: draft.name, email: draft.email, password: "", confirm: "", terms: draft.termsAccepted });
      if (draft.flow === "onboarding") { setOnboardingStep(draft.step); setOnboardingFields(draft.fields ?? {}); }
    }
    setDraftReady(true);
  }, [type]);

  useEffect(() => {
    if (!draftReady) return;
    writeSignupDraft({ flow: onboardingStep === null ? "signup" : "onboarding", type, name: form.name, email: form.email, termsAccepted: form.terms, step: onboardingStep ?? 0, ...(onboardingStep === null ? {} : { fields: onboardingFields }) });
  }, [draftReady, form.email, form.name, form.terms, onboardingFields, onboardingStep, type]);

  const passwordChecks = { length: form.password.length >= 8, upper: /[A-Z]/.test(form.password), lower: /[a-z]/.test(form.password), number: /\d/.test(form.password) };
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  function update(field: keyof FormState, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); setIntegrationMessage(""); }
  function validate(): Errors { const next: Errors = {}; if (!form.name.trim()) next.name = "Enter your full name."; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address."; if (passwordScore < 4) next.password = "Use all four password requirements."; if (form.confirm !== form.password) next.confirm = "Passwords do not match."; if (!form.terms) next.terms = "You need to accept the terms to continue."; return next; }
  async function submit(event: FormEvent) { event.preventDefault(); const next = validate(); if (Object.keys(next).length) { setErrors(next); return; } setSubmitting(true); await new Promise((resolve) => window.setTimeout(resolve, 650)); setSubmitting(false); setOnboardingStep(0); }

  if (onboardingStep !== null) return <RoleOnboarding type={type} step={onboardingStep} fields={onboardingFields} onFieldsChange={setOnboardingFields} onBack={() => setOnboardingStep(null)} onPrevious={() => setOnboardingStep(Math.max(0, onboardingStep - 1))} onNext={() => setOnboardingStep(onboardingStep + 1)} onFinish={() => { clearSignupDraft(); router.push(type === "brand" ? "/brand/overview" : "/creator"); }} />;

  return <section className="signup-form-wrap"><div className="signup-context"><span className={brand ? "context-dot wine" : "context-dot sage"} />{brand ? "Brand / Agency account" : "Creator account"}<Link href="/account-type" onClick={clearSignupDraft}>Change</Link></div><div className="signup-heading"><div className="signup-eyebrow">{brand ? "WELCOME, PARTNER" : "WELCOME, CREATOR"}</div><h1>{brand ? "Create your brand account" : "Create your creator account"}</h1><p>{brand ? "Get started with your creator marketing workspace." : "Your next collaboration starts here."}</p><p className="signup-demo-notice">Demo signup preview · no account is created. Passwords are never saved in your draft.</p></div><form onSubmit={submit} noValidate><Field label="Full Name" required icon={<UserRound size={15} />} value={form.name} error={errors.name} onChange={(value) => update("name", value)} placeholder={brand ? "Alex Morgan" : "Your name"} /><Field label={brand ? "Work Email" : "Email Address"} required icon={<Mail size={15} />} value={form.email} error={errors.email} onChange={(value) => update("email", value)} placeholder={brand ? "you@company.com" : "you@example.com"} type="email" /><PasswordField label="Password" value={form.password} error={errors.password} visible={showPassword} setVisible={() => setShowPassword(!showPassword)} onChange={(value) => update("password", value)} /><PasswordMeter checks={passwordChecks} score={passwordScore} /><PasswordField label="Confirm Password" value={form.confirm} error={errors.confirm} visible={showConfirm} setVisible={() => setShowConfirm(!showConfirm)} onChange={(value) => update("confirm", value)} /><label className="terms-row"><input type="checkbox" checked={form.terms} onChange={(event) => update("terms", event.target.checked)} /><span>By continuing with this demo, you acknowledge the <Link href="/terms">draft Terms</Link> and <Link href="/privacy">draft Privacy notice</Link>.</span></label>{errors.terms ? <p className="field-error terms-error"><AlertCircle size={13} />{errors.terms}</p> : null}<button className="signup-primary" disabled={submitting}>{submitting ? "Preparing your account…" : "Continue with demo setup"}</button>{integrationMessage ? <p className="integration-message"><LockKeyhole size={14} />{integrationMessage}</p> : null}</form><div className="signup-divider"><span>or continue with</span></div><button className="google-button" type="button" disabled><span>G</span>Continue with Google <small>Coming soon</small></button><p className="signup-login">Already have an account? <Link href="/login">Log in</Link></p></section>;
}

function Field({ label, required, icon, value, error, onChange, placeholder, type = "text" }: { label: string; required?: boolean; icon: React.ReactNode; value: string; error?: string; onChange: (value: string) => void; placeholder: string; type?: string }) { return <label className="signup-field"><span>{label}{required ? <i>*</i> : null}</span><span className={error ? "input-shell invalid" : "input-shell"}>{icon}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} /> </span>{error ? <small className="field-error"><AlertCircle size={13} />{error}</small> : null}</label>; }
function PasswordField({ label, value, error, visible, setVisible, onChange }: { label: string; value: string; error?: string; visible: boolean; setVisible: () => void; onChange: (value: string) => void }) { return <label className="signup-field password-field"><span>{label}<i>*</i></span><span className={error ? "input-shell invalid" : "input-shell"}><LockKeyhole size={15} /><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder="••••••••" aria-invalid={Boolean(error)} /><button type="button" onClick={setVisible} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}</button></span>{error ? <small className="field-error"><AlertCircle size={13} />{error}</small> : null}</label>; }
function PasswordMeter({ checks, score }: { checks: Record<string, boolean>; score: number }) { const labels = [["length", "8+ characters"], ["upper", "One uppercase letter"], ["lower", "One lowercase letter"], ["number", "One number"]] as const; return <div className="password-meter"><div className="meter-bars">{[0, 1, 2, 3].map((bar) => <i className={bar < score ? "filled" : ""} key={bar} />)}</div><small>Password requirements</small><div className="password-checks">{labels.map(([key, label]) => <span className={checks[key] ? "pass" : ""} key={key}><Check size={11} />{label}</span>)}</div></div>; }

function RoleOnboarding({ type, step, fields, onFieldsChange, onBack, onPrevious, onNext, onFinish }: { type: SignupType; step: number; fields: Record<string, string>; onFieldsChange: (fields: Record<string, string>) => void; onBack: () => void; onPrevious: () => void; onNext: () => void; onFinish: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement>(".mini-field input, .mini-field select").forEach((control) => {
      const label = control.closest(".mini-field")?.querySelector("span")?.textContent?.trim();
      const value = label ? fields[`${type}-${step}-${label}`] : undefined;
      if (value !== undefined) control.value = value;
    });
    const saveField = (event: Event) => {
      const control = event.target;
      if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;
      const label = control.closest(".mini-field")?.querySelector("span")?.textContent?.trim();
      if (label) onFieldsChange({ ...fields, [`${type}-${step}-${label}`]: control.value });
    };
    root.addEventListener("input", saveField);
    root.addEventListener("change", saveField);
    return () => { root.removeEventListener("input", saveField); root.removeEventListener("change", saveField); };
  }, [fields, onFieldsChange, step, type]);
  const brand = type === "brand";
  const labels = brand ? ["Organization", "Workspace", "Team", "Ready"] : ["Profile", "Your niche", "Accounts", "Audience", "Portfolio", "Ready"];
  const last = step === labels.length - 1;
  return <div className="role-onboarding" ref={rootRef}><div className="role-onboarding-top"><button type="button" onClick={onBack}>← Back to account details</button><span>{brand ? "Brand / Agency setup" : "Creator setup"}</span></div><div className="signup-stepper">{labels.map((label, index) => <span className={index <= step ? "active" : ""} key={label}><i>{index < step ? <Check size={11} /> : index + 1}</i><small>{label}</small></span>)}</div><div className="role-onboarding-heading"><div className="signup-eyebrow">{brand ? "BUILD YOUR WORKSPACE" : "BUILD YOUR PROFILE"}</div><h2>{brand ? "Let&apos;s make this yours." : "Let&apos;s make your work easier to find."}</h2><p>{brand ? "A few details now will make every campaign feel more organised later." : "The right details help the right collaborations find you."}</p></div><div className="role-step-content">{brand ? <BrandStep step={step} /> : <CreatorStep step={step} />}</div><div className="role-step-actions"><button type="button" className="role-back" onClick={() => step === 0 ? onBack() : onPrevious()}>{step === 0 ? "Back" : "Previous"}</button><button type="button" className="signup-primary role-next" onClick={last ? onFinish : onNext}>{last ? "Setup complete" : "Continue"}<ChevronRight size={15} /></button></div>{last ? <p className="integration-message"><LockKeyhole size={14} />Demo onboarding only · no authenticated account was created.</p> : null}</div>;
}
function BrandStep({ step }: { step: number }) { if (step === 0) return <Step title="Tell us about your organization" text="This helps us tailor Clyra to the way you work."><div className="setup-fields"><MiniField label="Organization name" placeholder="e.g. Studio North" /><MiniSelect label="Organization type" options={["Brand", "Agency"]} /><MiniField label="Industry" placeholder="e.g. Fashion & beauty" /><MiniField label="Website" placeholder="https://yourwebsite.com" /><MiniSelect label="Company size" options={["1–10", "11–50", "51–200", "201–500", "500+"]} /><MiniSelect label="Country" options={["United States", "United Kingdom", "Canada", "Australia", "Other"]} /></div></Step>; if (step === 1) return <Step title="Shape your workspace" text="Give your team a shared place to make meaningful work."><MiniField label="Workspace name" placeholder="e.g. Studio North" /><MiniField label="Brand description" placeholder="What does your organization do?" /><div className="upload-row"><Upload size={17} /><span><b>Upload a workspace logo</b><small>PNG or JPG · up to 5MB · optional</small></span></div></Step>; if (step === 2) return <Step title="Bring your team along" text="Invite collaborators now, or skip this and do it later."><MiniField label="Team member email" placeholder="name@company.com" /><MiniField label="Role" placeholder="Campaign Manager" /><button className="add-team">＋ Add another teammate</button></Step>; return <Step title="Your workspace is ready." text="Your organization setup is complete. You can invite creators and teammates whenever you&apos;re ready."><div className="completion-card"><Check size={18} /><span><b>Studio North</b><small>Brand workspace · ready to go</small></span></div></Step>; }
function CreatorStep({ step }: { step: number }) { if (step === 0) return <Step title="Start with the basics" text="This is how brands will get to know you."><MiniField label="Creator display name" placeholder="e.g. Alex Morgan" /><MiniField label="Bio" placeholder="Tell the world what you create..." /><div className="setup-fields"><MiniField label="Location" placeholder="e.g. New York, NY" /><MiniField label="Languages" placeholder="e.g. English, Spanish" /></div></Step>; if (step === 1) return <Step title="What do you create?" text="Choose all the categories that feel like you."><div className="niche-grid">{["Fashion", "Beauty", "Lifestyle", "Technology", "Gaming", "Food", "Travel", "Fitness", "Education", "Other"].map((niche, index) => <button type="button" className={index === 0 || index === 2 ? "niche selected" : "niche"} key={niche}>{niche}</button>)}</div></Step>; if (step === 2) return <Step title="Connect your world" text="Add the accounts you want brands to discover. Instagram data is simulated in this MVP."><SocialRow icon={<Youtube size={19} />} title="YouTube" text="Public channel insights can be connected later." /><MiniField label="YouTube handle or channel URL" placeholder="@yourchannel or youtube.com/@yourchannel" /><SocialRow icon={<Instagram size={19} />} title="Instagram" text="Synthetic profile data is used for this MVP." simulated /><MiniField label="Instagram handle or profile URL" placeholder="@yourhandle or instagram.com/yourhandle" /></Step>; if (step === 3) return <Step title="Help us understand your audience" text="You can connect an account or add these details manually."><div className="setup-fields"><MiniField label="Total followers" placeholder="e.g. 24,500" /><MiniField label="Engagement rate" placeholder="e.g. 4.8%" /><MiniField label="Top audience location" placeholder="e.g. United States" /><MiniField label="Primary age group" placeholder="e.g. 25–34" /></div><small className="source-note">ⓘ Manually entered · connected platform data will be labelled by source.</small></Step>; if (step === 4) return <Step title="Showcase your work" text="A few examples help the right campaigns find you."><MiniField label="Portfolio link" placeholder="https://yourportfolio.com" /><MiniField label="Previous collaboration" placeholder="Brand or campaign name" /><button className="add-team">＋ Add another link</button></Step>; return <Step title="Your creator profile is ready." text="You&apos;re ready to discover campaigns that feel like a good fit."><div className="completion-card"><Check size={18} /><span><b>Profile completeness · 68%</b><small>You can keep polishing your profile later.</small></span></div></Step>; }
function Step({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <><h3>{title}</h3><p className="role-step-description">{text}</p>{children}</>; }
function MiniField({ label, placeholder }: { label: string; placeholder: string }) { return <label className="mini-field"><span>{label}</span><input placeholder={placeholder} /></label>; }
function MiniSelect({ label, options }: { label: string; options: string[] }) { return <label className="mini-field"><span>{label}</span><select defaultValue=""><option value="" disabled>Select one</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function SocialRow({ icon, title, text, simulated }: { icon: React.ReactNode; title: string; text: string; simulated?: boolean }) { return <div className="social-row">{icon}<span><b>{title} {simulated ? <em>Simulated data</em> : null}</b><small>{text}</small></span><button type="button" disabled>Connect</button></div>; }
