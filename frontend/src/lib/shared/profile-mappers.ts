import { demoProfile } from "@/lib/creator/mock-data";
import type { CreatorProfile } from "@/types/shared";

export function syncLegacyCreatorForm(profile: CreatorProfile) {
  demoProfile.name = profile.displayName;
  demoProfile.fullName = profile.displayName;
  demoProfile.bio = profile.bio;
  demoProfile.location = profile.location;
  demoProfile.languages = profile.languages.join(", ");
  demoProfile.categories = [...profile.categories];
  demoProfile.primaryCategory = profile.categories[0] ?? "";
  demoProfile.socials = profile.socialAccounts.map((account) => ({ id: account.id, platform: account.platform === "INSTAGRAM" ? "Instagram" : "YouTube", handle: account.username, url: account.profileUrl, followers: String(account.followerCount), category: "Creator", source: account.dataSource === "INSTAGRAM_SIMULATED" ? "Simulated Instagram Data" : "Manual entry" }));
  demoProfile.audience = { age: profile.audienceMetrics.age ?? "", gender: profile.audienceMetrics.gender ?? "", location: profile.audienceMetrics.topLocation ?? "", countries: profile.audienceMetrics.topLocation ?? "", interests: profile.audienceMetrics.interests ?? "" };
  demoProfile.portfolio = profile.portfolio.map((item) => ({ id: item.id, title: item.title, description: item.description ?? "", url: item.url, platform: "Instagram", contentType: "Reel" }));
}
