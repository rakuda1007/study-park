"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getBillingTier, limitsFromTier } from "@/lib/billing/tiers";
import { getFirestoreClient } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/users/firestore";
import type { AppPurchaseStatus } from "@/lib/billing/types";
import { syncWorkspaceAdFlag } from "./ad-flags";
import { generateInviteCode, isValidWorkspaceSlug, normalizeWorkspaceSlug } from "./slug";
import type { WorkspaceDoc } from "./types";

function tsToIso(v: unknown): string {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as Timestamp).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

function mapWorkspace(id: string, data: Record<string, unknown>): WorkspaceDoc {
  return {
    id,
    ownerId: String(data.ownerId ?? ""),
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    inviteCode: String(data.inviteCode ?? ""),
    planId: (data.planId as WorkspaceDoc["planId"]) ?? "included",
    subscriptionStatus: (data.subscriptionStatus as WorkspaceDoc["subscriptionStatus"]) ?? "none",
    storageBytesUsed: Number(data.storageBytesUsed ?? 0),
    storageBytesLimit: Number(data.storageBytesLimit ?? 0),
    questionCount: Number(data.questionCount ?? 0),
    questionCountLimit: Number(data.questionCountLimit ?? 0),
    appPurchaseStatus: (data.appPurchaseStatus as AppPurchaseStatus) ?? "none",
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export async function getWorkspace(workspaceId: string): Promise<WorkspaceDoc | null> {
  const snap = await getDoc(doc(getFirestoreClient(), "workspaces", workspaceId));
  if (!snap.exists()) return null;
  return mapWorkspace(snap.id, snap.data());
}

export async function getWorkspaceBySlug(slug: string): Promise<WorkspaceDoc | null> {
  const normalized = normalizeWorkspaceSlug(slug);
  const snap = await getDocs(
    query(collection(getFirestoreClient(), "workspaces"), where("slug", "==", normalized)),
  );
  const d = snap.docs[0];
  if (!d) return null;
  return mapWorkspace(d.id, d.data());
}

export async function getWorkspaceByOwner(ownerId: string): Promise<WorkspaceDoc | null> {
  const snap = await getDocs(
    query(collection(getFirestoreClient(), "workspaces"), where("ownerId", "==", ownerId)),
  );
  const d = snap.docs[0];
  if (!d) return null;
  return mapWorkspace(d.id, d.data());
}

export async function isWorkspaceSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const normalized = normalizeWorkspaceSlug(slug);
  const snap = await getDocs(
    query(collection(getFirestoreClient(), "workspaces"), where("slug", "==", normalized)),
  );
  return snap.docs.some((d) => d.id !== excludeId);
}

/** クリエイター登録時にワークスペースを1件作成 */
export async function createWorkspaceForCreator(
  ownerId: string,
  name: string,
  slugInput: string,
): Promise<WorkspaceDoc> {
  const slug = normalizeWorkspaceSlug(slugInput);
  if (!isValidWorkspaceSlug(slug)) {
    throw new Error("ワークスペース URL 用の ID は英小文字・数字・ハイフン（2〜40文字）で指定してください。");
  }
  if (await isWorkspaceSlugTaken(slug)) {
    throw new Error("この URL ID は既に使われています。別の ID を選んでください。");
  }

  const existing = await getWorkspaceByOwner(ownerId);
  if (existing) return existing;

  const user = await getUserProfile(ownerId);
  const purchaseStatus = user?.appPurchase.status ?? "none";
  const tier = await getBillingTier("included");
  const limits = limitsFromTier(tier);

  const ref = doc(collection(getFirestoreClient(), "workspaces"));
  const payload = {
    ownerId,
    name: name.trim() || "マイ教材",
    slug,
    inviteCode: generateInviteCode(),
    planId: limits.planId,
    subscriptionStatus: "none",
    storageBytesUsed: 0,
    storageBytesLimit: limits.storageBytesLimit,
    questionCount: 0,
    questionCountLimit: limits.questionCountLimit,
    appPurchaseStatus: purchaseStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  await setDoc(doc(getFirestoreClient(), "workspaceInviteCodes", payload.inviteCode), {
    workspaceId: ref.id,
    ownerId,
  });
  await syncWorkspaceAdFlag(ref.id, limits.planId);
  const snap = await getDoc(ref);
  return mapWorkspace(ref.id, snap.data() ?? payload);
}

export async function syncWorkspacePurchaseStatus(
  workspaceId: string,
  appPurchaseStatus: AppPurchaseStatus,
): Promise<void> {
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId), {
    appPurchaseStatus,
    updatedAt: serverTimestamp(),
  });
}

/** プラン変更時に上限をティアから再適用（個別上書きは将来 admin 用） */
export async function applyBillingTierToWorkspace(
  workspaceId: string,
  tierId: WorkspaceDoc["planId"],
): Promise<void> {
  const tier = await getBillingTier(tierId);
  const limits = limitsFromTier(tier);
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId), {
    planId: limits.planId,
    storageBytesLimit: limits.storageBytesLimit,
    questionCountLimit: limits.questionCountLimit,
    updatedAt: serverTimestamp(),
  });
  await syncWorkspaceAdFlag(workspaceId, tierId);
}

export async function updateWorkspaceUsageCounts(
  workspaceId: string,
  counts: { questionCount?: number; storageBytesUsed?: number },
): Promise<void> {
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (counts.questionCount !== undefined) patch.questionCount = counts.questionCount;
  if (counts.storageBytesUsed !== undefined) patch.storageBytesUsed = counts.storageBytesUsed;
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId), patch);
}

export async function updateWorkspaceMeta(
  workspaceId: string,
  patch: { name?: string },
): Promise<void> {
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
