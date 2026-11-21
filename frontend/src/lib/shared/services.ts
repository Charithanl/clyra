import { type CampaignRow } from "@/components/brand/campaigns/campaignStore";
import { getDemoBrandCreators as getLegacyCreators } from "./mock-data";
import { campaignRepository, creatorRepository } from "./repositories";
import type { AuditResult, Campaign, CampaignApplication, CampaignInvitation, CampaignParticipation, ContentReview, ContentSubmission, CreatorProfile, Notification, SocialAccount, SubmissionVersion } from "@/types/shared";
import type { CreatorCampaignView } from "@/lib/creator/types";
import { DEMO_CREATOR_IDENTITY } from "./identity";
import { auditRepository, applicationRepository, invitationRepository, notificationRepository, participationRepository, reviewRepository, submissionRepository, versionRepository } from "./domain-repositories";
import { canonicalIdForNewCampaign, toCanonicalCampaignId, toLegacyCampaignId } from "./campaign-id-mapping";

type LegacyCampaign = CampaignRow;
export function getPublishedCampaigns() { return campaignRepository.getPublished(); }
export function getPublishedCampaignOpportunities(): CreatorCampaignView[] { return getPublishedCampaigns().map((campaign) => ({ id: campaign.id, title: campaign.title, description: campaign.description, brandId: campaign.clientBrandId ?? campaign.organizationId, brandName: campaign.clientBrandId ?? campaign.organizationName, brandLogo: (campaign.clientBrandId ?? campaign.organizationName).slice(0, 1), coverImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=82", category: (campaign.categories[0] ?? "Lifestyle") as CreatorCampaignView["category"], platforms: campaign.platforms.map((item) => item === "INSTAGRAM" ? "Instagram" : "YouTube"), compensationType: campaign.compensationType === "Paid" ? "Paid" : "Product exchange", compensationMin: campaign.budget.min ?? 0, compensationMax: campaign.budget.max ?? campaign.budget.min ?? 0, deliverables: campaign.deliverables.map((item) => ({ id: item.id, title: item.title, platform: item.platform === "INSTAGRAM" ? "Instagram" : "YouTube", contentType: item.contentType, quantity: 1, description: item.description, deadline: item.dueDate, mandatory: item.status !== "OPTIONAL" })), applicationDeadline: campaign.applicationDeadline, contentDeadline: campaign.endDate, startDate: campaign.startDate, endDate: campaign.endDate, status: "Open", campaignType: "Sponsored post", eligibility: { minFollowers: 0, tier: "Nano", location: "Remote", audience: campaign.targetAudience, platform: campaign.platforms[0] === "YOUTUBE" ? "YouTube" : "Instagram" }, brief: { objective: campaign.objectives[0] ?? campaign.description, hashtags: campaign.hashtags, mentions: campaign.brandMentions, keywords: campaign.keywords, guidelines: campaign.requirements.join(" ") || "Follow the campaign brief shared by the brand.", disclosure: campaign.disclosureRequirements.join(" ") || "Use the applicable paid partnership disclosure.", dos: ["Keep the content authentic"], donts: ["Do not make unverified claims"] }, brandIntroduction: `${campaign.organizationName} creator campaign.`, targetAudience: campaign.targetAudience })) }
export function getCreatorCampaignById(id: string) { const campaign = campaignRepository.getById(id); return campaign ? getPublishedCampaignOpportunities().find((item) => item.id === id) : undefined; }
export function getSharedCampaignById(id: string) { return campaignRepository.getById(toCanonicalCampaignId(id) ?? id); }
export function createCampaign(campaign: Campaign) { return campaignRepository.create(campaign); }
export function updateCampaign(id: string, changes: Partial<Campaign>) { return campaignRepository.update(toCanonicalCampaignId(id) ?? id, changes); }
export function publishCampaign(id: string) { return campaignRepository.publish(toCanonicalCampaignId(id) ?? id); }
export function pauseCampaign(id: string) { return campaignRepository.pause(toCanonicalCampaignId(id) ?? id); }
export function resumeCampaign(id: string) { return campaignRepository.resume(toCanonicalCampaignId(id) ?? id); }
export function completeCampaign(id: string) { return campaignRepository.complete(toCanonicalCampaignId(id) ?? id); }
export function cancelCampaign(id: string) { return campaignRepository.cancel(toCanonicalCampaignId(id) ?? id); }
export function archiveCampaign(id: string) { return campaignRepository.archive(toCanonicalCampaignId(id) ?? id); }
export const getApplications = () => applicationRepository.list();
export const getInvitations = () => invitationRepository.list();
export const getParticipations = () => { reconcileAcceptedParticipations(); return participationRepository.list(); };
export const getParticipationRecordsForCreator = (creatorId: string) => { reconcileAcceptedParticipations(); return participationRepository.listByCreator(creatorId); };
export const getParticipationRecord = (campaignId: string, creatorId: string) => participationRepository.findByCampaignAndCreator(campaignId, creatorId);
export const createParticipationRecord = (record: CampaignParticipation) => participationRepository.create(record);
export function createParticipationForAcceptedApplication(application: CampaignApplication) {
  if (application.status !== "ACCEPTED") throw new Error("Only accepted applications can create participation.");
  const existing = participationRepository.findByCampaignAndCreator(application.campaignId, application.creatorId);
  if (existing) return existing;
  return participationRepository.create({ id: `participation-${application.id}`, campaignId: application.campaignId, creatorId: application.creatorId, sourceType: "APPLICATION", sourceId: application.id, status: "UPCOMING", joinedAt: application.reviewedAt ?? application.submittedAt ?? new Date().toISOString() });
}
export function createParticipationForAcceptedInvitation(invitation: CampaignInvitation) {
  if (invitation.status !== "ACCEPTED") throw new Error("Only accepted invitations can create participation.");
  const existing = participationRepository.findByCampaignAndCreator(invitation.campaignId, invitation.creatorId);
  if (existing) return existing;
  const record: CampaignParticipation = { id: `participation-${invitation.id}`, campaignId: invitation.campaignId, creatorId: invitation.creatorId, sourceType: "INVITATION", sourceId: invitation.id, status: "UPCOMING", joinedAt: invitation.respondedAt ?? new Date().toISOString() };
  return participationRepository.create(record);
}
export function reconcileAcceptedInvitationParticipations() { invitationRepository.list().filter((invitation) => invitation.status === "ACCEPTED").forEach((invitation) => createParticipationForAcceptedInvitation(invitation)); }
export function reconcileAcceptedParticipations() {
  applicationRepository.list().filter((application) => application.status === "ACCEPTED").forEach(createParticipationForAcceptedApplication);
  reconcileAcceptedInvitationParticipations();
}
export const getSubmissions = () => submissionRepository.list();
export const getSubmissionRecord = (id: string) => submissionRepository.getById(id);
export const getSubmissionRecordsForCreator = (creatorId: string) => submissionRepository.list().filter((item) => item.creatorId === creatorId);
export const getSubmissionVersions = (submissionId: string) => versionRepository.listBySubmission(submissionId);
export const getSubmissionVersion = (id: string) => versionRepository.getById(id);
export const createSubmissionRecord = (record: ContentSubmission) => submissionRepository.create(record);
export const updateSubmissionRecord = (id: string, changes: Partial<ContentSubmission>) => submissionRepository.update(id, changes);
export const createSubmissionVersion = (record: SubmissionVersion) => versionRepository.create(record);
export const getContentReviews = () => reviewRepository.list();
export const getContentReviewsForSubmission = (submissionId: string) => reviewRepository.listBySubmission(submissionId);
export const createContentReview = (record: ContentReview) => reviewRepository.create(record);
export const getAuditResults = () => auditRepository.list();
export const getAuditResultsForSubmission = (submissionId: string) => auditRepository.listBySubmission(submissionId);
export const getAuditResultsForVersion = (versionId: string) => auditRepository.listByVersion(versionId);
export const createAuditResult = (record: AuditResult) => auditRepository.create(record);
export const getNotifications = (recipientUserId?: string) => recipientUserId ? notificationRepository.listByRecipient(recipientUserId) : notificationRepository.list();
function requireNotificationRecipient(recipientUserId: string) {
  if (!recipientUserId.trim()) throw new Error("Notification recipient is required.");
}
export function getNotificationsForRecipient(recipientUserId: string) {
  requireNotificationRecipient(recipientUserId);
  return notificationRepository.listByRecipient(recipientUserId);
}
export function getUnreadNotificationCount(recipientUserId: string) {
  return getNotificationsForRecipient(recipientUserId).filter((notification) => !notification.isRead).length;
}
export function createNotificationForRecipient(recipientUserId: string, notification: Omit<Notification, "recipientUserId">) {
  requireNotificationRecipient(recipientUserId);
  const existing = notificationRepository.getById(notification.id);
  if (existing) {
    if (existing.recipientUserId !== recipientUserId) throw new Error(`Notification ID ${notification.id} belongs to another recipient.`);
    return existing;
  }
  return notificationRepository.create({ ...notification, recipientUserId });
}
export function markNotificationReadForRecipient(recipientUserId: string, notificationId: string) {
  requireNotificationRecipient(recipientUserId);
  return notificationRepository.markRead(recipientUserId, notificationId);
}
export function markAllNotificationsReadForRecipient(recipientUserId: string) {
  requireNotificationRecipient(recipientUserId);
  return notificationRepository.markAllRead(recipientUserId);
}
export const getInvitationRecords = () => invitationRepository.list();
export const getInvitationRecordsForCreator = (creatorId: string) => invitationRepository.listByCreator(creatorId);
export const createInvitationRecord = (record: CampaignInvitation) => invitationRepository.create(record);
export const updateInvitationRecord = (id: string, changes: Partial<CampaignInvitation>) => invitationRepository.update(id, changes);
export const hasActiveInvitationRecord = (campaignId: string, creatorId: string) => invitationRepository.hasActive(campaignId, creatorId);
export function getBrandCampaignRows() { reconcileAcceptedParticipations(); return campaignRepository.getAll().filter((campaign) => campaign.organizationId === "org-studio-north").map(campaignRowProjection); }
export function getCreatorProfile(id = DEMO_CREATOR_IDENTITY.creatorId) { return creatorRepository.getById(id); }
export function getCreatorProfiles() { return creatorRepository.list(); }
export function updateCreatorProfile(profile: CreatorProfile) { return creatorRepository.update(profile); }
export function getCreatorSocialAccounts(creatorId = DEMO_CREATOR_IDENTITY.creatorId) { return creatorRepository.getSocialAccounts(creatorId); }
export function addCreatorSocialAccount(account: SocialAccount, creatorId = DEMO_CREATOR_IDENTITY.creatorId) { return creatorRepository.addSocialAccount(creatorId, account); }
export function updateCreatorSocialAccount(accountId: string, changes: Partial<Omit<SocialAccount, "id" | "creatorId">>, creatorId = DEMO_CREATOR_IDENTITY.creatorId) { return creatorRepository.updateSocialAccount(creatorId, accountId, changes); }
export function removeCreatorSocialAccount(accountId: string, creatorId = DEMO_CREATOR_IDENTITY.creatorId) { return creatorRepository.removeSocialAccount(creatorId, accountId); }
export function getBrandDirectoryCreators() {
  const profile = creatorRepository.getById(DEMO_CREATOR_IDENTITY.creatorId);
  const rows = getLegacyCreators().map((creator) => creator.id === DEMO_CREATOR_IDENTITY.directoryId && profile ? { ...creator, name: profile.displayName, bio: profile.bio, location: profile.location, niche: profile.categories[0] ?? creator.niche, followers: profile.socialAccounts[0]?.followerCount ?? creator.followers, engagement: profile.socialAccounts[0]?.engagementRate ?? creator.engagement, platforms: profile.socialAccounts.map((account) => account.platform === "INSTAGRAM" ? "Instagram" : "YouTube") } : creator);
  const unique = new Map(rows.map((creator) => [creator.id === DEMO_CREATOR_IDENTITY.directoryId ? DEMO_CREATOR_IDENTITY.creatorId : creator.id, creator]));
  return [...unique.values()];
}
export function getBrandDirectoryCreatorCount() { return getBrandDirectoryCreators().length; }
function rowToSharedCampaign(row: CampaignRow): Campaign { const id = toCanonicalCampaignId(row.id) ?? canonicalIdForNewCampaign(row.id); const existing = campaignRepository.getById(id); const now = new Date().toISOString(); return { id, organizationId: "org-studio-north", clientBrandId: row.brand, organizationName: "Studio North", title: row.name, description: row.description, objectives: existing?.objectives ?? [row.description], industry: existing?.industry ?? "Creator marketing", categories: existing?.categories ?? ["Lifestyle"], platforms: row.platforms.map((item) => item === "Instagram" ? "INSTAGRAM" : "YOUTUBE"), targetAudience: existing?.targetAudience ?? "Campaign-defined audience", budget: { min: Number(row.budget.replace(/\D/g, "")) || undefined, currency: existing?.budget.currency ?? "INR" }, compensationType: existing?.compensationType ?? "Paid", startDate: existing?.startDate ?? now, endDate: existing?.endDate ?? now, applicationDeadline: existing?.applicationDeadline ?? now, status: row.status === "Active" ? "PUBLISHED" : row.status === "Draft" ? "DRAFT" : row.status === "Paused" ? "PAUSED" : row.status === "Completed" ? "COMPLETED" : row.status === "Cancelled" ? "CANCELLED" : "ARCHIVED", requirements: existing?.requirements ?? [], hashtags: existing?.hashtags ?? [], brandMentions: existing?.brandMentions ?? [], keywords: existing?.keywords ?? [], disclosureRequirements: existing?.disclosureRequirements ?? [], deliverables: existing?.deliverables ?? [], createdAt: existing?.createdAt ?? now, updatedAt: now, publishedAt: row.status === "Active" ? existing?.publishedAt ?? now : existing?.publishedAt }; }
export function saveBrandCampaign(campaign: CampaignRow) { return campaignRepository.create(rowToSharedCampaign(campaign)); }
export function updateBrandCampaign(id: number, changes: Partial<CampaignRow>) { const canonicalId = toCanonicalCampaignId(id); if (!canonicalId) return undefined; const current = campaignRepository.getById(canonicalId); if (!current) return undefined; return campaignRepository.update(canonicalId, rowToSharedCampaign({ ...toLegacyCampaign(current), ...changes, id })); }
export function getBrandCampaigns() { return getBrandCampaignRows(); }
function campaignRowProjection(campaign: Campaign): LegacyCampaign {
  const participations = participationRepository.listByCampaign(campaign.id);
  const creators = new Set(participations.map((participation) => participation.creatorId));
  const accepted = new Set(participations.filter((participation) => participation.status !== "CANCELLED").map((participation) => participation.creatorId));
  return { id: toLegacyCampaignId(campaign.id) ?? Date.now(), name: campaign.title, description: campaign.description, brand: campaign.clientBrandId ?? campaign.organizationName, platforms: campaign.platforms.map((item) => item === "INSTAGRAM" ? "Instagram" : "YouTube"), creators: creators.size, accepted: accepted.size, budget: campaign.budget.min ? `₹${campaign.budget.min}` : "Budget TBD", start: campaign.startDate.slice(0, 10), end: campaign.endDate.slice(0, 10), status: campaign.status === "PUBLISHED" ? "Active" : campaign.status === "DRAFT" ? "Draft" : campaign.status === "PAUSED" ? "Paused" : campaign.status === "COMPLETED" ? "Completed" : campaign.status === "CANCELLED" ? "Cancelled" : "Archived" };
}
export function toLegacyCampaign(campaign: Campaign): LegacyCampaign { reconcileAcceptedParticipations(); return campaignRowProjection(campaign); }
