"use client";

import {
  getCachedStudyPlans,
  invalidateStudyPlansCache,
  setCachedStudyPlans,
} from "./plans-cache";
import {
  listStudyPlansWithItems,
  listStudyPlansWithItemsForWeek,
} from "./firestore";
import type { StudyPlanWithItems } from "./types";

function mergePlans(
  base: StudyPlanWithItems[],
  updates: StudyPlanWithItems[],
): StudyPlanWithItems[] {
  const byId = new Map(base.map((p) => [p.id, p]));
  for (const plan of updates) {
    byId.set(plan.id, plan);
  }
  return [...byId.values()].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function fetchAllStudyPlansCached(
  userId: string,
  options?: { force?: boolean },
): Promise<StudyPlanWithItems[]> {
  if (!options?.force) {
    const cached = getCachedStudyPlans(userId);
    if (cached) {
      return cached.filter((p) => p.status !== "archived");
    }
  }

  const plans = await listStudyPlansWithItems(userId);
  const active = plans.filter((p) => p.status !== "archived");
  setCachedStudyPlans(userId, active);
  return active;
}

export async function fetchWeekStudyPlansCached(
  userId: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<StudyPlanWithItems[]> {
  const weekPlans = await listStudyPlansWithItemsForWeek(userId, weekStart, weekEnd);
  const existing = getCachedStudyPlans(userId);
  if (existing) {
    setCachedStudyPlans(userId, mergePlans(existing, weekPlans));
  } else {
    setCachedStudyPlans(userId, weekPlans);
  }
  return weekPlans;
}

export { invalidateStudyPlansCache };
