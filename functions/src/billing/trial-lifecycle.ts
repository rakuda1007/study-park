import type { Timestamp } from "firebase-admin/firestore";
import { TRIAL_GRACE_DAYS } from "./constants";
import { normalizePlanId } from "./types";

export type TrialLifecyclePhase = "active" | "grace" | "deletion_due" | "not_applicable";

export type WorkspaceTrialInput = {
  planId?: string | null;
  accountPhase?: string | null;
  appPurchaseStatus?: string | null;
  trialEndsAt?: Timestamp | string | null;
};

function parseDate(value: Timestamp | string | null | undefined): Date | null {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value.toDate === "function") return value.toDate();
  return null;
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function isTrialWorkspace(data: WorkspaceTrialInput): boolean {
  const planId = normalizePlanId(data.planId ?? undefined);
  if (data.appPurchaseStatus === "active") return false;
  return planId === "trial" || data.accountPhase === "trial";
}

export function getTrialLifecycle(
  data: WorkspaceTrialInput,
  now = new Date(),
): {
  phase: TrialLifecyclePhase;
  trialDaysRemaining: number | null;
  graceDaysRemaining: number | null;
  trialEnd: Date | null;
  graceEnd: Date | null;
} {
  if (!isTrialWorkspace(data)) {
    return {
      phase: "not_applicable",
      trialDaysRemaining: null,
      graceDaysRemaining: null,
      trialEnd: null,
      graceEnd: null,
    };
  }

  const trialEnd = parseDate(data.trialEndsAt ?? null);
  if (!trialEnd) {
    return {
      phase: "active",
      trialDaysRemaining: null,
      graceDaysRemaining: null,
      trialEnd: null,
      graceEnd: null,
    };
  }

  if (now <= trialEnd) {
    return {
      phase: "active",
      trialDaysRemaining: Math.max(0, daysBetween(now, trialEnd)),
      graceDaysRemaining: null,
      trialEnd,
      graceEnd: null,
    };
  }

  const graceEnd = new Date(trialEnd);
  graceEnd.setDate(graceEnd.getDate() + TRIAL_GRACE_DAYS);

  if (now <= graceEnd) {
    return {
      phase: "grace",
      trialDaysRemaining: 0,
      graceDaysRemaining: Math.max(0, daysBetween(now, graceEnd)),
      trialEnd,
      graceEnd,
    };
  }

  return {
    phase: "deletion_due",
    trialDaysRemaining: 0,
    graceDaysRemaining: 0,
    trialEnd,
    graceEnd,
  };
}

export function isDeletionDue(data: WorkspaceTrialInput, now = new Date()): boolean {
  return getTrialLifecycle(data, now).phase === "deletion_due";
}
