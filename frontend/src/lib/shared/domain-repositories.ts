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
const participationSeed: CampaignParticipation[] = [{ id: "participation-aurelia", campaignId: "camp-aurelia-summer", creatorId: "creator-maya", sourceType: "APPLICATION", sourceId: "application-aurelia-maya", status: "ACTIVE", joinedAt: "2027-01-15T00:00:00.000Z" }];
const submissionSeed: ContentSubmission[] = [{ id: "CS-2048", campaignId: "camp-aurelia-summer", participationId: "participation-aurelia", creatorId: "creator-maya", deliverableId: "d1", contentUrl: "https://instagram.com/reel/clyra-summer-2048", caption: "A slower summer starts with linen, light layers and the pieces I keep reaching for.", platform: "INSTAGRAM", hashtags: ["#AureliaSummer", "#ad"], brandMentions: ["@aureliafashion"], submittedAt: "2027-01-18T10:30:00.000Z", status: "UNDER_REVIEW", currentVersion: 1 }];
const versionSeed: SubmissionVersion[] = [{ id: "CS-2048-v1", submissionId: "CS-2048", versionNumber: 1, contentUrl: "https://instagram.com/reel/clyra-summer-2048", caption: "A slower summer starts with linen, light layers and the pieces I keep reaching for.", submittedAt: "2027-01-18T10:30:00.000Z", createdBy: "creator-maya" }];
const reviewSeed: ContentReview[] = [];
const auditSeed: AuditResult[] = [{ id: "audit-CS-2048-v1", submissionId: "CS-2048", versionId: "CS-2048-v1", complianceScore: 100, findings: [], passedChecks: ["Disclosure present"], failedChecks: [], warnings: [], auditedAt: "2027-01-18T10:35:00.000Z" }];
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
const validateSubmission = (record: ContentSubmission) => { requireCreatorAndCampaign(record.campaignId, record.creatorId); if (!participationRepository.getById(record.participationId)) throw new Error(`Participation ${record.participationId} does not exist.`); if (record.currentVersion < 1) throw new Error("Submission version must be at least 1."); };
const validateVersion = (record: SubmissionVersion) => { if (!submissionRepository.getById(record.submissionId)) throw new Error(`Submission ${record.submissionId} does not exist.`); if (record.versionNumber < 1) throw new Error("Submission version number must be at least 1."); if (versionRepository.listBySubmission(record.submissionId).some((item) => item.id !== record.id && item.versionNumber === record.versionNumber)) throw new Error("A submission version with this number already exists."); };
const validateReview = (record: ContentReview) => { const submission = submissionRepository.getById(record.submissionId); if (!submission) throw new Error(`Submission ${record.submissionId} does not exist.`); if (submission.currentVersion < 1 || !versionRepository.getById(record.versionId)) throw new Error(`Submission version ${record.versionId} does not exist.`); };
const validateAudit = (record: AuditResult) => { if (!submissionRepository.getById(record.submissionId)) throw new Error(`Submission ${record.submissionId} does not exist.`); if (!versionRepository.getById(record.versionId)) throw new Error(`Submission version ${record.versionId} does not exist.`); };
const validateNotification = (record: Notification) => { if (!record.recipientUserId) throw new Error("Notification recipient is required."); if (record.relatedEntityType && !record.relatedEntityId) throw new Error("Related notification entities require an ID."); };

export const applicationRepository: CampaignApplicationRepository = Object.assign(listRepository(applicationSeed, validateApplication), { listByCampaign: (id: string) => applicationRepository.list().filter((item) => item.campaignId === id), listByCreator: (id: string) => applicationRepository.list().filter((item) => item.creatorId === id) });
const invitationBase = listRepository(invitationSeed, validateInvitation);
export const invitationRepository: CampaignInvitationRepository = { ...invitationBase, create: (record) => { if (invitationBase.list().some((item) => item.campaignId === record.campaignId && item.creatorId === record.creatorId && ["PENDING", "ACCEPTED"].includes(item.status))) throw new Error("An active invitation already exists for this campaign and creator."); return invitationBase.create(record); }, listByCampaign: (id) => invitationBase.list().filter((item) => item.campaignId === id), listByCreator: (id) => invitationBase.list().filter((item) => item.creatorId === id), hasActive: (campaignId, creatorId) => invitationBase.list().some((item) => item.campaignId === campaignId && item.creatorId === creatorId && ["PENDING", "ACCEPTED"].includes(item.status)) };
export const participationRepository: CampaignParticipationRepository = Object.assign(listRepository(participationSeed, validateParticipation), { listByCampaign: (id: string) => participationRepository.list().filter((item) => item.campaignId === id), listByCreator: (id: string) => participationRepository.list().filter((item) => item.creatorId === id), findByCampaignAndCreator: (campaignId: string, creatorId: string) => participationRepository.list().find((item) => item.campaignId === campaignId && item.creatorId === creatorId) });
export const submissionRepository: ContentSubmissionRepository = Object.assign(listRepository(submissionSeed, validateSubmission), { listByCampaign: (id: string) => submissionRepository.list().filter((item) => item.campaignId === id), listByParticipation: (id: string) => submissionRepository.list().filter((item) => item.participationId === id) });
export const versionRepository: SubmissionVersionRepository = Object.assign(listRepository(versionSeed, validateVersion), { listBySubmission: (id: string) => versionRepository.list().filter((item) => item.submissionId === id) });
export const reviewRepository: ContentReviewRepository = Object.assign(listRepository(reviewSeed, validateReview), { listBySubmission: (id: string) => reviewRepository.list().filter((item) => item.submissionId === id) });
export const auditRepository: AuditResultRepository = Object.assign(listRepository(auditSeed, validateAudit), { listBySubmission: (id: string) => auditRepository.list().filter((item) => item.submissionId === id), listByVersion: (id: string) => auditRepository.list().filter((item) => item.versionId === id) });
export const notificationRepository: NotificationRepository = Object.assign(listRepository(notificationSeed, validateNotification), { listByRecipient: (id: string) => notificationRepository.list().filter((item) => item.recipientUserId === id), markRead: (id: string) => notificationRepository.update(id, { isRead: true }) });

export const sharedDomainRepositories = { applicationRepository, invitationRepository, participationRepository, submissionRepository, versionRepository, reviewRepository, auditRepository, notificationRepository };
