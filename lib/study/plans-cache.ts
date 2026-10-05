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
  const idx = cache.entry.plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    const next = cache.entry.plans.slice();
    next[idx] = plan;
    cache.entry.plans = next;
    return;
  }
  cache.entry.plans = [...cache.entry.plans, plan];
}

export function getCachedStudyPlan(
  userId: string,
  planId: string,
): StudyPlanWithItems | null {
  return getCachedStudyPlans(userId)?.find((p) => p.id === planId) ?? null;
}
