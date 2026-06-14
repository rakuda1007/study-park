"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import { createWorkspaceForCreator, getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";
import { getUserProfile } from "./firestore";

export async function upgradeLearnerToCreator(
  uid: string,
  workspaceName: string,
): Promise<WorkspaceDoc> {
  const profile = await getUserProfile(uid);
  if (!profile) {
    throw new Error("プロフィールが見つかりません。ログインし直してください。");
  }

  if (profile.role === "creator") {
    const existing = await getWorkspaceByOwner(uid);
    if (existing) return existing;
    return createWorkspaceForCreator(uid, workspaceName.trim() || "マイ教材");
  }

  if (profile.role !== "learner") {
    throw new Error("この操作は学習者アカウント向けです。");
  }

  try {
    await updateDoc(doc(getFirestoreClient(), "users", uid), {
      role: "creator",
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "permission-denied") {
      throw new Error("クリエイターへの切り替え権限がありません。Firestore ルールを確認してください。");
    }
    throw e;
  }

  const name = workspaceName.trim() || "マイ教材";
  const existing = await getWorkspaceByOwner(uid);
  if (existing) return existing;
  return createWorkspaceForCreator(uid, name);
}
