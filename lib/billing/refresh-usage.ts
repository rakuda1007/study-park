"use client";

import { countQuestionsInContents } from "./usage";
import { getWorkspace, updateWorkspaceUsageCounts } from "@/lib/workspaces/firestore";
import { listWorkspaceContents } from "@/lib/workspaces/content-firestore";

/** 問題数をコンテンツから再集計して WS に反映 */
export async function refreshWorkspaceQuestionCount(workspaceId: string): Promise<number> {
  const items = await listWorkspaceContents(workspaceId);
  const count = countQuestionsInContents(items);
  await updateWorkspaceUsageCounts(workspaceId, { questionCount: count });
  return count;
}

/** ダッシュボード表示用: 問題数を同期して最新 WS を返す */
export async function refreshWorkspaceUsageSnapshot(workspaceId: string) {
  const count = await refreshWorkspaceQuestionCount(workspaceId);
  const ws = await getWorkspace(workspaceId);
  if (!ws) return null;
  return { ...ws, questionCount: count };
}
