import type { AuditCheck, CampaignRequirements, Submission } from "@/components/brand/content-review/submissionStore";

export type AuditResult = { score: number; status: "Passed" | "Failed" | "Warning"; checks: AuditCheck[]; passed: number; failed: number; warnings: number; suggestions: string[] };
const includesAny = (value: string, options: string[]) => options.find((item) => value.toLowerCase().includes(item.toLowerCase()));

export function runContentAudit(submission: Submission, requirements: CampaignRequirements): AuditResult {
  const caption = submission.caption.toLowerCase();
  const checks: AuditCheck[] = [];
  const required = (label: string, values: string[], kind: string) => { const missing = values.filter((value) => !caption.includes(value.toLowerCase())); checks.push({ requirement: label, status: missing.length ? "Failed" : "Passed", explanation: missing.length ? `Missing ${kind}: ${missing.join(", ")}.` : `All required ${kind} are present.`, matched: values.filter((value) => caption.includes(value.toLowerCase())).join(", ") || undefined }); };
  required("Required hashtags", requirements.hashtags, "hashtags"); required("Mandatory brand mentions", requirements.mentions, "mentions"); required("Mandatory keywords", requirements.keywords, "keywords"); required("Disclosure requirements", requirements.disclosure, "disclosures");
  const lengthPass = submission.caption.length >= requirements.minCaptionLength && submission.caption.length <= requirements.maxCaptionLength; checks.push({ requirement: "Caption length", status: lengthPass ? "Passed" : "Warning", explanation: `${submission.caption.length} characters; expected ${requirements.minCaptionLength}–${requirements.maxCaptionLength}.` });
  const deadlinePass = submission.submittedAt <= requirements.deadline; checks.push({ requirement: "Submission deadline", status: deadlinePass ? "Passed" : "Failed", explanation: deadlinePass ? `Submitted by ${requirements.deadline}.` : `Submitted after the ${requirements.deadline} deadline.` });
  const urlPass = /^https?:\/\//.test(submission.contentUrl); checks.push({ requirement: "Content URL", status: urlPass ? "Passed" : "Failed", explanation: urlPass ? "A valid original content URL was submitted." : "Add a valid http or https content URL." });
  const passed = checks.filter((check) => check.status === "Passed").length; const failed = checks.filter((check) => check.status === "Failed").length; const warnings = checks.filter((check) => check.status === "Warning").length; const score = Math.round(((passed + warnings * .5) / checks.length) * 100);
  return { score, checks, passed, failed, warnings, status: failed ? "Failed" : warnings ? "Warning" : "Passed", suggestions: checks.filter((check) => check.status !== "Passed").map((check) => check.explanation) };
}
