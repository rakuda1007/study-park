import type { BillingTierId } from "../types";

const MB = 1024 * 1024;
const GB = 1024 * MB;

/** フォールバック上限（Firestore billingTiers 未設定時） */
export const DEFAULT_TIER_LIMITS: Record<
  BillingTierId,
  { storageBytesLimit: number; questionCountLimit: number }
> = {
  trial: { storageBytesLimit: 100 * MB, questionCountLimit: 80 },
  starter: { storageBytesLimit: 100 * MB, questionCountLimit: 200 },
  s: { storageBytesLimit: 1 * GB, questionCountLimit: 500 },
  m: { storageBytesLimit: 5 * GB, questionCountLimit: 1000 },
  l: { storageBytesLimit: 20 * GB, questionCountLimit: 2000 },
};

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY が設定されていません。");
  return key;
}

export function getStripeWebhookSecret(): string {
  const key = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!key) throw new Error("STRIPE_WEBHOOK_SECRET が設定されていません。");
  return key;
}

export function getStarterPriceId(): string {
  const id =
    process.env.STRIPE_STARTER_PRICE_ID?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID?.trim();
  if (!id) throw new Error("スターター用 Stripe Price ID が設定されていません。");
  return id;
}

export function billingSiteUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
