import { TRIAL_GRACE_DAYS } from "./constants";
import type { WorkspaceDoc } from "@/lib/workspaces/types";

export type TrialLifecyclePhase =
  | "active"
  | "expired"
  | "grace"
  | "deletion_due"
  | "not_applicable";

export type WorkspaceWriteBlockReason =
  | "trial_expired"
  | "trial_grace_readonly"
  | "questions_limit"
  | "storage_limit"
  | "subscription_past_due";

export type WorkspaceAccessState = {
  canCreateContent: boolean;
  canEditContent: boolean;
  trialPhase: TrialLifecyclePhase;
  trialDaysRemaining: number | null;
  graceDaysRemaining: number | null;
  isAtUsageWarning: boolean;
  writeBlockReason: WorkspaceWriteBlockReason | null;
};

function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/** お試し WS の期限・猶予フェーズ */
export function getTrialLifecycle(ws: WorkspaceDoc, now = new Date()): {
  phase: TrialLifecyclePhase;
  trialDaysRemaining: number | null;
  graceDaysRemaining: number | null;
} {
  if (ws.planId !== "trial" && ws.accountPhase !== "trial") {
    return { phase: "not_applicable", trialDaysRemaining: null, graceDaysRemaining: null };
  }
  if (ws.appPurchaseStatus === "active") {
    return { phase: "not_applicable", trialDaysRemaining: null, graceDaysRemaining: null };
  }

  const trialEnd = parseDate(ws.trialEndsAt);
  if (!trialEnd) {
    return { phase: "active", trialDaysRemaining: null, graceDaysRemaining: null };
  }

  if (now <= trialEnd) {
    return {
      phase: "active",
      trialDaysRemaining: Math.max(0, daysBetween(now, trialEnd)),
      graceDaysRemaining: null,
    };
  }

  const graceEnd = new Date(trialEnd);
  graceEnd.setDate(graceEnd.getDate() + TRIAL_GRACE_DAYS);

  if (now <= graceEnd) {
    return {
      phase: "grace",
      trialDaysRemaining: 0,
      graceDaysRemaining: Math.max(0, daysBetween(now, graceEnd)),
    };
  }

  return {
    phase: "deletion_due",
    trialDaysRemaining: 0,
    graceDaysRemaining: 0,
  };
}

export function isUsageAtWarning(ws: WorkspaceDoc): boolean {
  const storagePct = ws.storageBytesLimit > 0 ? (ws.storageBytesUsed / ws.storageBytesLimit) * 100 : 0;
  const questionPct =
    ws.questionCountLimit > 0 ? (ws.questionCount / ws.questionCountLimit) * 100 : 0;
  return storagePct >= 80 || questionPct >= 80;
}

export function getWorkspaceAccessState(ws: WorkspaceDoc, now = new Date()): WorkspaceAccessState {
  const trial = getTrialLifecycle(ws, now);

  if (ws.subscriptionStatus === "past_due") {
    return {
      canCreateContent: false,
      canEditContent: false,
      trialPhase: trial.phase,
      trialDaysRemaining: trial.trialDaysRemaining,
      graceDaysRemaining: trial.graceDaysRemaining,
      isAtUsageWarning: isUsageAtWarning(ws),
      writeBlockReason: "subscription_past_due",
    };
  }

  if (trial.phase === "deletion_due") {
    return {
      canCreateContent: false,
      canEditContent: false,
      trialPhase: trial.phase,
      trialDaysRemaining: trial.trialDaysRemaining,
      graceDaysRemaining: trial.graceDaysRemaining,
      isAtUsageWarning: isUsageAtWarning(ws),
      writeBlockReason: "trial_expired",
    };
  }

  if (trial.phase === "grace" || trial.phase === "expired") {
    return {
      canCreateContent: false,
      canEditContent: false,
      trialPhase: trial.phase,
      trialDaysRemaining: trial.trialDaysRemaining,
      graceDaysRemaining: trial.graceDaysRemaining,
      isAtUsageWarning: isUsageAtWarning(ws),
      writeBlockReason: "trial_grace_readonly",
    };
  }

  if (ws.questionCount >= ws.questionCountLimit) {
    return {
      canCreateContent: false,
      canEditContent: ws.planId !== "trial",
      trialPhase: trial.phase,
      trialDaysRemaining: trial.trialDaysRemaining,
      graceDaysRemaining: trial.graceDaysRemaining,
      isAtUsageWarning: true,
      writeBlockReason: "questions_limit",
    };
  }

  return {
    canCreateContent: true,
    canEditContent: true,
    trialPhase: trial.phase,
    trialDaysRemaining: trial.trialDaysRemaining,
    graceDaysRemaining: trial.graceDaysRemaining,
    isAtUsageWarning: isUsageAtWarning(ws),
    writeBlockReason: null,
  };
}

export function workspaceWriteBlockMessage(reason: WorkspaceWriteBlockReason): string {
  switch (reason) {
    case "trial_expired":
      return "お試し期間と猶予期間が終了しました。スターター（¥980）に登録するか、お問い合わせください。";
    case "trial_grace_readonly":
      return "お試し期間が終了しました。スターター（¥980）に登録すると、引き続き編集・追加ができます。";
    case "questions_limit":
      return "登録問題数の上限に達しています。スターターまたは月額プランへのアップグレードが必要です。";
    case "storage_limit":
      return "ストレージの上限に達しています。スターターまたは月額プランへのアップグレードが必要です。";
    case "subscription_past_due":
      return "月額プランのお支払いが確認できません。お支払い方法をご確認ください。";
  }
}
