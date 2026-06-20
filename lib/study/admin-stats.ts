"use client";

import {
  collectionGroup,
  getCountFromServer,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import {
  STUDY_ACTIVE_PLAN_LIMIT,
  STUDY_ACTIVE_PLAN_WARN_THRESHOLD,
  STUDY_COMPLETED_ARCHIVE_AFTER_DAYS,
} from "./limits";
import type { StudyPlanStatus } from "./types";

export type StudyPlanAdminStats = {
  counts: Record<StudyPlanStatus, number>;
  total: number;
  usersAtActiveLimit: number;
  usersNearActiveLimit: number;
  topActiveUsers: Array<{ userId: string; activeCount: number }>;
  limits: {
    activePlanLimit: number;
    archiveAfterDays: number;
  };
};

async function countPlansByStatus(status: StudyPlanStatus): Promise<number> {
  const snap = await getCountFromServer(
    query(collectionGroup(getFirestoreClient(), "studyPlans"), where("status", "==", status)),
  );
  return snap.data().count;
}

async function countActivePlansByUser(): Promise<Map<string, number>> {
  const snap = await getDocs(
    query(
      collectionGroup(getFirestoreClient(), "studyPlans"),
      where("status", "==", "active"),
    ),
  );
  const byUser = new Map<string, number>();
  for (const doc of snap.docs) {
    const userId = doc.ref.parent.parent?.id;
    if (!userId) continue;
    byUser.set(userId, (byUser.get(userId) ?? 0) + 1);
  }
  return byUser;
}

export async function fetchStudyPlanAdminStats(): Promise<StudyPlanAdminStats> {
  const [active, completed, archived, byUser] = await Promise.all([
    countPlansByStatus("active"),
    countPlansByStatus("completed"),
    countPlansByStatus("archived"),
    countActivePlansByUser(),
  ]);

  let usersAtActiveLimit = 0;
  let usersNearActiveLimit = 0;
  const topActiveUsers: Array<{ userId: string; activeCount: number }> = [];

  for (const [userId, activeCount] of byUser) {
    if (activeCount >= STUDY_ACTIVE_PLAN_LIMIT) usersAtActiveLimit += 1;
    if (activeCount >= STUDY_ACTIVE_PLAN_WARN_THRESHOLD) usersNearActiveLimit += 1;
    topActiveUsers.push({ userId, activeCount });
  }

  topActiveUsers.sort((a, b) => b.activeCount - a.activeCount);

  return {
    counts: { active, completed, archived },
    total: active + completed + archived,
    usersAtActiveLimit,
    usersNearActiveLimit,
    topActiveUsers: topActiveUsers.slice(0, 10),
    limits: {
      activePlanLimit: STUDY_ACTIVE_PLAN_LIMIT,
      archiveAfterDays: STUDY_COMPLETED_ARCHIVE_AFTER_DAYS,
    },
  };
}
