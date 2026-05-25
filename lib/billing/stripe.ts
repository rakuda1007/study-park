/**
 * Stripe 連携（Phase 5 以降で Checkout / Webhook を接続）
 *
 * 月額は Stripe Dashboard で Price を作成し、
 * Firestore `billingTiers/{tierId}.stripePriceId` に設定する運用を想定。
 */

import type { BillingTierId } from "./types";
import { getBillingTier } from "./tiers";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
}

/** Checkout 用 Price ID（Firestore の tier ドキュメント優先） */
export async function getStripePriceIdForTier(tierId: BillingTierId): Promise<string | null> {
  if (tierId === "included") return null;
  const tier = await getBillingTier(tierId);
  const id = tier.stripePriceId?.trim();
  return id || null;
}

/**
 * 買い切り用 Price ID（環境変数）
 * 例: NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID=price_xxx
 */
export function getStripeCreatorPriceId(): string | null {
  const id = process.env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID?.trim();
  return id || null;
}

/** 将来: Cloud Functions から Checkout Session を作成 */
export type StripeCheckoutKind = "creator_purchase" | "subscription";

export function stripeNotReadyMessage(kind: StripeCheckoutKind): string {
  if (kind === "creator_purchase") {
    return "買い切り決済（Stripe）は準備中です。テスト時は Firestore の users.appPurchase.status を active に設定できます。";
  }
  return "月額プラン（Stripe）は準備中です。billingTiers に stripePriceId を設定後、Checkout を接続してください。";
}
