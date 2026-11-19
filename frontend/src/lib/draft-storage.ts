const DRAFT_VERSION = 1;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export const SIGNUP_DRAFT_KEY = "clyra.signup.draft.v1";
export const ROLE_ONBOARDING_DRAFT_KEY = "clyra.role-onboarding.draft.v1";
export const CREATOR_ONBOARDING_DRAFT_KEY = "clyra.creator-onboarding.draft.v1";

export type DemoAccountType = "brand" | "creator";
export type SignupDraft = {
  flow: "account-type" | "signup" | "onboarding";
  type: DemoAccountType;
  name: string;
  email: string;
  termsAccepted: boolean;
  step: number;
  fields?: Record<string, string>;
};

type StoredDraft<T> = { version: number; savedAt: number; data: T };

export function readDraft<T>(key: string, isValid: (value: unknown) => value is T): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== "object") throw new Error("Invalid draft.");
    const candidate = stored as Partial<StoredDraft<unknown>>;
    const age = Date.now() - Number(candidate.savedAt);
    if (candidate.version !== DRAFT_VERSION || !Number.isFinite(age) || age < 0 || age > MAX_AGE_MS || !isValid(candidate.data)) {
      window.localStorage.removeItem(key);
      return undefined;
    }
    return candidate.data;
  } catch {
    try { window.localStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
    return undefined;
  }
}

export function writeDraft<T>(key: string, data: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify({ version: DRAFT_VERSION, savedAt: Date.now(), data } satisfies StoredDraft<T>));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(key: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
}

export function isSignupDraft(value: unknown): value is SignupDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<SignupDraft>;
  if (draft.flow !== "account-type" && draft.flow !== "signup" && draft.flow !== "onboarding") return false;
  if (draft.type !== "brand" && draft.type !== "creator") return false;
  if (typeof draft.name !== "string" || draft.name.length > 120) return false;
  if (typeof draft.email !== "string" || draft.email.length > 254) return false;
  if (typeof draft.termsAccepted !== "boolean" || !Number.isInteger(draft.step)) return false;
  if (draft.fields !== undefined && (!draft.fields || typeof draft.fields !== "object" || Array.isArray(draft.fields) || Object.keys(draft.fields).length > 80 || Object.entries(draft.fields).some(([key, field]) => key.length > 160 || typeof field !== "string" || field.length > 2000))) return false;
  const maximumStep = draft.flow === "onboarding" ? (draft.type === "brand" ? 3 : 5) : 0;
  return draft.step! >= 0 && draft.step! <= maximumStep;
}

export function readSignupDraft() {
  return readDraft(SIGNUP_DRAFT_KEY, isSignupDraft);
}

export function writeSignupDraft(draft: SignupDraft) {
  // Persist only allowlisted, non-sensitive signup fields. Passwords are never accepted here.
  const safeDraft: SignupDraft = {
    flow: draft.flow,
    type: draft.type,
    name: draft.name.slice(0, 120),
    email: draft.email.slice(0, 254),
    termsAccepted: draft.termsAccepted,
    step: draft.step,
    ...(draft.fields ? { fields: Object.fromEntries(Object.entries(draft.fields).slice(0, 80).map(([key, value]) => [key.slice(0, 160), value.slice(0, 2000)])) } : {}),
  };
  return writeDraft(SIGNUP_DRAFT_KEY, safeDraft);
}

export function clearSignupDraft() {
  clearDraft(SIGNUP_DRAFT_KEY);
}
