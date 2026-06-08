/**
 * お試し満了 + 猶予終了のワークスペースを一覧（削除は --execute 時のみ）。
 *
 * 本番は Cloud Functions `billingPurgeExpiredTrials`（毎日 3:00 JST）が担当。
 *
 * 仕様: trialEndsAt + TRIAL_GRACE_DAYS（60日）経過、appPurchase 未購入
 *
 * 使い方:
 *   node scripts/purge-expired-trial-workspaces.mjs           # dry-run
 *   node scripts/purge-expired-trial-workspaces.mjs --execute # 要 Firebase Admin
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const TRIAL_GRACE_DAYS = 60;

function initAdmin() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
    return;
  }
  throw new Error("FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY が必要です。");
}

function normalizePlanId(planId) {
  return planId === "included" ? "trial" : planId || "trial";
}

function parseDate(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value.toDate === "function") return value.toDate();
  return null;
}

function isTrialWorkspace(data) {
  if (data.appPurchaseStatus === "active") return false;
  const planId = normalizePlanId(data.planId);
  return planId === "trial" || data.accountPhase === "trial";
}

function isDeletionDue(data, now = new Date()) {
  if (!isTrialWorkspace(data)) return false;
  const trialEnd = parseDate(data.trialEndsAt);
  if (!trialEnd || now <= trialEnd) return false;
  const graceEnd = new Date(trialEnd);
  graceEnd.setDate(graceEnd.getDate() + TRIAL_GRACE_DAYS);
  return now > graceEnd;
}

async function deleteQueryBatch(db, query, batchSize = 200) {
  let deleted = 0;
  while (true) {
    const snap = await query.limit(batchSize).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
    deleted += snap.size;
    if (snap.size < batchSize) break;
  }
  return deleted;
}

async function purgeWorkspace(db, workspaceId) {
  const wsRef = db.collection("workspaces").doc(workspaceId);
  const wsSnap = await wsRef.get();
  if (!wsSnap.exists) return;
  const data = wsSnap.data() ?? {};
  const slug = String(data.slug ?? "");
  const inviteCode = String(data.inviteCode ?? "");

  await deleteQueryBatch(
    db,
    db.collection("workspaceMembers").where("workspaceId", "==", workspaceId),
  );
  if (slug) await db.collection("workspaceSlugs").doc(slug).delete().catch(() => undefined);
  if (inviteCode) {
    await db.collection("workspaceInviteCodes").doc(inviteCode).delete().catch(() => undefined);
  }
  await db.collection("workspaceAdFlags").doc(workspaceId).delete().catch(() => undefined);
  await db.recursiveDelete(wsRef);
}

const execute = process.argv.includes("--execute");

async function main() {
  initAdmin();
  const db = getFirestore();
  const now = new Date();
  const snap = await db.collection("workspaces").get();
  const candidates = [];

  for (const doc of snap.docs) {
    if (!isDeletionDue(doc.data(), now)) continue;
    candidates.push({ workspaceId: doc.id, ownerId: doc.data().ownerId ?? "" });
  }

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        trialGraceDays: TRIAL_GRACE_DAYS,
        scanned: snap.size,
        candidates,
      },
      null,
      2,
    ),
  );

  if (!execute) {
    console.log("\n削除する場合: node scripts/purge-expired-trial-workspaces.mjs --execute");
    return;
  }

  for (const c of candidates) {
    await purgeWorkspace(db, c.workspaceId);
    console.log(`deleted: ${c.workspaceId}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
