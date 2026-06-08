import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { BillingTierId } from "./types";
import { DEFAULT_TIER_LIMITS } from "./config";

async function tierLimitsFromFirestore(
  db: Firestore,
  tierId: BillingTierId,
): Promise<{ storageBytesLimit: number; questionCountLimit: number }> {
  const fallback = DEFAULT_TIER_LIMITS[tierId];
  const snap = await db.collection("billingTiers").doc(tierId).get();
  if (!snap.exists) return fallback;
  const data = snap.data() ?? {};
  const storage = Number(data.storageBytesLimit);
  const questions = Number(data.questionCountLimit);
  return {
    storageBytesLimit: Number.isFinite(storage) && storage > 0 ? storage : fallback.storageBytesLimit,
    questionCountLimit:
      Number.isFinite(questions) && questions > 0 ? questions : fallback.questionCountLimit,
  };
}

export async function assertWorkspaceOwner(
  db: Firestore,
  workspaceId: string,
  uid: string,
): Promise<void> {
  const snap = await db.collection("workspaces").doc(workspaceId).get();
  if (!snap.exists) throw new Error("ワークスペースが見つかりません。");
  if (snap.data()?.ownerId !== uid) throw new Error("このワークスペースのオーナーではありません。");
}

export async function applyStarterPurchase(
  db: Firestore,
  uid: string,
  workspaceId: string,
  paymentId: string,
): Promise<void> {
  const limits = await tierLimitsFromFirestore(db, "starter");
  const batch = db.batch();
  const userRef = db.collection("users").doc(uid);
  const wsRef = db.collection("workspaces").doc(workspaceId);

  batch.update(userRef, {
    appPurchase: {
      status: "active",
      product: "starter",
      purchasedAt: FieldValue.serverTimestamp(),
      provider: "stripe",
      paymentId,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.update(wsRef, {
    planId: "starter",
    accountPhase: "starter",
    trialEndsAt: null,
    storageBytesLimit: limits.storageBytesLimit,
    questionCountLimit: limits.questionCountLimit,
    appPurchaseStatus: "active",
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  await db
    .collection("workspaceAdFlags")
    .doc(workspaceId)
    .set({ showAds: false, planId: "starter" }, { merge: true });
}

export async function applySubscriptionTier(
  db: Firestore,
  workspaceId: string,
  tierId: "s" | "m" | "l",
  opts?: { subscriptionId?: string; customerId?: string; status?: "active" | "past_due" | "canceled" },
): Promise<void> {
  const limits = await tierLimitsFromFirestore(db, tierId);
  const patch: Record<string, unknown> = {
    planId: tierId,
    accountPhase: opts?.status === "canceled" ? "starter" : "subscribed",
    subscriptionStatus: opts?.status ?? "active",
    storageBytesLimit: limits.storageBytesLimit,
    questionCountLimit: limits.questionCountLimit,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (opts?.subscriptionId) patch.stripeSubscriptionId = opts.subscriptionId;
  if (opts?.customerId) patch.stripeCustomerId = opts.customerId;

  if (opts?.status === "canceled") {
    const starterLimits = await tierLimitsFromFirestore(db, "starter");
    patch.planId = "starter";
    patch.storageBytesLimit = starterLimits.storageBytesLimit;
    patch.questionCountLimit = starterLimits.questionCountLimit;
    patch.subscriptionStatus = "canceled";
  }

  await db.collection("workspaces").doc(workspaceId).update(patch);

  const showAds = false;
  await db
    .collection("workspaceAdFlags")
    .doc(workspaceId)
    .set({ showAds, planId: patch.planId }, { merge: true });
}
