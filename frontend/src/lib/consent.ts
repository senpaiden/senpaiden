export const CONSENT_STORAGE_KEY = "senpaiden_consent_v1";
export const CONSENT_UPDATED_EVENT = "senpaiden-consent-updated";
export const OPEN_CONSENT_EVENT = "senpaiden-open-consent";

export type ConsentPreferences = {
  version: 1;
  necessary: true;
  analytics: boolean;
  advertising: boolean;
  decidedAt: string;
};

export function getConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || "null") as ConsentPreferences | null;
    return parsed?.version === 1 ? parsed : null;
  } catch { return null; }
}

export function saveConsent(input: Pick<ConsentPreferences, "analytics" | "advertising">) {
  const preferences: ConsentPreferences = { version: 1, necessary: true, analytics: input.analytics, advertising: input.advertising, decidedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: preferences }));
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("consent", "update", { analytics_storage: preferences.analytics ? "granted" : "denied", ad_storage: preferences.advertising ? "granted" : "denied", ad_user_data: preferences.advertising ? "granted" : "denied", ad_personalization: preferences.advertising ? "granted" : "denied" });
  return preferences;
}

export function hasConsent(category: "analytics" | "advertising") {
  return getConsent()?.[category] === true;
}
