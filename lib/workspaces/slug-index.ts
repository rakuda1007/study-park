"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import { normalizeWorkspaceSlug } from "./slug";
import type { WorkspaceDoc } from "./types";

/** URL 用 slug → workspaceId（他ユーザーの workspaces を読まずに重複チェック・解決） */
export async function isGlobalWorkspaceSlugTaken(
  slug: string,
  excludeWorkspaceId?: string,
): Promise<boolean> {
  const normalized = normalizeWorkspaceSlug(slug);
  const snap = await getDoc(doc(getFirestoreClient(), "workspaceSlugs", normalized));
  if (!snap.exists()) return false;
  const wsId = String(snap.data().workspaceId ?? "");
  return wsId.length > 0 && wsId !== excludeWorkspaceId;
}

export async function getWorkspaceIdBySlug(slug: string): Promise<string | null> {
  const normalized = normalizeWorkspaceSlug(slug);
  const snap = await getDoc(doc(getFirestoreClient(), "workspaceSlugs", normalized));
  if (!snap.exists()) return null;
  const wsId = String(snap.data().workspaceId ?? "");
  return wsId || null;
}

/** 既存 WS にインデックスが無い場合の移行用 */
export async function ensureWorkspaceSlugIndex(ws: WorkspaceDoc): Promise<void> {
  const normalized = normalizeWorkspaceSlug(ws.slug);
  if (!normalized) return;
  const ref = doc(getFirestoreClient(), "workspaceSlugs", normalized);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, { workspaceId: ws.id, ownerId: ws.ownerId });
}

export async function registerWorkspaceSlugIndex(
  slug: string,
  workspaceId: string,
  ownerId: string,
): Promise<void> {
  const normalized = normalizeWorkspaceSlug(slug);
  await setDoc(doc(getFirestoreClient(), "workspaceSlugs", normalized), {
    workspaceId,
    ownerId,
  });
}
