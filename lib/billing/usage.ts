import type { WorkspaceDoc } from "@/lib/workspaces/types";
import type { ContentDoc } from "@/lib/content/types";
import {
  getWorkspaceAccessState,
  workspaceWriteBlockMessage,
  type WorkspaceWriteBlockReason,
} from "./workspace-access";

export type UsageCheckAction = "add_question" | "upload_image" | "create_content" | "edit_content";

export type UsageCheckResult =
  | { ok: true }
  | { ok: false; reason: string; code: WorkspaceWriteBlockReason | "storage" | "questions" };

export function countQuestionsInContents(contents: ContentDoc[]): number {
  let n = 0;
  for (const c of contents) {
    if (c.type !== "quiz" || !c.quiz?.questions) continue;
    if (c.status === "archived") continue;
    n += c.quiz.questions.length;
  }
  return n;
}

export function checkWorkspaceUsage(
  ws: WorkspaceDoc,
  action: UsageCheckAction,
  opts?: { additionalBytes?: number },
): UsageCheckResult {
  const access = getWorkspaceAccessState(ws);

  if (action === "create_content" && !access.canCreateContent) {
    const reason = access.writeBlockReason ?? "questions_limit";
    return { ok: false, code: reason, reason: formatBlockReason(ws, reason) };
  }

  if (action === "edit_content" && !access.canEditContent) {
    const reason = access.writeBlockReason ?? "trial_grace_readonly";
    return { ok: false, code: reason, reason: formatBlockReason(ws, reason) };
  }

  if (access.writeBlockReason === "subscription_past_due") {
    return {
      ok: false,
      code: "subscription_past_due",
      reason: formatBlockReason(ws, "subscription_past_due"),
    };
  }

  if (
    access.writeBlockReason === "trial_expired" ||
    access.writeBlockReason === "trial_grace_readonly"
  ) {
    return {
      ok: false,
      code: access.writeBlockReason,
      reason: formatBlockReason(ws, access.writeBlockReason),
    };
  }

  if (action === "add_question" || action === "create_content") {
    if (ws.questionCount >= ws.questionCountLimit) {
      return {
        ok: false,
        code: "questions",
        reason: `登録問題数の上限（${ws.questionCountLimit} 問）に達しています。プランをアップグレードしてください。`,
      };
    }
  }

  if (action === "upload_image") {
    const add = opts?.additionalBytes ?? 0;
    if (ws.storageBytesUsed + add > ws.storageBytesLimit) {
      return {
        ok: false,
        code: "storage",
        reason: `ストレージの上限（${formatBytes(ws.storageBytesLimit)}）を超えます。プランをアップグレードしてください。`,
      };
    }
  }

  return { ok: true };
}

function formatBlockReason(ws: WorkspaceDoc, reason: WorkspaceWriteBlockReason): string {
  if (reason === "questions_limit") {
    return `登録問題数の上限（${ws.questionCountLimit} 問）に達しています。スターターまたは月額プランへのアップグレードが必要です。`;
  }
  if (reason === "storage_limit") {
    return `ストレージの上限（${formatBytes(ws.storageBytesLimit)}）に達しています。スターターまたは月額プランへのアップグレードが必要です。`;
  }
  return workspaceWriteBlockMessage(reason);
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

export function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}
