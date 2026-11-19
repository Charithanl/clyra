import { createInvitationRecord, createNotificationForRecipient, getInvitationRecords, getSharedCampaignById, hasActiveInvitationRecord, updateInvitationRecord } from "@/lib/shared/services";
import { toCanonicalCampaignId, toLegacyCampaignId } from "@/lib/shared/campaign-id-mapping";
import { DEMO_CREATOR_IDENTITY, getDemoUserIdForCreator } from "@/lib/shared/identity";
import type { CampaignInvitation } from "@/types/shared";

export type InvitationStatus = "Pending" | "Accepted" | "Declined" | "Expired" | "Cancelled";
export type Invitation = { id: string; creatorId: string; campaignId: number; organizationId: string; message: string; status: InvitationStatus; sentAt: string; responseDeadline: string; respondedAt?: string; createdAt: string; updatedAt: string };
const statusToCanonical = (status: InvitationStatus): CampaignInvitation["status"] => status.toUpperCase() as CampaignInvitation["status"];
const statusToDisplay = (status: CampaignInvitation["status"]): InvitationStatus => status === "PENDING" ? "Pending" : status === "ACCEPTED" ? "Accepted" : status === "DECLINED" ? "Declined" : status === "EXPIRED" ? "Expired" : "Cancelled";
const creatorToDisplay = (creatorId: string) => creatorId === DEMO_CREATOR_IDENTITY.creatorId ? DEMO_CREATOR_IDENTITY.directoryId : creatorId;
const creatorToCanonical = (creatorId: string) => creatorId === DEMO_CREATOR_IDENTITY.directoryId ? DEMO_CREATOR_IDENTITY.creatorId : creatorId;
const toDisplay = (record: CampaignInvitation): Invitation | undefined => { const campaignId = toLegacyCampaignId(record.campaignId); if (campaignId === undefined) return undefined; const sentAt = new Date(record.sentAt).toISOString(); return { id: record.id, creatorId: creatorToDisplay(record.creatorId), campaignId, organizationId: record.invitedBy, message: record.message, status: statusToDisplay(record.status), sentAt, responseDeadline: record.expiresAt, respondedAt: record.respondedAt, createdAt: sentAt, updatedAt: record.respondedAt ?? sentAt }; };
const toCanonical = (invitation: Invitation): CampaignInvitation | undefined => { const campaignId = toCanonicalCampaignId(invitation.campaignId); if (!campaignId) return undefined; return { id: invitation.id, campaignId, creatorId: creatorToCanonical(invitation.creatorId), invitedBy: invitation.organizationId, message: invitation.message, status: statusToCanonical(invitation.status), sentAt: new Date(invitation.sentAt).toISOString(), respondedAt: invitation.respondedAt ? new Date(invitation.respondedAt).toISOString() : undefined, expiresAt: new Date(invitation.responseDeadline).toISOString() }; };

/** Compatibility adapter. Canonical invitation records live in invitationRepository. */
export function getInvitations(): Invitation[] { return getInvitationRecords().map(toDisplay).filter((item): item is Invitation => Boolean(item)); }
export function updateInvitation(id: string, changes: Partial<Invitation>) { const current = getInvitationRecords().find((item) => item.id === id); if (!current) return undefined; const nextStatus = changes.status ? statusToCanonical(changes.status) : current.status; return updateInvitationRecord(id, { status: nextStatus, respondedAt: changes.respondedAt ? new Date(changes.respondedAt).toISOString() : current.respondedAt, message: changes.message ?? current.message }); }
export function hasActiveInvitation(creatorId: string, campaignId: number) { const canonicalCampaignId = toCanonicalCampaignId(campaignId); return canonicalCampaignId ? hasActiveInvitationRecord(canonicalCampaignId, creatorToCanonical(creatorId)) : false; }
export function addInvitation(invitation: Invitation) {
  const record = toCanonical(invitation);
  if (!record || hasActiveInvitationRecord(record.campaignId, record.creatorId)) return false;
  const created = createInvitationRecord(record);
  const recipientUserId = getDemoUserIdForCreator(created.creatorId);
  if (!recipientUserId) {
    if (process.env.NODE_ENV !== "production") console.warn(`[creator-notifications] Invitation ${created.id} was saved, but no demo recipient mapping exists for creator ${created.creatorId}.`);
    return true;
  }
  const campaignName = getSharedCampaignById(created.campaignId)?.title ?? "your campaign";
  try {
    createNotificationForRecipient(recipientUserId, {
      id: `notification-invitation-${encodeURIComponent(created.id)}`,
      type: "CAMPAIGN_INVITATION",
      title: "New campaign invitation",
      message: `You have been invited to ${campaignName}.`,
      relatedEntityType: "CampaignInvitation",
      relatedEntityId: created.id,
      isRead: false,
      createdAt: created.sentAt,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(`[creator-notifications] Invitation ${created.id} was saved, but its notification could not be created.`, error);
  }
  return true;
}
