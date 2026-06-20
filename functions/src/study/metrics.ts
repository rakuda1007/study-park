import type { Firestore } from "firebase-admin/firestore";
import { STUDY_ACTIVE_PLAN_LIMIT } from "./config";

export type StudyPlanMetrics = {
  at: string;
  counts: {
    active: number;
    completed: number;
    archived: number;
    total: number;
  };
  usersAtActiveLimit: number;
  usersNearActiveLimit: number;
  topActiveUsers: Array<{ userId: string; activeCount: number }>;
};

const NEAR_LIMIT_THRESHOLD = 45;

async function countByStatus(
  db: Firestore,
  status: "active" | "completed" | "archived",
): Promise<number> {
  const snap = await db
    .collectionGroup("studyPlans")
    .where("status", "==", status)
    .count()
    .get();
  return snap.data().count;
}

/** アクティブ計画をユーザーごとに集計（上限監視用） */
async function countActivePlansByUser(
  db: Firestore,
): Promise<Map<string, number>> {
  const snap = await db
    .collectionGroup("studyPlans")
    .where("status", "==", "active")
    .select()
    .get();

  const byUser = new Map<string, number>();
  for (const doc of snap.docs) {
    const userId = doc.ref.parent.parent?.id;
    if (!userId) continue;
    byUser.set(userId, (byUser.get(userId) ?? 0) + 1);
  }
  return byUser;
}

export async function collectStudyPlanMetrics(db: Firestore): Promise<StudyPlanMetrics> {
  const [active, completed, archived, byUser] = await Promise.all([
    countByStatus(db, "active"),
    countByStatus(db, "completed"),
    countByStatus(db, "archived"),
    countActivePlansByUser(db),
  ]);

  let usersAtActiveLimit = 0;
  let usersNearActiveLimit = 0;
  const topActiveUsers: Array<{ userId: string; activeCount: number }> = [];

  for (const [userId, activeCount] of byUser) {
    if (activeCount >= STUDY_ACTIVE_PLAN_LIMIT) usersAtActiveLimit += 1;
    if (activeCount >= NEAR_LIMIT_THRESHOLD) usersNearActiveLimit += 1;
    topActiveUsers.push({ userId, activeCount });
  }

  topActiveUsers.sort((a, b) => b.activeCount - a.activeCount);

  return {
    at: new Date().toISOString(),
    counts: {
      active,
      completed,
      archived,
      total: active + completed + archived,
    },
    usersAtActiveLimit,
    usersNearActiveLimit,
    topActiveUsers: topActiveUsers.slice(0, 10),
  };
}

export function logStudyPlanMetrics(metrics: StudyPlanMetrics): void {
  console.info("[studyPlanMetrics]", JSON.stringify(metrics));
}
