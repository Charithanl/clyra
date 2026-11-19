import { createContentReview, createAuditResult, createNotificationForRecipient, getAuditResultsForVersion, getContentReviewsForSubmission, getParticipationRecord, getSharedCampaignById, getSubmissionRecord, getSubmissionRecordsForCreator, getSubmissionVersions, getSubmissions as getCanonicalSubmissions, updateSubmissionRecord } from "@/lib/shared/services";
import { toCanonicalCampaignId, toLegacyCampaignId } from "@/lib/shared/campaign-id-mapping";
import { DEMO_CREATOR_IDENTITY, getDemoUserIdForCreator } from "@/lib/shared/identity";
import { getDemoCreatorProfile } from "@/lib/shared/mock-data";
import { runContentAudit, getRequirements as requirementsForCampaign, type AuditCheck, type AuditStatus, type CampaignRequirements, type ReviewStatus, type SubmissionEvent } from "@/lib/services/audit-service";
import type { AuditResult as CanonicalAudit, ContentReview as CanonicalReview, ContentSubmission, SubmissionVersion } from "@/types/shared";

export type { AuditCheck, AuditStatus, CampaignRequirements, ReviewStatus, SubmissionEvent };
export type Submission = { id: string; campaignId: number; creatorId: string; deliverableId: string; platform: string; format: string; contentUrl: string; caption: string; notes: string; submittedAt: string; auditStatus: AuditStatus; complianceScore: number; reviewStatus: ReviewStatus; currentVersion: number; versions: number[]; auditResults: AuditCheck[]; reviewHistory: SubmissionEvent[]; reviewer?: string; reviewerNote?: string };

const pendingDecision = new Map<string, { decision: CanonicalReview["decision"]; reviewerId: string; feedback: string }>();
const toCanonicalCreatorId = (id: string) => id === DEMO_CREATOR_IDENTITY.directoryId ? DEMO_CREATOR_IDENTITY.creatorId : id;
const toBrandCreatorId = (id: string) => id === DEMO_CREATOR_IDENTITY.creatorId ? DEMO_CREATOR_IDENTITY.directoryId : id;
const statusToReview = (submission: ContentSubmission, review?: CanonicalReview): ReviewStatus => review ? review.decision === "APPROVED" ? "Approved" : review.decision === "REJECTED" ? "Rejected" : "Revision Requested" : submission.status === "DRAFT" ? "Pending Review" : submission.status === "SUBMITTED" ? "Audit Completed" : submission.status === "APPROVED" ? "Approved" : submission.status === "REJECTED" ? "Rejected" : submission.status === "REVISION_REQUIRED" ? "Revision Requested" : "Pending Review";
const canonicalAuditStatus = (audit?: CanonicalAudit): AuditStatus => !audit ? "Not Checked" : audit.status === "FAILED" || audit.failedChecks.length ? "Failed" : audit.status === "WARNING" || audit.warnings.length ? "Warning" : audit.status === "NOT_CHECKED" ? "Not Checked" : "Passed";
const auditChecks = (audit?: CanonicalAudit): AuditCheck[] => audit?.findingDetails?.map((item) => ({ requirement: item.requirement, status: item.status === "PASSED" ? "Passed" : item.status === "FAILED" ? "Failed" : item.status === "WARNING" ? "Warning" : "Not Checked", explanation: item.explanation })) ?? [];
const reviewDecisionLabel = (decision: CanonicalReview["decision"]) => decision === "APPROVED" ? "Content approved" : decision === "REJECTED" ? "Content rejected" : "Revision requested";
const currentVersionId = (submission: ContentSubmission) => getSubmissionVersions(submission.id).find((version) => version.versionNumber === submission.currentVersion)?.id;

function project(submission: ContentSubmission): Submission {
  const version = getSubmissionVersions(submission.id).find((item) => item.versionNumber === submission.currentVersion);
  const audit = version ? getAuditResultsForVersion(version.id)[0] : undefined;
  const reviews = getContentReviewsForSubmission(submission.id).sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
  const currentReview = version ? [...reviews].reverse().find((review) => review.versionId === version.id) : undefined;
  const history: SubmissionEvent[] = [];
  for (const item of getSubmissionVersions(submission.id)) history.push({ event: item.versionNumber === 1 ? "Content submitted" : "Creator resubmitted content", actor: item.createdBy, timestamp: item.submittedAt, details: `Version ${item.versionNumber} submitted for review.` });
  for (const review of reviews) history.push({ event: reviewDecisionLabel(review.decision), actor: review.reviewerId, timestamp: review.reviewedAt, details: review.feedback });
  if (audit) history.push({ event: "Automated audit completed", actor: "Clyra audit service", timestamp: audit.auditedAt, details: `${canonicalAuditStatus(audit)} · ${audit.complianceScore}/100.` });
  history.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return { id: submission.id, campaignId: toLegacyCampaignId(submission.campaignId) ?? 0, creatorId: toBrandCreatorId(submission.creatorId), deliverableId: submission.deliverableId, platform: submission.platform === "INSTAGRAM" ? "Instagram" : "YouTube", format: version?.contentType ?? "Content", contentUrl: version?.contentUrl ?? submission.contentUrl, caption: version?.caption ?? submission.caption, notes: version?.supportingNotes ?? "", submittedAt: submission.submittedAt ?? submission.createdAt ?? "", auditStatus: canonicalAuditStatus(audit), complianceScore: audit?.complianceScore ?? 0, reviewStatus: statusToReview(submission, currentReview), currentVersion: submission.currentVersion, versions: getSubmissionVersions(submission.id).map((item) => item.versionNumber), auditResults: auditChecks(audit), reviewHistory: history, reviewer: currentReview?.reviewerId, reviewerNote: currentReview?.feedback };
}

export function getRequirements(campaignId: number): CampaignRequirements { return requirementsForCampaign(campaignId); }
function ensureCurrentAudit(submission: ContentSubmission | undefined) { if (!submission) return; const version = getSubmissionVersions(submission.id).find((item) => item.versionNumber === submission.currentVersion); if (version) persistAudit(submission, version); }
export function getSubmissions(): Submission[] { const records = getCanonicalSubmissions(); records.forEach(ensureCurrentAudit); return records.map(project).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)); }
export function getSubmission(id: string): Submission | undefined { const record = getSubmissionRecord(id); ensureCurrentAudit(record); return record ? project(record) : undefined; }

function persistAudit(submission: ContentSubmission, version: SubmissionVersion) {
  const existing = getAuditResultsForVersion(version.id)[0];
  if (existing) return existing;
  const legacyId = toLegacyCampaignId(submission.campaignId) ?? 1;
  const result = runContentAudit({ caption: version.caption, contentUrl: version.contentUrl, submittedAt: version.submittedAt }, getRequirements(legacyId));
  return createAuditResult({ id: `audit-${submission.id}-v${version.versionNumber}`, submissionId: submission.id, versionId: version.id, complianceScore: result.score, findings: result.checks.map((check) => check.explanation), passedChecks: result.checks.filter((check) => check.status === "Passed").map((check) => check.requirement), failedChecks: result.checks.filter((check) => check.status === "Failed").map((check) => check.requirement), warnings: result.checks.filter((check) => check.status === "Warning").map((check) => check.requirement), auditedAt: new Date().toISOString(), status: result.status === "Passed" ? "PASSED" : result.status === "Failed" ? "FAILED" : "WARNING", findingDetails: result.checks.map((check) => ({ requirement: check.requirement, status: check.status === "Passed" ? "PASSED" : check.status === "Failed" ? "FAILED" : check.status === "Warning" ? "WARNING" : "NOT_CHECKED", explanation: check.explanation })), suggestions: result.suggestions });
}
export function getAuditReport(id: string) { const submission = getSubmissionRecord(id); if (!submission) return undefined; const version = getSubmissionVersions(id).find((item) => item.versionNumber === submission.currentVersion); if (!version) return undefined; const audit = persistAudit(submission, version); return { score: audit.complianceScore, status: canonicalAuditStatus(audit) as Exclude<AuditStatus, "Not Checked">, checks: auditChecks(audit), passed: audit.passedChecks.length, failed: audit.failedChecks.length, warnings: audit.warnings.length, suggestions: audit.suggestions ?? [] }; }

export function updateSubmission(id: string, changes: Partial<Submission>) {
  const current = getSubmissionRecord(id); if (!current) return undefined;
  const status = changes.reviewStatus === "Approved" ? "APPROVED" : changes.reviewStatus === "Rejected" ? "REJECTED" : changes.reviewStatus === "Revision Requested" ? "REVISION_REQUIRED" : undefined;
  if (status) {
    updateSubmissionRecord(id, { status, updatedAt: new Date().toISOString() });
    const decision = status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "REVISION_REQUESTED";
    pendingDecision.set(id, { decision, reviewerId: changes.reviewer ?? "Alex Morgan", feedback: changes.reviewerNote ?? "" });
    const versionId = currentVersionId({ ...current, currentVersion: current.currentVersion });
    if (versionId) {
      const reviewId = `review-${id}-v${current.currentVersion}-${decision.toLowerCase()}-${Date.now()}`;
      const pending = pendingDecision.get(id)!;
      const review = createContentReview({ id: reviewId, submissionId: id, versionId, reviewerId: pending.reviewerId, decision, feedback: pending.feedback, reviewedAt: new Date().toISOString() });
      pendingDecision.set(id, { ...pending, reviewId } as typeof pending);
      const recipientUserId = getDemoUserIdForCreator(current.creatorId);
      if (!recipientUserId) {
        if (process.env.NODE_ENV !== "production") console.warn(`[creator-notifications] Review ${review.id} was saved, but no demo recipient mapping exists for creator ${current.creatorId}.`);
      } else {
        const campaignName = getSharedCampaignById(current.campaignId)?.title ?? "your campaign";
        const title = decision === "APPROVED" ? "Your content was approved" : decision === "REJECTED" ? "Your content was rejected" : "Revision requested for your content";
        const feedback = pending.feedback.trim();
        const message = `${campaignName}: ${decision === "APPROVED" ? "Your submission has been approved." : decision === "REJECTED" ? "Your submission was rejected." : "Please revise your submission."}${feedback ? ` ${feedback}` : ""}`;
        try {
          createNotificationForRecipient(recipientUserId, {
            id: `notification-review-${encodeURIComponent(current.id)}-${encodeURIComponent(versionId)}-${decision.toLowerCase()}`,
            type: "CONTENT_REVIEW",
            title,
            message,
            relatedEntityType: "ContentSubmission",
            relatedEntityId: current.id,
            isRead: false,
            createdAt: review.reviewedAt,
          });
        } catch (error) {
          if (process.env.NODE_ENV !== "production") console.error(`[creator-notifications] Review ${review.id} was saved, but its notification could not be created.`, error);
        }
      }
    }
  }
  return getSubmission(id);
}
export function addHistory(id: string, event: SubmissionEvent) {
  const submission = getSubmissionRecord(id); const versionId = submission && currentVersionId(submission); const decision = pendingDecision.get(id);
  if (!submission || !versionId || !decision) return getSubmission(id);
  const reviewId = (decision as typeof decision & { reviewId?: string }).reviewId ?? `review-${id}-v${submission.currentVersion}-${decision.decision.toLowerCase()}-${Date.now()}`;
  try { createContentReview({ id: reviewId, submissionId: id, versionId, reviewerId: decision.reviewerId || event.actor, decision: decision.decision, feedback: event.details || decision.feedback, reviewedAt: event.timestamp }); } catch (error) { if (!(error instanceof Error) || !error.message.includes("already exists")) throw error; }
  pendingDecision.delete(id);
  return getSubmission(id);
}

export function listCreatorSubmissions(creatorId: string) { const id = toCanonicalCreatorId(creatorId); return getSubmissions().filter((item) => toCanonicalCreatorId(item.creatorId) === id); }
export function campaignIdForLegacySubmission(value: number) { return toCanonicalCampaignId(value); }
export function creatorIdentityForSubmission() { return getDemoCreatorProfile(); }
