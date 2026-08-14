export const ACCOUNT_KEY = "senpai_account";
export const SESSION_KEY = "senpai_session_v1";
export const ACCOUNTS_KEY = "senpai_accounts_v1";
export const AUTH_UPDATED_EVENT = "senpai-auth-updated";

export interface StoredAccount {
  displayName: string;
  email: string;
  bio: string;
  referralCode?: string;
  password?: string;
  referralPrompt?: "pending" | "completed" | "skipped" | "dismissed";
  pendingReferralCode?: string;
}

export function isSignedIn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "active" && Boolean(localStorage.getItem(ACCOUNT_KEY));
}

export function getStoredAccount(): StoredAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getRegisteredAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function createReferralCode() {
  const existing = new Set(getRegisteredAccounts().map((account) => account.referralCode));
  let code = "";
  do {
    code = `SENPAI-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 6).toUpperCase()}`;
  } while (existing.has(code));
  return code;
}

export function startSession(account: StoredAccount) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  localStorage.setItem(SESSION_KEY, "active");
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
  window.dispatchEvent(new Event("senpai-account-updated"));
}

export function registerAccount(account: StoredAccount) {
  account = { ...account, referralPrompt: account.referralPrompt || "pending" };
  const accounts = getRegisteredAccounts();
  const next = [...accounts.filter((item) => item.email.toLowerCase() !== account.email.toLowerCase()), account];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
  startSession(account);
}

export function rememberAccount(account: StoredAccount) {
  const accounts = getRegisteredAccounts();
  const previous = accounts.find((item) => item.email.toLowerCase() === account.email.toLowerCase());
  const saved = previous ? { ...previous, ...account, password: previous.password } : account;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts.filter((item) => item.email.toLowerCase() !== account.email.toLowerCase()), saved]));
}

export function endSession() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
  window.dispatchEvent(new Event("senpai-account-updated"));
}
