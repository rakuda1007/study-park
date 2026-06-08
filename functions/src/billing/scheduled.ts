import type { Firestore } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firestore-admin";
import { processTrialNotifications } from "./notifications";
import { purgeExpiredTrialWorkspaces } from "./purge-workspace";
import { reconcileBillingState } from "./reconcile";

export async function runBillingTrialNotifications(opts?: {
  dryRun?: boolean;
  now?: Date;
}): Promise<ReturnType<typeof processTrialNotifications>> {
  const db = getAdminFirestore();
  return processTrialNotifications(db, opts);
}

export async function runBillingPurgeExpiredTrials(opts?: {
  dryRun?: boolean;
  now?: Date;
}): Promise<ReturnType<typeof purgeExpiredTrialWorkspaces>> {
  const db = getAdminFirestore();
  return purgeExpiredTrialWorkspaces(db, opts);
}

export async function runBillingReconcile(opts?: {
  recountQuestions?: boolean;
}): Promise<ReturnType<typeof reconcileBillingState>> {
  const db = getAdminFirestore();
  return reconcileBillingState(db, opts);
}

/** HTTP 手動実行用（管理者トークン必須） */
export async function runBillingOps(
  db: Firestore,
  action: "notify" | "purge" | "reconcile",
  opts?: { dryRun?: boolean; recountQuestions?: boolean },
): Promise<unknown> {
  switch (action) {
    case "notify":
      return processTrialNotifications(db, { dryRun: opts?.dryRun });
    case "purge":
      return purgeExpiredTrialWorkspaces(db, { dryRun: opts?.dryRun });
    case "reconcile":
      return reconcileBillingState(db, { recountQuestions: opts?.recountQuestions });
  }
}
