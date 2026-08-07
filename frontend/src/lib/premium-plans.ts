export const PREMIUM_PLANS = {
  monthly: { id: "monthly", name: "1 Month", amount: 4_900, price: "₹49", months: 1 },
  halfYearly: { id: "halfYearly", name: "6 Months", amount: 24_900, price: "₹249", months: 6 },
  yearly: { id: "yearly", name: "1 Year", amount: 49_900, price: "₹499", months: 12 },
} as const;

export type PremiumPlanId = keyof typeof PREMIUM_PLANS;

export function isPremiumPlanId(value: unknown): value is PremiumPlanId {
  return typeof value === "string" && value in PREMIUM_PLANS;
}
