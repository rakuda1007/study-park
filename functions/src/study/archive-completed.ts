import type { Firestore, Timestamp } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  STUDY_ARCHIVE_BATCH_SIZE,
  STUDY_COMPLETED_ARCHIVE_AFTER_DAYS,
} from "./config";

export type ArchiveCompletedPlansResult = {
  scanned: number;
  archived: number;
  dryRun: boolean;
};

function resolveCompletedAt(data: Record<string, unknown>): Date | null {
  const completedAt = data.completedAt as Timestamp | undefined;
  if (completedAt?.toDate) return completedAt.toDate();
  const updatedAt = data.updatedAt as Timestamp | undefined;
  if (updatedAt?.toDate) return updatedAt.toDate();
  return null;
}

export async function archiveOldCompletedStudyPlans(
  db: Firestore,
  opts?: { dryRun?: boolean; now?: Date },
): Promise<ArchiveCompletedPlansResult> {
  const dryRun = opts?.dryRun === true;
  const now = opts?.now ?? new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - STUDY_COMPLETED_ARCHIVE_AFTER_DAYS);

  const snap = await db
    .collectionGroup("studyPlans")
    .where("status", "==", "completed")
    .where("updatedAt", "<", cutoff)
    .limit(STUDY_ARCHIVE_BATCH_SIZE)
    .get();

  let archived = 0;
  let batch = db.batch();
  let batchCount = 0;

  async function commitBatchIfNeeded(force = false): Promise<void> {
    if (batchCount === 0) return;
    if (!force && batchCount < 400) return;
    if (dryRun) {
      batchCount = 0;
      return;
    }
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  }

  for (const doc of snap.docs) {
    const data = doc.data();
    const completedAt = resolveCompletedAt(data);
    if (!completedAt || completedAt >= cutoff) continue;

    archived += 1;
    if (dryRun) continue;

    batch.update(doc.ref, {
      status: "archived",
      archivedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batchCount += 1;
    await commitBatchIfNeeded();
  }

  await commitBatchIfNeeded(true);

  return { scanned: snap.size, archived, dryRun };
}
