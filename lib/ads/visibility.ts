import type { BillingTierId } from "@/lib/billing/types";

const PAID_TIER_IDS: BillingTierId[] = ["s", "m", "l"];

/** 無料枠のみ広告表示（S/M/L 以外は無料扱い。planId 未設定も無料枠） */
export function shouldShowAdsForPlan(planId: BillingTierId | string | undefined | null): boolean {
  if (!planId || planId === "included") return true;
  return !PAID_TIER_IDS.includes(planId as BillingTierId);
}
