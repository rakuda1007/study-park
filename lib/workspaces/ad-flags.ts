"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import type { BillingTierId } from "@/lib/billing/types";
import { shouldShowAdsForPlan } from "@/lib/ads/visibility";
import { getFirestoreClient } from "@/lib/firebase/client";

/** 学習画面用: 未ログインでも読める広告フラグ（ワークスペース本体は非公開のまま） */
export async function getWorkspaceShowAds(workspaceId: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(getFirestoreClient(), "workspaceAdFlags", workspaceId));
    if (snap.exists()) return snap.data().showAds === true;
  } catch {
    /* fallback */
  }
  return true;
}

export async function syncWorkspaceAdFlag(
  workspaceId: string,
  planId: BillingTierId,
): Promise<void> {
  await setDoc(
    doc(getFirestoreClient(), "workspaceAdFlags", workspaceId),
    { showAds: shouldShowAdsForPlan(planId), planId },
    { merge: true },
  );
}
