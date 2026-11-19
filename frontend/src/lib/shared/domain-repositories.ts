import type {
  AuditResult,
  CampaignApplication,
  CampaignInvitation,
  CampaignParticipation,
  ContentReview,
  ContentSubmission,
  Notification,
  SubmissionVersion,
} from "@/types/shared";
import { campaignRepository, creatorRepository } from "./repositories";

type Identified = { id: string };
type MutableRepository<T extends Identified> = {
  getById(id: string): T | undefined;
  list(): T[];
  create(record: T): T;
  update(id: string, changes: Partial<T>): T | undefined;
};

const clone = <T>(value: T): T => structuredClone(value);
const now = () => new Date().toISOString();
const hasCreator = (id: string) => Boolean(creatorRepository.getById(id) ?? creatorRepository.list().find((creator) => creator.id === id));
const hasCampaign = (id: string) => Boolean(campaignRepository.getById(id));
const requireCreatorAndCampaign = (campaignId: string, creatorId: string) => {
  if (!hasCampaign(campaignId)) throw new Error(`Campaign ${campaignId} does not exist.`);
  if (!hasCreator(creatorId)) throw new Error(`Creator ${creatorId} does not exist.`);
};
const listRepository = <T extends Identified>(seed: T[], validate: (record: T) => void): MutableRepository<T> => {
  let records = seed.map(clone);
  return {
    getById: (id) => { const record = records.find((item) => item.id === id); return record ? clone(record) : undefined; },
    list: () => records.map(clone),
    create: (record) => { validate(record); if (records.some((item) => item.id === record.id)) throw new Error(`Record ${record.id} already exists.`); records = [...records, clone(record)]; return clone(record); },
    update: (id, changes) => { const current = records.find((item) => item.id === id); if (!current) return undefined; const next = { ...current, ...changes, id }; validate(next); records = records.map((item) => item.id === id ? clone(next) : item); return clone(next); },
  };
};

const applicationSeed: CampaignApplication[] = [{ id: "application-aurelia-maya", campaignId: "camp-aurelia-summer", creatorId: "creator-maya", introduction: "I create warm, editorial stories around considered everyday style.", interestReason: "The campaign fits my audience and visual point of view.", experience: "Previous fashion and lifestyle collaborations.", portfolioLinks: ["https://example.com/maya-summer"], proposedIdea: "A linen-led summer story built around natural light and repeatable styling.", status: "ACCEPTED", submittedAt: "2027-01-10T00:00:00.000Z", reviewedAt: "2027-01-12T00:00:00.000Z", reviewedBy: "user-studio-north" }];
const invitationSeed: CampaignInvitation[] = [{ id: "inv-1", campaignId: "camp-aurelia-summer", creatorId: "creator-maya", invitedBy: "studio-north", message: "We love your considered approach to styling and think you would be a wonderful fit for this story.", status: "PENDING", sentAt: "2026-06-10T00:00:00.000Z", expiresAt: "2026-06-17T00:00:00.000Z" }, { id: "inv-2", campaignId: "camp-glow-beauty", creatorId: "ella-chen", invitedBy: "studio-north", message: "We would love to invite you to help us tell the Everyday Beauty Edit story.", status: "ACCEPTED", sentAt: "2026-06-08T00:00:00.000Z", respondedAt: "2026-06-09T00:00:00.000Z", expiresAt: "2026-06-15T00:00:00.000Z" }, { id: "inv-3", campaignId: "camp-hearth-ritual", creatorId: "noah-williams", invitedBy: "studio-north", message: "Your approach to movement feels aligned with this campaign.", status: "PENDING", sentAt: "2026-06-09T00:00:00.000Z", expiresAt: "2026-06-16T00:00:00.000Z" }, { id: "inv-4", campaignId: "camp-earth-living", creatorId: "jules-martin", invitedBy: "studio-north", message: "We would be delighted to have you join this sustainable living story.", status: "DECLINED", sentAt: "2026-04-20T00:00:00.000Z", respondedAt: "2026-04-22T00:00:00.000Z", expiresAt: "2026-04-27T00:00:00.000Z" }, { id: "inv-5", campaignId: "camp-nexora-tech", creatorId: "arjun-mehta", invitedBy: "studio-north", message: "Would you be interested in making technology feel more approachable with us?", status: "EXPIRED", sentAt: "2026-05-12T00:00:00.000Z", expiresAt: "2026-05-19T00:00:00.000Z" }, { id: "inv-6", campaignId: "camp-morrow-table", creatorId: "sienna-lee", invitedBy: "studio-north", message: "Your visual language would be beautiful for this weekend table story.", status: "CANCELLED", sentAt: "2026-05-02T00:00:00.000Z", expiresAt: "2026-05-09T00:00:00.000Z" }];
const participationSeed: CampaignParticipation[] = [
  { id: "participation-aurelia", campaignId: "camp-aurelia-summer", creatorId: "creator-maya", sourceType: "APPLICATION", sourceId: "application-aurelia-maya", status: "ACTIVE", joinedAt: "2027-01-15T00:00:00.000Z" },
  { id: "participation-glow-ella", campaignId: "camp-glow-beauty", creatorId: "ella-chen", sourceType: "INVITATION", sourceId: "inv-2", status: "ACTIVE", joinedAt: "2026-06-09T00:00:00.000Z" },
  { id: "participation-hearth-noah", campaignId: "camp-hearth-ritual", creatorId: "noah-williams", sourceType: "APPLICATION", sourceId: "legacy-submission-SUB-1046", status: "ACTIVE", joinedAt: "2026-06-08T00:00:00.000Z" },
  { id: "participation-earth-jules", campaignId: "camp-earth-living", creatorId: "jules-martin", sourceType: "APPLICATION", sourceId: "legacy-submission-SUB-1045", status: "COMPLETED", joinedAt: "2026-06-08T00:00:00.000Z" },
  { id: "participation-nexora-arjun", campaignId: "camp-nexora-tech", creatorId: "arjun-mehta", sourceType: "APPLICATION", sourceId: "legacy-submission-SUB-1044", status: "ACTIVE", joinedAt: "2026-06-05T00:00:00.000Z" },
];
const submissionSeed: ContentSubmission[] = [
  { id: "CS-2048", campaignId: "camp-aurelia-summer", participationId: "participation-aurelia", creatorId: "creator-maya", deliverableId: "d1", contentUrl: "https://instagram.com/reel/clyra-summer-2048", caption: "A slower summer starts with linen, light layers and the pieces I keep reaching for. #AureliaSummer #MadeForEveryday @aureliafashion #ad", platform: "INSTAGRAM", hashtags: ["#AureliaSummer", "#MadeForEveryday", "#ad"], brandMentions: ["@aureliafashion"], contentType: "Reel", postDescription: "A warm editorial Reel featuring two Aurelia summer pieces.", supportingNotes: "Natural light and relaxed styling used as requested.", submittedAt: "2027-01-18T10:30:00.000Z", status: "UNDER_REVIEW", currentVersion: 1, createdAt: "2027-01-18T10:30:00.000Z", updatedAt: "2027-01-18T10:35:00.000Z" },
  { id: "SUB-1047", campaignId: "camp-glow-beauty", participationId: "participation-glow-ella", creatorId: "ella-chen", deliverableId: "del-2", contentUrl: "https://youtube.com/watch?v=clyra-1047", caption: "My everyday hydration routine for busy mornings. #EverydayBeauty @glowcosmetics #ad", platform: "YOUTUBE", hashtags: ["#EverydayBeauty", "#ad"], brandMentions: ["@glowcosmetics"], submittedAt: "2026-06-12", status: "SUBMITTED", currentVersion: 1 },
  { id: "SUB-1046", campaignId: "camp-hearth-ritual", participationId: "participation-hearth-noah", creatorId: "noah-williams", deliverableId: "del-3", contentUrl: "https://instagram.com/p/clyra-1046", caption: "A small ritual for slower evenings. #SofterRitual @hearthhome", platform: "INSTAGRAM", hashtags: ["#SofterRitual"], brandMentions: ["@hearthhome"], submittedAt: "2026-06-10", status: "REVISION_REQUIRED", currentVersion: 2 },
  { id: "SUB-1045", campaignId: "camp-earth-living", participationId: "participation-earth-jules", creatorId: "jules-martin", deliverableId: "del-4", contentUrl: "https://instagram.com/p/clyra-1045", caption: "A more considered home starts with a refill. #EarthAndCo @earthandco #ad #sustainable", platform: "INSTAGRAM", hashtags: ["#EarthAndCo", "#ad"], brandMentions: ["@earthandco"], submittedAt: "2026-06-08", status: "APPROVED", currentVersion: 1 },
  { id: "SUB-1044", campaignId: "camp-nexora-tech", participationId: "participation-nexora-arjun", creatorId: "arjun-mehta", deliverableId: "del-5", contentUrl: "https://youtube.com/watch?v=clyra-1044", caption: "A smart setup for a simpler desk.", platform: "YOUTUBE", hashtags: [], brandMentions: [], submittedAt: "2026-06-05", status: "REJECTED", currentVersion: 1 },
];
const versionSeed: SubmissionVersion[] = submissionSeed.map((submission) => ({ id: `${submission.id}-v${submission.currentVersion}`, submissionId: submission.id, versionNumber: submission.currentVersion, contentUrl: submission.contentUrl, caption: submission.caption, submittedAt: submission.submittedAt ?? now(), createdBy: submission.creatorId, contentType: submission.contentType, postDescription: submission.postDescription, hashtags: submission.hashtags, brandMentions: submission.brandMentions, supportingNotes: submission.supportingNotes, status: submission.status }));
const reviewSeed: ContentReview[] = [
  { id: "review-SUB-1046-v2", submissionId: "SUB-1046", versionId: "SUB-1046-v2", reviewerId: "Alex Morgan", decision: "REVISION_REQUESTED", feedback: "Please add the required disclosure.", reviewedAt: "2026-06-09" },
  { id: "review-SUB-1045-v1", submissionId: "SUB-1045", versionId: "SUB-1045-v1", reviewerId: "Alex Morgan", decision: "APPROVED", feedback: "Approved for publishing.", reviewedAt: "2026-06-09" },
  { id: "review-SUB-1044-v1", submissionId: "SUB-1044", versionId: "SUB-1044-v1", reviewerId: "Alex Morgan", decision: "REJECTED", feedback: "The submission did not meet mandatory campaign requirements.", reviewedAt: "2026-06-06" },
];
const auditSeed: AuditResult[] = [];
const notificationSeed: Notification[] = [{ id: "notification-demo-review", recipientUserId: "user-maya", type: "CONTENT_REVIEW", title: "Content is under review", message: "Your Aurelia Fashion submission is waiting for brand review.", relatedEntityType: "ContentSubmission", relatedEntityId: "CS-2048", isRead: false, createdAt: "2027-01-18T10:35:00.000Z" }];

export interface CampaignApplicationRepository extends MutableRepository<CampaignApplication> { listByCampaign(campaignId: string): CampaignApplication[]; listByCreator(creatorId: string): CampaignApplication[]; }
export interface CampaignInvitationRepository extends MutableRepository<CampaignInvitation> { listByCampaign(campaignId: string): CampaignInvitation[]; listByCreator(creatorId: string): CampaignInvitation[]; hasActive(campaignId: string, creatorId: string): boolean; }
export interface CampaignParticipationRepository extends MutableRepository<CampaignParticipation> { listByCampaign(campaignId: string): CampaignParticipation[]; listByCreator(creatorId: string): CampaignParticipation[]; findByCampaignAndCreator(campaignId: string, creatorId: string): CampaignParticipation | undefined; }
export interface ContentSubmissionRepository extends MutableRepository<ContentSubmission> { listByCampaign(campaignId: string): ContentSubmission[]; listByParticipation(participationId: string): ContentSubmission[]; }
export interface SubmissionVersionRepository extends MutableRepository<SubmissionVersion> { listBySubmission(submissionId: string): SubmissionVersion[]; }
export interface ContentReviewRepository extends MutableRepository<ContentReview> { listBySubmission(submissionId: string): ContentReview[]; }
export interface AuditResultRepository extends MutableRepository<AuditResult> { listBySubmission(submissionId: string): AuditResult[]; listByVersion(versionId: string): AuditResult[]; }
export interface NotificationRepository extends MutableRepository<Notification> { listByRecipient(recipientUserId: string): Notification[]; markRead(id: string): Notification | undefined; }

const validateApplication = (record: CampaignApplication) => requireCreatorAndCampaign(record.campaignId, record.creatorId);
const validateInvitation = (record: CampaignInvitation) => requireCreatorAndCampaign(record.campaignId, record.creatorId);
const validateParticipation = (record: CampaignParticipation) => requireCreatorAndCampaign(record.campaignId, record.creatorId);
const validateSubmission = (record: ContentSubmission) => { requireCreatorAndCampaign(record.campaignId, record.creatorId); const participation = participationRepository.getById(record.participationId); if (!participation || participation.campaignId !== record.campaignId || participation.creatorId !== record.creatorId) throw new Error(`Participation ${record.participationId} does not match this submission.`); if (record.currentVersion < 1) throw new Error("Submission version must be at least 1."); };
const validateVersion = (record: SubmissionVersion) => { const submission = submissionRepository.getById(record.submissionId); if (!submission) throw new Error(`Submission ${record.submissionId} does not exist.`); if (record.versionNumber < 1) throw new Error("Submission version number must be at least 1."); if (record.versionNumber > submission.currentVersion) throw new Error("A version cannot exceed the submission's current version number."); if (versionRepository.listBySubmission(record.submissionId).some((item) => item.id !== record.id && item.versionNumber === record.versionNumber)) throw new Error("A submission version with this number already exists."); };
const validateReview = (record: ContentReview) => { const submission = submissionRepository.getById(record.submissionId); const version = versionRepository.getById(record.versionId); if (!submission) throw new Error(`Submission ${record.submissionId} does not exist.`); if (!version || version.submissionId !== record.submissionId) throw new Error(`Submission version ${record.versionId} does not belong to this submission.`); };
const validateAudit = (record: AuditResult) => { const submission = submissionRepository.getById(record.submissionId); const version = versionRepository.getById(record.versionId); if (!submission) throw new Error(`Submission ${record.submissionId} does not exist.`); if (!version || version.submissionId !== record.submissionId) throw new Error(`Submission version ${record.versionId} does not belong to this submission.`); };
const validateNotification = (record: Notification) => { if (!record.recipientUserId) throw new Error("Notification recipient is required."); if (record.relatedEntityType && !record.relatedEntityId) throw new Error("Related notification entities require an ID."); };

export const applicationRepository: CampaignApplicationRepository = Object.assign(listRepository(applicationSeed, validateApplication), { listByCampaign: (id: string) => applicationRepository.list().filter((item) => item.campaignId === id), listByCreator: (id: string) => applicationRepository.list().filter((item) => item.creatorId === id) });
const invitationBase = listRepository(invitationSeed, validateInvitation);
export const invitationRepository: CampaignInvitationRepository = { ...invitationBase, create: (record) => { if (invitationBase.list().some((item) => item.campaignId === record.campaignId && item.creatorId === record.creatorId && ["PENDING", "ACCEPTED"].includes(item.status))) throw new Error("An active invitation already exists for this campaign and creator."); return invitationBase.create(record); }, listByCampaign: (id) => invitationBase.list().filter((item) => item.campaignId === id), listByCreator: (id) => invitationBase.list().filter((item) => item.creatorId === id), hasActive: (campaignId, creatorId) => invitationBase.list().some((item) => item.campaignId === campaignId && item.creatorId === creatorId && ["PENDING", "ACCEPTED"].includes(item.status)) };
export const participationRepository: CampaignParticipationRepository = Object.assign(listRepository(participationSeed, validateParticipation), { listByCampaign: (id: string) => participationRepository.list().filter((item) => item.campaignId === id), listByCreator: (id: string) => participationRepository.list().filter((item) => item.creatorId === id), findByCampaignAndCreator: (campaignId: string, creatorId: string) => participationRepository.list().find((item) => item.campaignId === campaignId && item.creatorId === creatorId) });
const submissionBase = listRepository(submissionSeed, validateSubmission);
export const submissionRepository: ContentSubmissionRepository = { ...submissionBase, update: (id, changes) => { const current = submissionBase.getById(id); if (current?.status === "APPROVED") throw new Error("Approved submissions are immutable."); if (current && changes.currentVersion !== undefined && (changes.currentVersion < current.currentVersion || changes.currentVersion > current.currentVersion + 1)) throw new Error("Submission versions must advance one at a time."); return submissionBase.update(id, changes); }, listByCampaign: (id) => submissionBase.list().filter((item) => item.campaignId === id), listByParticipation: (id) => submissionBase.list().filter((item) => item.participationId === id) };
const versionBase = listRepository(versionSeed, validateVersion);
export const versionRepository: SubmissionVersionRepository = { ...versionBase, update: () => { throw new Error("Submission versions are immutable."); }, listBySubmission: (id) => versionBase.list().filter((item) => item.submissionId === id) };
const reviewBase = listRepository(reviewSeed, validateReview);
export const reviewRepository: ContentReviewRepository = { ...reviewBase, update: () => { throw new Error("Human review decisions are immutable; create a new review record."); }, listBySubmission: (id) => reviewBase.list().filter((item) => item.submissionId === id) };
const auditBase = listRepository(auditSeed, validateAudit);
export const auditRepository: AuditResultRepository = { ...auditBase, update: () => { throw new Error("Audit results are immutable; create a new result for a new version."); }, listBySubmission: (id) => auditBase.list().filter((item) => item.submissionId === id), listByVersion: (id) => auditBase.list().filter((item) => item.versionId === id) };
export const notificationRepository: NotificationRepository = Object.assign(listRepository(notificationSeed, validateNotification), { listByRecipient: (id: string) => notificationRepository.list().filter((item) => item.recipientUserId === id), markRead: (id: string) => notificationRepository.update(id, { isRead: true }) });

export const sharedDomainRepositories = { applicationRepository, invitationRepository, participationRepository, submissionRepository, versionRepository, reviewRepository, auditRepository, notificationRepository };
