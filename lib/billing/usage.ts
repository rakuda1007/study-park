import type { WorkspaceDoc } from "@/lib/workspaces/types";
import type { ContentDoc } from "@/lib/content/types";

export type UsageCheckAction = "add_question" | "upload_image";

export type UsageCheckResult =
  | { ok: true }
  | { ok: false; reason: string; code: "storage" | "questions" | "purchase" };

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
  opts?: { additionalBytes?: number; hasActivePurchase?: boolean },
): UsageCheckResult {
  const purchaseOk = opts?.hasActivePurchase ?? ws.appPurchaseStatus === "active";
  if (!purchaseOk) {
    return {
      ok: false,
      code: "purchase",
      reason: "クリエイター版（買い切り）の購入が必要です。決済連携準備中の場合は管理者にご連絡ください。",
    };
  }

  if (action === "add_question") {
    if (ws.questionCount >= ws.questionCountLimit) {
      return {
        ok: false,
        code: "questions",
        reason: `登録問題数の上限（${ws.questionCountLimit} 問）に達しています。プランをアップグレードしてください。`,
      };
    }
    return { ok: true };
  }

  const add = opts?.additionalBytes ?? 0;
  if (ws.storageBytesUsed + add > ws.storageBytesLimit) {
    return {
      ok: false,
      code: "storage",
      reason: `ストレージの上限（${formatBytes(ws.storageBytesLimit)}）を超えます。プランをアップグレードしてください。`,
    };
  }
  return { ok: true };
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
