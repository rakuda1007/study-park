"use client";

import type { StudyPlanWithItems } from "./types";

const CACHE_TTL_MS = 45_000;

type CacheEntry = {
  plans: StudyPlanWithItems[];
  fetchedAt: number;
};

let cache: { userId: string; entry: CacheEntry } | null = null;

export function invalidateStudyPlansCache(userId?: string): void {
  if (!userId || cache?.userId === userId) {
    cache = null;
  }
}

export function getCachedStudyPlans(userId: string): StudyPlanWithItems[] | null {
  if (!cache || cache.userId !== userId) return null;
  if (Date.now() - cache.entry.fetchedAt > CACHE_TTL_MS) {
    cache = null;
    return null;
  }
  return cache.entry.plans;
}

export function setCachedStudyPlans(
  userId: string,
  plans: StudyPlanWithItems[],
): void {
  cache = {
    userId,
    entry: { plans, fetchedAt: Date.now() },
  };
}

export function patchCachedStudyPlan(
  userId: string,
  plan: StudyPlanWithItems,
): void {
  if (!cache || cache.userId !== userId) return;
  cache.entry.plans = cache.entry.plans.map((p) =>
    p.id === plan.id ? plan : p,
  );
}
