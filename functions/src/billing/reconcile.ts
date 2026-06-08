import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { applyStarterPurchase, applySubscriptionTier } from "./apply";
import { getStripe } from "./stripe";
import { normalizePlanId } from "./types";

export type ReconcileResult = {
  migratedIncluded: number;
  syncedStarter: number;
  recountedQuestions: number;
  stripeSynced: number;
  errors: string[];
};

function countQuestionsInContentData(contents: QueryDocumentSnapshot[]): number {
  let n = 0;
  for (const doc of contents) {
    const data = doc.data();
    if (data.type !== "quiz") continue;
    if (data.status === "archived") continue;
    const questions = data.quiz?.questions;
    if (Array.isArray(questions)) n += questions.length;
  }
  return n;
}

export async function reconcileBillingState(
  db: Firestore,
  opts?: { recountQuestions?: boolean },
): Promise<ReconcileResult> {
  const result: ReconcileResult = {
    migratedIncluded: 0,
    syncedStarter: 0,
    recountedQuestions: 0,
    stripeSynced: 0,
    errors: [],
  };

  const includedSnap = await db.collection("workspaces").where("planId", "==", "included").get();
  for (const doc of includedSnap.docs) {
    try {
      await doc.ref.update({
        planId: "trial",
        accountPhase: "trial",
        updatedAt: new Date(),
      });
      result.migratedIncluded += 1;
    } catch (e) {
      result.errors.push(`migrate ${doc.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const usersSnap = await db.collection("users").where("appPurchase.status", "==", "active").get();
  for (const userDoc of usersSnap.docs) {
    const wsSnap = await db
      .collection("workspaces")
      .where("ownerId", "==", userDoc.id)
      .limit(1)
      .get();
    if (wsSnap.empty) continue;

    const wsDoc = wsSnap.docs[0];
    const ws = wsDoc.data();
    const planId = normalizePlanId(ws.planId);
    const needsStarter =
      planId === "trial" || ws.accountPhase === "trial" || ws.appPurchaseStatus !== "active";

    if (!needsStarter) continue;

    try {
      await applyStarterPurchase(db, userDoc.id, wsDoc.id, "reconcile");
      result.syncedStarter += 1;
    } catch (e) {
      result.errors.push(`starter ${wsDoc.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (opts?.recountQuestions) {
    const allWs = await db.collection("workspaces").get();
    for (const wsDoc of allWs.docs) {
      try {
        const contents = await wsDoc.ref.collection("contents").get();
        const count = countQuestionsInContentData(contents.docs);
        const current = Number(wsDoc.data().questionCount ?? 0);
        if (current !== count) {
          await wsDoc.ref.update({ questionCount: count, updatedAt: new Date() });
          result.recountedQuestions += 1;
        }
      } catch (e) {
        result.errors.push(`count ${wsDoc.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  if (process.env.STRIPE_SECRET_KEY?.trim()) {
    try {
      const stripe = getStripe();
      const allWs = await db.collection("workspaces").get();

      for (const wsDoc of allWs.docs) {
        const subId = String(wsDoc.data().stripeSubscriptionId ?? "");
        if (!subId) continue;
        const tierId = normalizePlanId(wsDoc.data().planId);
        if (tierId !== "s" && tierId !== "m" && tierId !== "l") continue;

        try {
          const sub = await stripe.subscriptions.retrieve(subId);
          if (sub.status === "active" || sub.status === "trialing") {
            await applySubscriptionTier(db, wsDoc.id, tierId, {
              subscriptionId: sub.id,
              customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
              status: "active",
            });
          } else if (sub.status === "past_due" || sub.status === "unpaid") {
            await wsDoc.ref.update({ subscriptionStatus: "past_due", updatedAt: new Date() });
          } else if (sub.status === "canceled") {
            await applySubscriptionTier(db, wsDoc.id, tierId, { status: "canceled" });
          }
          result.stripeSynced += 1;
        } catch (e) {
          result.errors.push(`stripe ${wsDoc.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      result.errors.push(`stripe init: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}
