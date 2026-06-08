import { getStorage } from "firebase-admin/storage";
import type { Firestore, Query } from "firebase-admin/firestore";
import { isDeletionDue } from "./trial-lifecycle";

export type PurgeResult = {
  workspaceId: string;
  deleted: boolean;
  reason?: string;
};

async function deleteQueryBatch(
  db: Firestore,
  query: Query,
  batchSize = 200,
): Promise<number> {
  let deleted = 0;
  while (true) {
    const snap = await query.limit(batchSize).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      deleted += 1;
    }
    await batch.commit();
    if (snap.size < batchSize) break;
  }
  return deleted;
}

async function deleteStoragePrefix(bucketName: string, prefix: string): Promise<void> {
  const bucket = getStorage().bucket(bucketName);
  const [files] = await bucket.getFiles({ prefix });
  if (!files.length) return;
  await Promise.all(files.map((f) => f.delete().catch(() => undefined)));
}

export async function purgeWorkspace(
  db: Firestore,
  workspaceId: string,
  opts?: { storageBucket?: string },
): Promise<void> {
  const wsRef = db.collection("workspaces").doc(workspaceId);
  const wsSnap = await wsRef.get();
  if (!wsSnap.exists) return;

  const data = wsSnap.data() ?? {};
  const slug = String(data.slug ?? "");
  const inviteCode = String(data.inviteCode ?? "");

  const bucket =
    opts?.storageBucket ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "";

  if (bucket) {
    await deleteStoragePrefix(bucket, `workspaces/${workspaceId}/`);
  }

  await deleteQueryBatch(
    db,
    db.collection("workspaceMembers").where("workspaceId", "==", workspaceId),
  );

  if (slug) {
    await db.collection("workspaceSlugs").doc(slug).delete().catch(() => undefined);
  }
  if (inviteCode) {
    await db.collection("workspaceInviteCodes").doc(inviteCode).delete().catch(() => undefined);
  }
  await db.collection("workspaceAdFlags").doc(workspaceId).delete().catch(() => undefined);

  await db.recursiveDelete(wsRef);
}

export async function purgeExpiredTrialWorkspaces(
  db: Firestore,
  opts?: { dryRun?: boolean; storageBucket?: string; now?: Date },
): Promise<{ scanned: number; candidates: PurgeResult[]; deleted: string[] }> {
  const now = opts?.now ?? new Date();
  const dryRun = opts?.dryRun ?? false;
  const snap = await db.collection("workspaces").get();
  const candidates: PurgeResult[] = [];
  const deleted: string[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!isDeletionDue(data, now)) continue;
    candidates.push({ workspaceId: doc.id, deleted: false });
    if (dryRun) continue;
    await purgeWorkspace(db, doc.id, { storageBucket: opts?.storageBucket });
    deleted.push(doc.id);
    const last = candidates[candidates.length - 1];
    if (last) last.deleted = true;
  }

  return { scanned: snap.size, candidates, deleted };
}
