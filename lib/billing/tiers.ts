"use client";

import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { BillingTierDoc, BillingTierId } from "./types";

const MB = 1024 * 1024;
const GB = 1024 * MB;

/** コード側フォールバック（Firestore 未設定・読取失敗時） */
export const DEFAULT_BILLING_TIERS: Record<BillingTierId, BillingTierDoc> = {
  included: {
    id: "included",
    displayName: "無料枠",
    monthlyPriceLabel: "¥0",
    storageBytesLimit: 100 * MB,
    questionCountLimit: 30,
    sortOrder: 0,
    active: true,
  },
  s: {
    id: "s",
    displayName: "S",
    monthlyPriceLabel: "要設定（Stripe）",
    storageBytesLimit: 1 * GB,
    questionCountLimit: 100,
    sortOrder: 1,
    active: true,
  },
  m: {
    id: "m",
    displayName: "M",
    monthlyPriceLabel: "要設定（Stripe）",
    storageBytesLimit: 5 * GB,
    questionCountLimit: 500,
    sortOrder: 2,
    active: true,
  },
  l: {
    id: "l",
    displayName: "L",
    monthlyPriceLabel: "要設定（Stripe）",
    storageBytesLimit: 20 * GB,
    questionCountLimit: 2000,
    sortOrder: 3,
    active: true,
  },
};

export const BILLING_TIER_IDS: BillingTierId[] = ["included", "s", "m", "l"];

function mapTier(id: string, data: Record<string, unknown>): BillingTierDoc | null {
  if (!BILLING_TIER_IDS.includes(id as BillingTierId)) return null;
  const fallback = DEFAULT_BILLING_TIERS[id as BillingTierId];
  const storage = Number(data.storageBytesLimit);
  const questions = Number(data.questionCountLimit);
  return {
    id: id as BillingTierId,
    displayName: String(data.displayName ?? fallback.displayName),
    monthlyPriceLabel: data.monthlyPriceLabel
      ? String(data.monthlyPriceLabel)
      : fallback.monthlyPriceLabel,
    storageBytesLimit:
      Number.isFinite(storage) && storage > 0 ? storage : fallback.storageBytesLimit,
    questionCountLimit:
      Number.isFinite(questions) && questions > 0 ? questions : fallback.questionCountLimit,
    sortOrder: Number.isFinite(Number(data.sortOrder))
      ? Number(data.sortOrder)
      : fallback.sortOrder,
    stripePriceId: data.stripePriceId ? String(data.stripePriceId) : undefined,
    active: data.active === false ? false : true,
  };
}

/** Firestore `billingTiers` を優先し、なければデフォルト */
export async function getBillingTier(tierId: BillingTierId): Promise<BillingTierDoc> {
  try {
    const snap = await getDoc(doc(getFirestoreClient(), "billingTiers", tierId));
    if (snap.exists()) {
      const mapped = mapTier(snap.id, snap.data());
      if (mapped?.active) return mapped;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_BILLING_TIERS[tierId];
}

export async function listBillingTiers(): Promise<BillingTierDoc[]> {
  try {
    const snap = await getDocs(collection(getFirestoreClient(), "billingTiers"));
    if (!snap.empty) {
      const tiers = snap.docs
        .map((d) => mapTier(d.id, d.data()))
        .filter((t): t is BillingTierDoc => t != null && t.active)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      if (tiers.length > 0) return tiers;
    }
  } catch {
    /* fallback */
  }
  return BILLING_TIER_IDS.map((id) => DEFAULT_BILLING_TIERS[id]);
}

/** ワークスペースにコピーする上限フィールド */
export function limitsFromTier(tier: BillingTierDoc): {
  storageBytesLimit: number;
  questionCountLimit: number;
  planId: BillingTierId;
} {
  return {
    planId: tier.id,
    storageBytesLimit: tier.storageBytesLimit,
    questionCountLimit: tier.questionCountLimit,
  };
}
