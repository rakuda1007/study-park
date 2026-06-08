"use client";

import { getUserProfile } from "@/lib/users/firestore";
import {
  applyBillingTierToWorkspace,
  getWorkspaceByOwner,
  syncWorkspacePurchaseStatus,
} from "@/lib/workspaces/firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import { getBillingTier, limitsFromTier } from "./tiers";

/**
 * スターター購入済みユーザーの WS を starter ティアへ昇格。
 * Stripe Webhook または管理者が users.appPurchase を active にした後に呼ぶ。
 */
export async function applyStarterToWorkspace(workspaceId: string): Promise<void> {
  const tier = await getBillingTier("starter");
  const limits = limitsFromTier(tier);
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId), {
    planId: limits.planId,
    accountPhase: "starter",
    trialEndsAt: null,
    storageBytesLimit: limits.storageBytesLimit,
    questionCountLimit: limits.questionCountLimit,
    appPurchaseStatus: "active",
    updatedAt: serverTimestamp(),
  });
}

/** users.appPurchase と workspaces の状態を同期 */
export async function syncCreatorBillingState(ownerId: string): Promise<WorkspaceDoc | null> {
  const [profile, ws] = await Promise.all([getUserProfile(ownerId), getWorkspaceByOwner(ownerId)]);
  if (!profile || !ws) return ws;

  const purchaseStatus = profile.appPurchase.status;

  if (purchaseStatus !== ws.appPurchaseStatus) {
    await syncWorkspacePurchaseStatus(ws.id, purchaseStatus);
  }

  if (purchaseStatus === "active" && (ws.planId === "trial" || ws.accountPhase === "trial")) {
    await applyStarterToWorkspace(ws.id);
    return getWorkspaceByOwner(ownerId);
  }

  if (
    purchaseStatus === "active" &&
    ws.subscriptionStatus !== "active" &&
    ws.planId !== "s" &&
    ws.planId !== "m" &&
    ws.planId !== "l" &&
    ws.planId !== "starter"
  ) {
    await applyStarterToWorkspace(ws.id);
    return getWorkspaceByOwner(ownerId);
  }

  return getWorkspaceByOwner(ownerId);
}

/** 月額プランへ変更（Stripe Webhook からも利用） */
export async function applySubscriptionTierToWorkspace(
  workspaceId: string,
  tierId: "s" | "m" | "l",
): Promise<void> {
  await applyBillingTierToWorkspace(workspaceId, tierId);
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId), {
    accountPhase: "subscribed",
    subscriptionStatus: "active",
    updatedAt: serverTimestamp(),
  });
}
