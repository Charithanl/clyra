import { getDemoBrandCreators, getDemoCreatorProfile, getDemoSharedCampaigns } from "./mock-data";
import { syncLegacyCreatorForm } from "./profile-mappers";
import { validateSocialAccounts } from "./social-account-validation";
import { DEMO_CREATOR_IDENTITY } from "./identity";
import type { Campaign, CreatorProfile, SocialAccount, SocialPlatform } from "@/types/shared";
export interface CampaignRepository { getAll(): Campaign[]; getPublished(): Campaign[]; getById(id: string): Campaign | undefined; create(campaign: Campaign): Campaign; update(id: string, changes: Partial<Campaign>): Campaign | undefined; publish(id: string): Campaign | undefined; pause(id: string): Campaign | undefined; resume(id: string): Campaign | undefined; complete(id: string): Campaign | undefined; cancel(id: string): Campaign | undefined; archive(id: string): Campaign | undefined; }
export interface CreatorRepository { getById(id: string): CreatorProfile | undefined; list(): CreatorProfile[]; update(profile: CreatorProfile): CreatorProfile; getSocialAccounts(creatorId: string): SocialAccount[] | undefined; addSocialAccount(creatorId: string, account: SocialAccount): SocialAccount; updateSocialAccount(creatorId: string, accountId: string, changes: Partial<Omit<SocialAccount, "id" | "creatorId">>): SocialAccount | undefined; removeSocialAccount(creatorId: string, accountId: string): SocialAccount | undefined; }
const legacyDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(); };
let campaigns = getDemoSharedCampaigns();
const campaignTransitions: Record<Campaign["status"], readonly Campaign["status"][]> = {
  DRAFT: ["PUBLISHED", "CANCELLED", "ARCHIVED"],
  PUBLISHED: ["PAUSED", "COMPLETED", "CANCELLED", "ARCHIVED"],
  PAUSED: ["PUBLISHED", "COMPLETED", "CANCELLED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  ARCHIVED: [],
};
const transition = (id: string, status: Campaign["status"]) => {
  const current = campaigns.find((campaign) => campaign.id === id);
  if (!current) return undefined;
  if (current.status === status || !campaignTransitions[current.status].includes(status)) {
    throw new Error(`Cannot transition campaign from ${current.status} to ${status}.`);
  }
  return campaignRepository.update(id, { status, updatedAt: new Date().toISOString(), ...(status === "PUBLISHED" ? { publishedAt: new Date().toISOString() } : {}) });
};
export const campaignRepository: CampaignRepository = {
  getAll: () => campaigns.map((campaign) => ({ ...campaign, platforms: [...campaign.platforms], deliverables: campaign.deliverables.map((item) => ({ ...item, requirements: [...item.requirements] })) })),
  getPublished: () => campaignRepository.getAll().filter((campaign) => campaign.status === "PUBLISHED" && new Date(campaign.applicationDeadline) >= new Date()),
  getById: (id) => campaignRepository.getAll().find((campaign) => campaign.id === id),
  create: (campaign) => { campaigns = [campaign, ...campaigns.filter((item) => item.id !== campaign.id)]; return campaign; },
  update: (id, changes) => {
    const current = campaigns.find((campaign) => campaign.id === id);
    if (!current) return undefined;
    if (changes.status && changes.status !== current.status && !campaignTransitions[current.status].includes(changes.status)) {
      throw new Error(`Cannot transition campaign from ${current.status} to ${changes.status}.`);
    }
    const next = { ...current, ...changes, updatedAt: new Date().toISOString() };
    campaigns = campaigns.map((campaign) => campaign.id === id ? next : campaign);
    return next;
  },
  publish: (id) => transition(id, "PUBLISHED"),
  pause: (id) => transition(id, "PAUSED"),
  resume: (id) => transition(id, "PUBLISHED"),
  complete: (id) => transition(id, "COMPLETED"),
  cancel: (id) => transition(id, "CANCELLED"),
  archive: (id) => transition(id, "ARCHIVED"),
};
let profile = getDemoCreatorProfile();
export const creatorRepository: CreatorRepository = {
  getById: (id) => id === profile.id || id === DEMO_CREATOR_IDENTITY.directoryId ? profile : undefined,
  list: () => [profile, ...getDemoBrandCreators().filter((creator) => creator.id !== DEMO_CREATOR_IDENTITY.directoryId).map((creator) => ({ id: creator.id, userId: creator.id, displayName: creator.name, bio: creator.bio, profileImage: creator.image, location: creator.location, languages: ["English"], categories: [creator.niche], socialAccounts: creator.platforms.map((platform, index) => ({ id: `${creator.id}-${platform}`, creatorId: creator.id, platform: (platform === "Instagram" ? "INSTAGRAM" : "YOUTUBE") as SocialPlatform, username: creator.username, profileUrl: "", followerCount: index ? Math.round(creator.followers * .7) : creator.followers, engagementRate: creator.engagement, dataSource: "DEMO" as const })), audienceMetrics: { age: creator.audience.age, gender: creator.audience.gender, topLocation: creator.audience.location }, portfolio: [], previousCollaborations: creator.collaborations, profileCompletion: 80, updatedAt: new Date().toISOString() }))],
  update: (next) => { if (next.id !== profile.id) throw new Error("Creator profile identity cannot change."); validateSocialAccounts(next.socialAccounts); profile = { ...profile, ...next, socialAccounts: next.socialAccounts.map((account) => ({ ...account, creatorId: profile.id })), updatedAt: new Date().toISOString() }; syncLegacyCreatorForm(profile); return profile; },
  getSocialAccounts: (creatorId) => { const creator = creatorRepository.getById(creatorId); return creator?.socialAccounts.map((account) => ({ ...account })); },
  addSocialAccount: (creatorId, account) => { const creator = creatorRepository.getById(creatorId); if (!creator || creator.id !== profile.id) throw new Error(`Creator profile ${creatorId} does not exist.`); if (creator.socialAccounts.some((item) => item.id === account.id)) throw new Error(`Social account ${account.id} already exists.`); const nextAccount = { ...account, creatorId: creator.id }; validateSocialAccounts([...creator.socialAccounts, nextAccount]); creatorRepository.update({ ...creator, socialAccounts: [...creator.socialAccounts, nextAccount] }); return { ...nextAccount }; },
  updateSocialAccount: (creatorId, accountId, changes) => { const creator = creatorRepository.getById(creatorId); if (!creator || creator.id !== profile.id) throw new Error(`Creator profile ${creatorId} does not exist.`); const current = creator.socialAccounts.find((account) => account.id === accountId); if (!current) return undefined; const updated = { ...current, ...changes, id: current.id, creatorId: creator.id }; validateSocialAccounts(creator.socialAccounts.map((account) => account.id === accountId ? updated : account)); creatorRepository.update({ ...creator, socialAccounts: creator.socialAccounts.map((account) => account.id === accountId ? updated : account) }); return { ...updated }; },
  removeSocialAccount: (creatorId, accountId) => { const creator = creatorRepository.getById(creatorId); if (!creator || creator.id !== profile.id) throw new Error(`Creator profile ${creatorId} does not exist.`); const removed = creator.socialAccounts.find((account) => account.id === accountId); if (!removed) return undefined; creatorRepository.update({ ...creator, socialAccounts: creator.socialAccounts.filter((account) => account.id !== accountId) }); return { ...removed }; },
};
