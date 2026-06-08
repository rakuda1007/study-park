/**
 * Stripe 連携（Phase 4〜5 で Checkout / Webhook を接続）
 *
 * スターターは環境変数、月額は Firestore `billingTiers/{tierId}.stripePriceId` を想定。
 */

import type { BillingTierId } from "./types";
import { getBillingTier } from "./tiers";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
}

/** 月額 Checkout 用 Price ID（trial / starter は null） */
export async function getStripePriceIdForTier(tierId: BillingTierId): Promise<string | null> {
  if (tierId === "trial" || tierId === "starter") return null;
  const tier = await getBillingTier(tierId);
  const id = tier.stripePriceId?.trim();
  return id || null;
}

/**
 * スターター（1回払い）用 Price ID
 * 優先: NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID
 * 互換: NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID
 */
export function getStripeStarterPriceId(): string | null {
  const starter = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID?.trim();
  if (starter) return starter;
  const legacy = process.env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID?.trim();
  return legacy || null;
}

/** @deprecated getStripeStarterPriceId を使用 */
export function getStripeCreatorPriceId(): string | null {
  return getStripeStarterPriceId();
}

export type StripeCheckoutKind = "starter_purchase" | "subscription";

export function stripeNotReadyMessage(kind: StripeCheckoutKind): string {
  if (kind === "starter_purchase") {
    return "スターター決済（Stripe）は準備中です。テスト時は Firestore の users.appPurchase.status を active に設定できます。";
  }
  return "月額プラン（Stripe）は準備中です。billingTiers に stripePriceId を設定後、Checkout を接続してください。";
}
