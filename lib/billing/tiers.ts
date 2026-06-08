"use client";

import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { BillingTierDoc, BillingTierId } from "./types";
import { normalizePlanId } from "./types";

const MB = 1024 * 1024;
const GB = 1024 * MB;

/** コード側フォールバック（Firestore 未設定・読取失敗時）— 仕様書 v0.3 */
export const DEFAULT_BILLING_TIERS: Record<BillingTierId, BillingTierDoc> = {
  trial: {
    id: "trial",
    displayName: "お試し",
    monthlyPriceLabel: "¥0",
    storageBytesLimit: 100 * MB,
    questionCountLimit: 80,
    sortOrder: 0,
    active: true,
  },
  starter: {
    id: "starter",
    displayName: "スターター",
    oneTimePriceLabel: "¥980",
    storageBytesLimit: 100 * MB,
    questionCountLimit: 200,
    sortOrder: 1,
    active: true,
  },
  s: {
    id: "s",
    displayName: "S",
    monthlyPriceLabel: "¥480",
    storageBytesLimit: 1 * GB,
    questionCountLimit: 500,
    sortOrder: 2,
    active: true,
  },
  m: {
    id: "m",
    displayName: "M",
    monthlyPriceLabel: "¥980",
    storageBytesLimit: 5 * GB,
    questionCountLimit: 1000,
    sortOrder: 3,
    active: true,
  },
  l: {
    id: "l",
    displayName: "L",
    monthlyPriceLabel: "¥2,480",
    storageBytesLimit: 20 * GB,
    questionCountLimit: 2000,
    sortOrder: 4,
    active: true,
  },
};

export const BILLING_TIER_IDS: BillingTierId[] = ["trial", "starter", "s", "m", "l"];

const LEGACY_TIER_ALIASES: Record<string, BillingTierId> = {
  included: "trial",
};

function resolveTierId(id: string): BillingTierId | null {
  const normalized = LEGACY_TIER_ALIASES[id] ?? normalizePlanId(id);
  if (!BILLING_TIER_IDS.includes(normalized)) return null;
  return normalized;
}

function mapTier(id: string, data: Record<string, unknown>): BillingTierDoc | null {
  const tierId = resolveTierId(id);
  if (!tierId) return null;
  const fallback = DEFAULT_BILLING_TIERS[tierId];
  const storage = Number(data.storageBytesLimit);
  const questions = Number(data.questionCountLimit);
  return {
    id: tierId,
    displayName: String(data.displayName ?? fallback.displayName),
    monthlyPriceLabel: data.monthlyPriceLabel
      ? String(data.monthlyPriceLabel)
      : fallback.monthlyPriceLabel,
    oneTimePriceLabel: data.oneTimePriceLabel
      ? String(data.oneTimePriceLabel)
      : fallback.oneTimePriceLabel,
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
export async function getBillingTier(tierId: BillingTierId | string): Promise<BillingTierDoc> {
  const resolved = resolveTierId(tierId) ?? "trial";
  try {
    const snap = await getDoc(doc(getFirestoreClient(), "billingTiers", tierId));
    if (!snap.exists() && tierId !== resolved) {
      const alt = await getDoc(doc(getFirestoreClient(), "billingTiers", resolved));
      if (alt.exists()) {
        const mapped = mapTier(alt.id, alt.data());
        if (mapped?.active) return mapped;
      }
    }
    if (snap.exists()) {
      const mapped = mapTier(snap.id, snap.data());
      if (mapped?.active) return mapped;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_BILLING_TIERS[resolved];
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

/** お試し終了日（WS 作成から2年） */
export function defaultTrialEndsAt(from: Date = new Date()): string {
  const end = new Date(from);
  end.setFullYear(end.getFullYear() + 2);
  return end.toISOString();
}
