/** 課金ティア ID（Stripe Price は billingTiers ドキュメントで紐づけ） */
export type BillingTierId = "trial" | "starter" | "s" | "m" | "l";

/** @deprecated 旧データ互換。読み取り時に trial へ正規化 */
export type LegacyBillingTierId = "included";

export type SubscriptionStatus = "none" | "active" | "past_due" | "canceled";

export type AppPurchaseStatus = "none" | "pending" | "active" | "refunded";

export type AccountPhase = "trial" | "starter" | "subscribed";

/** Firestore `billingTiers/{tierId}` — 上限は運用で可変 */
export type BillingTierDoc = {
  id: BillingTierId;
  displayName: string;
  /** 月額表示用（S/M/L。実決済は Stripe 側） */
  monthlyPriceLabel?: string;
  /** 1回払い表示用（スターター） */
  oneTimePriceLabel?: string;
  storageBytesLimit: number;
  questionCountLimit: number;
  sortOrder: number;
  /** Stripe Price ID（例: price_xxx） */
  stripePriceId?: string;
  active: boolean;
};

export type WorkspaceUsage = {
  storageBytesUsed: number;
  storageBytesLimit: number;
  questionCount: number;
  questionCountLimit: number;
  planId: BillingTierId;
  subscriptionStatus: SubscriptionStatus;
};

/** planId を現行の BillingTierId に正規化 */
export function normalizePlanId(planId: string | undefined | null): BillingTierId {
  if (planId === "included") return "trial";
  if (
    planId === "trial" ||
    planId === "starter" ||
    planId === "s" ||
    planId === "m" ||
    planId === "l"
  ) {
    return planId;
  }
  return "trial";
}
