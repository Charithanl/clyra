const LEGACY_CAMPAIGN_IDS: Record<number, string> = {
  1: "camp-aurelia-summer",
  2: "camp-glow-beauty",
  3: "camp-nexora-tech",
  4: "camp-earth-living",
  5: "camp-hearth-ritual",
  6: "camp-forma-move",
  7: "camp-morrow-table",
  8: "camp-aurelia-neutral",
};

export function toCanonicalCampaignId(value: string | number): string | undefined {
  if (typeof value === "number") return LEGACY_CAMPAIGN_IDS[value];
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.startsWith("brand-")) {
    const numeric = Number(normalized.slice("brand-".length));
    return Number.isInteger(numeric) ? LEGACY_CAMPAIGN_IDS[numeric] : undefined;
  }
  if (Object.values(LEGACY_CAMPAIGN_IDS).includes(normalized) || normalized.startsWith("campaign-")) return normalized;
  return undefined;
}

export function toLegacyCampaignId(canonicalId: string): number | undefined {
  const entry = Object.entries(LEGACY_CAMPAIGN_IDS).find(([, value]) => value === canonicalId);
  if (entry) return Number(entry[0]);
  if (canonicalId.startsWith("brand-")) {
    const numeric = Number(canonicalId.slice("brand-".length));
    return Number.isInteger(numeric) ? numeric : undefined;
  }
  return undefined;
}

export function canonicalIdForNewCampaign(legacyNumericId: number): string {
  return toCanonicalCampaignId(legacyNumericId) ?? `brand-${legacyNumericId}`;
}
