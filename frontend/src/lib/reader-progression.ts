function positiveEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function nonNegativeEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const EXP_PER_MANGA = positiveEnv(process.env.NEXT_PUBLIC_EXP_PER_MANGA, 25);
export const EXP_PER_LEVEL = positiveEnv(process.env.NEXT_PUBLIC_EXP_PER_LEVEL, 100);
export const LEVEL_EXP_GROWTH_PERCENT = nonNegativeEnv(process.env.NEXT_PUBLIC_LEVEL_EXP_GROWTH_PERCENT, 10);
export const FIXED_EXP_FROM_LEVEL = positiveEnv(process.env.NEXT_PUBLIC_FIXED_EXP_FROM_LEVEL, 500);
export const FIXED_EXP_AFTER_LEVEL = positiveEnv(process.env.NEXT_PUBLIC_FIXED_EXP_AFTER_LEVEL, 1000);
export const REFERRAL_EXP = positiveEnv(process.env.NEXT_PUBLIC_REFERRAL_EXP, 30);
export const PREMIUM_EXP_MULTIPLIER = positiveEnv(process.env.NEXT_PUBLIC_PREMIUM_EXP_MULTIPLIER, 2);
export const PRO_PLUS_LEVEL = positiveEnv(process.env.NEXT_PUBLIC_REWARD_LEVEL_PRO_PLUS, 50);
export const PROGRESSION_UPDATED_EVENT = "senpai-progression-updated";

export type RewardId = "pro-plus" | "tshirt" | "manga-volume" | "ps5" | "community-leader";
const REWARD_DEFINITIONS: { id: RewardId; level: number; title: string; description: string; physical?: boolean }[] = [
  { id: "pro-plus", level: PRO_PLUS_LEVEL, title: "1 year Pro Plus", description: "Premium and ad-free reading for one year." },
  { id: "tshirt", level: positiveEnv(process.env.NEXT_PUBLIC_REWARD_LEVEL_TSHIRT, 100), title: "SenpaiDen T-shirt", description: "An exclusive community T-shirt.", physical: true },
  { id: "manga-volume", level: positiveEnv(process.env.NEXT_PUBLIC_REWARD_LEVEL_MANGA_VOLUME, 150), title: "Manga hard-copy volume", description: "Choose one complete manga volume in print.", physical: true },
  { id: "ps5", level: positiveEnv(process.env.NEXT_PUBLIC_REWARD_LEVEL_PS5, 200), title: "PlayStation 5", description: "A PS5 milestone reward.", physical: true },
  { id: "community-leader", level: positiveEnv(process.env.NEXT_PUBLIC_REWARD_LEVEL_COMMUNITY_LEADER, 500), title: "Community Leader", description: "Unlock the Community Leader rank and privileges." },
];
export const READER_REWARDS = REWARD_DEFINITIONS.sort((a, b) => a.level - b.level);

const STORAGE_KEY = "senpai_reader_progression_v1";
const PREMIUM_KEY = "senpai_premium";
const REFERRAL_CODE_KEY = "senpai_permanent_referral_code_v1";
const ACCOUNT_KEY = "senpai_account";

export type ReaderProgression = {
  totalExp: number;
  readMangaIds: string[];
  proPlusRewardClaimed: boolean;
  claimedRewardIds: RewardId[];
  creditedReferralIds: string[];
  creditedReferralEmails: string[];
  referralCode: string;
};

const DEFAULT_PROGRESSION: ReaderProgression = {
  totalExp: 0,
  readMangaIds: [],
  proPlusRewardClaimed: false,
  claimedRewardIds: [],
  creditedReferralIds: [],
  creditedReferralEmails: [],
  referralCode: "",
};

function createReferralCode() {
  const value = crypto.randomUUID().replaceAll("-", "").toUpperCase().slice(0, 24);
  return `SEN-${value.slice(0, 8)}-${value.slice(8, 16)}-${value.slice(16, 24)}`;
}

function getOrCreatePermanentReferralCode(savedCode?: unknown) {
  const permanentCode = localStorage.getItem(REFERRAL_CODE_KEY);
  let account: Record<string, unknown> = {};
  try {
    account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "{}") || {};
  } catch {}

  const profileCode = typeof account.referralCode === "string" ? account.referralCode : "";
  const progressionCode = typeof savedCode === "string" ? savedCode : "";
  const code = permanentCode || profileCode || progressionCode || createReferralCode();

  localStorage.setItem(REFERRAL_CODE_KEY, code);
  if (account.referralCode !== code) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ ...account, referralCode: code }));
  }
  return code;
}

export function getLevel(totalExp: number) {
  return getLevelProgress(totalExp).level;
}

export function getNextLevelRequirement(currentRequiredExp: number, nextLevel: number) {
  if (nextLevel >= FIXED_EXP_FROM_LEVEL) return FIXED_EXP_AFTER_LEVEL;
  const growthMultiplier = 1 + LEVEL_EXP_GROWTH_PERCENT / 100;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.ceil(currentRequiredExp * growthMultiplier - 1e-9));
}

export function getLevelProgress(totalExp: number) {
  let remainingExp = Math.max(0, Number.isFinite(totalExp) ? totalExp : 0);
  let level = 1;
  let requiredExp = EXP_PER_LEVEL;

  while (remainingExp >= requiredExp && level < 10_000) {
    remainingExp -= requiredExp;
    level += 1;
    requiredExp = getNextLevelRequirement(requiredExp, level);
  }

  const currentExp = Math.floor(remainingExp);
  return {
    level,
    currentExp,
    requiredExp,
    progressPercent: requiredExp ? Math.min(100, (currentExp / requiredExp) * 100) : 0,
  };
}

export function getReaderProgression(): ReaderProgression {
  if (typeof window === "undefined") return DEFAULT_PROGRESSION;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const progression = {
      totalExp: Number.isFinite(saved?.totalExp) ? Math.max(0, saved.totalExp) : 0,
      readMangaIds: Array.isArray(saved?.readMangaIds) ? saved.readMangaIds : [],
      proPlusRewardClaimed: Boolean(saved?.proPlusRewardClaimed),
      claimedRewardIds: Array.isArray(saved?.claimedRewardIds) ? saved.claimedRewardIds : [],
      creditedReferralIds: Array.isArray(saved?.creditedReferralIds) ? saved.creditedReferralIds : [],
      creditedReferralEmails: Array.isArray(saved?.creditedReferralEmails) ? saved.creditedReferralEmails : [],
      referralCode: getOrCreatePermanentReferralCode(saved?.referralCode),
    };
    if (saved?.referralCode !== progression.referralCode) localStorage.setItem(STORAGE_KEY, JSON.stringify(progression));
    return progression;
  } catch {
    return DEFAULT_PROGRESSION;
  }
}

export function hasActivePremium() {
  if (typeof window === "undefined") return false;
  try {
    const membership = JSON.parse(localStorage.getItem(PREMIUM_KEY) || "null");
    return Boolean(membership?.expiresAt && new Date(membership.expiresAt).getTime() > Date.now());
  } catch {
    return false;
  }
}

export function getMangaExpAward() {
  return EXP_PER_MANGA * (hasActivePremium() ? PREMIUM_EXP_MULTIPLIER : 1);
}

export function getReferralExpAward() {
  return REFERRAL_EXP * (hasActivePremium() ? PREMIUM_EXP_MULTIPLIER : 1);
}

function activateProPlusReward(progression: ReaderProgression) {
  if (getLevel(progression.totalExp) < PRO_PLUS_LEVEL || progression.proPlusRewardClaimed) return progression;

  let baseDate = new Date();
  try {
    const current = JSON.parse(localStorage.getItem(PREMIUM_KEY) || "null");
    const currentExpiry = current?.expiresAt ? new Date(current.expiresAt) : null;
    if (currentExpiry && currentExpiry > baseDate) baseDate = currentExpiry;
  } catch {}

  const expiresAt = new Date(baseDate);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  localStorage.setItem(PREMIUM_KEY, JSON.stringify({
    planId: "reward-pro-plus",
    planName: "Pro Plus Level 50 Reward",
    source: "level-50-reward",
    verified: true,
    activatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    adsFree: true,
  }));
  window.dispatchEvent(new Event("senpai-premium-updated"));
  return { ...progression, proPlusRewardClaimed: true };
}

export function awardMangaExp(mangaId: string) {
  const current = getReaderProgression();
  if (!mangaId || current.readMangaIds.includes(mangaId)) {
    return { progression: current, awarded: false as const, rewardUnlocked: false, expAwarded: 0 };
  }

  const previousLevel = getLevel(current.totalExp);
  const expAwarded = getMangaExpAward();
  let next: ReaderProgression = {
    ...current,
    totalExp: current.totalExp + expAwarded,
    readMangaIds: [...current.readMangaIds, mangaId],
  };
  const rewardWasClaimed = next.proPlusRewardClaimed;
  next = activateProPlusReward(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PROGRESSION_UPDATED_EVENT));

  return {
    progression: next,
    awarded: true as const,
    leveledUp: getLevel(next.totalExp) > previousLevel,
    rewardUnlocked: !rewardWasClaimed && next.proPlusRewardClaimed,
    expAwarded,
  };
}

function saveProgression(progression: ReaderProgression) {
  const next = activateProPlusReward(progression);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PROGRESSION_UPDATED_EVENT));
  return next;
}

export function creditSuccessfulReferral(referredEmail: string, accountEmail: string) {
  const normalized = referredEmail.trim().toLowerCase();
  const ownEmail = accountEmail.trim().toLowerCase();
  const current = getReaderProgression();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) return { ok: false, error: "Enter a valid referred user email address." } as const;
  if (normalized === ownEmail) return { ok: false, error: "Your own account email cannot be referred." } as const;
  if (current.creditedReferralEmails.some((email) => email.toLowerCase() === normalized)) return { ok: false, error: "This email has already been credited." } as const;
  const previousLevel = getLevel(current.totalExp);
  const expAwarded = getReferralExpAward();
  const progression = saveProgression({ ...current, totalExp: current.totalExp + expAwarded, creditedReferralEmails: [...current.creditedReferralEmails, normalized] });
  return { ok: true, progression, expAwarded, leveledUp: getLevel(progression.totalExp) > previousLevel } as const;
}

export function claimReaderReward(rewardId: RewardId) {
  const reward = READER_REWARDS.find((item) => item.id === rewardId);
  const current = getReaderProgression();
  if (!reward || getLevel(current.totalExp) < reward.level) return { ok: false, error: "This reward is still locked." } as const;
  if (current.claimedRewardIds.includes(rewardId)) return { ok: false, error: "This reward has already been claimed." } as const;
  const progression = saveProgression({ ...current, claimedRewardIds: [...current.claimedRewardIds, rewardId] });
  return { ok: true, progression, reward } as const;
}
