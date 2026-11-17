import type { SocialAccount } from "@/types/shared";

function normalizedProfileUrl(value: string) {
  try {
    const parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (!(parsed.protocol === "http:" || parsed.protocol === "https:") || !parsed.hostname.includes(".")) throw new Error("invalid URL");
    parsed.hostname = parsed.hostname.replace(/^www\./, "");
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error("Enter a valid social profile URL.");
  }
}

function profileIdentifierFromUrl(platform: SocialAccount["platform"], profileUrl: string) {
  const segments = new URL(profileUrl).pathname.split("/").filter(Boolean);
  if (platform === "INSTAGRAM" && segments[0]) return segments[0].replace(/^@/, "").toLowerCase();
  if (platform === "YOUTUBE" && segments[0]?.startsWith("@")) return segments[0].slice(1).toLowerCase();
  return "";
}

export function normalizeSocialAccountReference(account: Pick<SocialAccount, "platform" | "username" | "profileUrl">) {
  const username = account.username.trim().toLowerCase().replace(/^@/, "");
  const rawProfileUrl = account.profileUrl.trim();
  if (!username && !rawProfileUrl) throw new Error("Add a social handle or profile URL.");
  const profileUrl = rawProfileUrl ? normalizedProfileUrl(rawProfileUrl) : "";
  const urlIdentifier = profileUrl ? profileIdentifierFromUrl(account.platform, profileUrl) : "";
  return `${account.platform}:${urlIdentifier || username || profileUrl}`;
}

export function validateSocialAccounts(accounts: SocialAccount[]) {
  const seen = new Set<string>();
  for (const account of accounts) { const key = normalizeSocialAccountReference(account); if (seen.has(key)) throw new Error(`This ${account.platform} account is already connected: ${account.username || account.profileUrl}.`); seen.add(key); }
  return accounts;
}
