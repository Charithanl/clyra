export const DEMO_CREATOR_IDENTITY = { creatorId: "creator-maya", userId: "user-maya", directoryId: "maya-brooks" } as const;
export function getCurrentCreatorIdentity() { return DEMO_CREATOR_IDENTITY; }
export function getDemoUserIdForCreator(creatorId: string) {
  return creatorId === DEMO_CREATOR_IDENTITY.creatorId ? DEMO_CREATOR_IDENTITY.userId : undefined;
}
