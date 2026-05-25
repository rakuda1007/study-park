/** サブスクティア ID（Stripe Price は billingTiers ドキュメントで紐づけ） */
export type BillingTierId = "included" | "s" | "m" | "l";

export type SubscriptionStatus = "none" | "active" | "past_due" | "canceled";

export type AppPurchaseStatus = "none" | "pending" | "active" | "refunded";

/** Firestore `billingTiers/{tierId}` — 上限は運用で可変 */
export type BillingTierDoc = {
  id: BillingTierId;
  displayName: string;
  /** 月額表示用（実決済は Stripe 側。未設定なら「要設定」） */
  monthlyPriceLabel?: string;
  storageBytesLimit: number;
  questionCountLimit: number;
  sortOrder: number;
  /** Stripe Price ID（例: price_xxx）。未設定時は Checkout 未接続 */
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
