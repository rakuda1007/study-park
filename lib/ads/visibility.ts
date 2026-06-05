import type { BillingTierId } from "@/lib/billing/types";

/** 無料枠（included）のみ広告を表示 */
export function shouldShowAdsForPlan(planId: BillingTierId): boolean {
  return planId === "included";
}
