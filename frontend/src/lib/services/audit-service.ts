export type AuditStatus = "Passed" | "Failed" | "Warning" | "Not Checked";
export type ReviewStatus = "Pending Review" | "Auditing" | "Audit Completed" | "Revision Requested" | "Approved" | "Rejected";
export type SubmissionEvent = { event: string; actor: string; timestamp: string; details: string };
export type CampaignRequirements = { hashtags: string[]; mentions: string[]; keywords: string[]; disclosure: string[]; minCaptionLength: number; maxCaptionLength: number; contentGuidelines: string; deliverables: string; deadline: string };
export type AuditCheck = { requirement: string; status: AuditStatus; explanation: string; matched?: string };
export type AuditInput = { caption: string; contentUrl: string; submittedAt: string };
export type AuditResult = { score: number; status: "Passed" | "Failed" | "Warning"; checks: AuditCheck[]; passed: number; failed: number; warnings: number; suggestions: string[] };

const requirements: Record<number, CampaignRequirements> = {
  1: { hashtags: ["#AureliaSummer", "#AureliaStyle"], mentions: ["@aureliafashion"], keywords: ["summer", "linen"], disclosure: ["#ad", "#sponsored"], minCaptionLength: 80, maxCaptionLength: 500, contentGuidelines: "Warm, natural styling with a clear view of the collection.", deliverables: "1 Instagram Reel + 3 story frames", deadline: "Jun 25, 2026" },
  2: { hashtags: ["#EverydayBeauty"], mentions: ["@glowcosmetics"], keywords: ["hydration", "routine"], disclosure: ["#ad", "paid partnership"], minCaptionLength: 60, maxCaptionLength: 400, contentGuidelines: "Show the product in an honest everyday routine.", deliverables: "1 Reel + 1 YouTube Short", deadline: "Jul 08, 2026" },
  3: { hashtags: ["#TechMadeSimple"], mentions: ["@nexoratech"], keywords: ["simple", "smart"], disclosure: ["#ad"], minCaptionLength: 50, maxCaptionLength: 600, contentGuidelines: "Make the product benefit understandable to a first-time buyer.", deliverables: "1 YouTube video", deadline: "Aug 01, 2026" },
  4: { hashtags: ["#EarthAndCo"], mentions: ["@earthandco"], keywords: ["sustainable", "refill"], disclosure: ["#ad"], minCaptionLength: 70, maxCaptionLength: 450, contentGuidelines: "Keep the message practical and avoid unsupported environmental claims.", deliverables: "1 Instagram Carousel", deadline: "May 20, 2026" },
  5: { hashtags: ["#SofterRitual"], mentions: ["@hearthhome"], keywords: ["ritual", "slow living"], disclosure: ["#ad"], minCaptionLength: 60, maxCaptionLength: 500, contentGuidelines: "Quiet, considered storytelling with an authentic home setting.", deliverables: "1 Instagram Reel", deadline: "Jun 14, 2026" },
};
export function getRequirements(campaignId: number) { return requirements[campaignId] ?? requirements[1]; }
const includesAny = (value: string, options: string[]) => options.find((item) => value.toLowerCase().includes(item.toLowerCase()));

export function runContentAudit(submission: AuditInput, policy: CampaignRequirements): AuditResult {
  const caption = submission.caption.toLowerCase();
  const checks: AuditCheck[] = [];
  const required = (label: string, values: string[], kind: string, any = false) => { const missing = any ? (includesAny(caption, values) ? [] : values) : values.filter((value) => !caption.includes(value.toLowerCase())); checks.push({ requirement: label, status: missing.length ? "Failed" : "Passed", explanation: missing.length ? `Missing ${kind}: ${missing.join(", ")}.` : `All required ${kind} are present.`, matched: values.filter((value) => caption.includes(value.toLowerCase())).join(", ") || undefined }); };
  required("Required hashtags", policy.hashtags, "hashtags"); required("Mandatory brand mentions", policy.mentions, "mentions"); required("Mandatory keywords", policy.keywords, "keywords"); required("Disclosure requirements", policy.disclosure, "disclosures", true);
  const lengthPass = submission.caption.length >= policy.minCaptionLength && submission.caption.length <= policy.maxCaptionLength; checks.push({ requirement: "Caption length", status: lengthPass ? "Passed" : "Warning", explanation: `${submission.caption.length} characters; expected ${policy.minCaptionLength}–${policy.maxCaptionLength}.` });
  const submittedDate = new Date(submission.submittedAt); const deadlineDate = new Date(policy.deadline); const hasDate = !Number.isNaN(submittedDate.getTime()) && !Number.isNaN(deadlineDate.getTime()); const deadlinePass = !hasDate || submittedDate <= deadlineDate; checks.push({ requirement: "Submission deadline", status: deadlinePass ? "Passed" : "Failed", explanation: deadlinePass ? `Submitted by ${policy.deadline}.` : `Submitted after the ${policy.deadline} deadline.` });
  const urlPass = /^https?:\/\//i.test(submission.contentUrl); checks.push({ requirement: "Content URL", status: urlPass ? "Passed" : "Failed", explanation: urlPass ? "A valid original content URL was submitted." : "Add a valid http or https content URL." });
  const passed = checks.filter((check) => check.status === "Passed").length; const failed = checks.filter((check) => check.status === "Failed").length; const warnings = checks.filter((check) => check.status === "Warning").length; const score = Math.round(((passed + warnings * .5) / checks.length) * 100);
  return { score, checks, passed, failed, warnings, status: failed ? "Failed" : warnings ? "Warning" : "Passed", suggestions: checks.filter((check) => check.status !== "Passed").map((check) => check.explanation) };
}
