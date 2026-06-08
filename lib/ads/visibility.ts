import type { BillingTierId } from "@/lib/billing/types";
import { normalizePlanId } from "@/lib/billing/types";

/** お試し中のみ広告表示（スターター・S/M/L は非表示） */
export function shouldShowAdsForPlan(planId: BillingTierId | string | undefined | null): boolean {
  const id = normalizePlanId(planId ?? undefined);
  return id === "trial";
}
