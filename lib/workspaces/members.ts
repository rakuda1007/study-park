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
import { getFirestoreClient } from "@/lib/firebase/client";
import { getWorkspace, getWorkspaceBySlug } from "./firestore";
import { normalizeWorkspaceSlug } from "./slug";
import type { WorkspaceDoc } from "./types";
import type { WorkspaceMemberDoc } from "./types";

function tsToIso(v: unknown): string {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as Timestamp).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

function memberId(workspaceId: string, userId: string): string {
  return `${workspaceId}_${userId}`;
}

function mapMember(id: string, data: Record<string, unknown>): WorkspaceMemberDoc {
  return {
    id,
    workspaceId: String(data.workspaceId ?? ""),
    userId: String(data.userId ?? ""),
    role: "learner",
    status: data.status === "revoked" ? "revoked" : "active",
    invitedBy: String(data.invitedBy ?? ""),
    createdAt: tsToIso(data.createdAt),
  };
}

export async function listMembersForWorkspace(workspaceId: string): Promise<WorkspaceMemberDoc[]> {
  const snap = await getDocs(
    query(
      collection(getFirestoreClient(), "workspaceMembers"),
      where("workspaceId", "==", workspaceId),
      where("status", "==", "active"),
    ),
  );
  return snap.docs.map((d) => mapMember(d.id, d.data()));
}

export async function listWorkspacesForLearner(userId: string): Promise<WorkspaceMemberDoc[]> {
  const snap = await getDocs(
    query(
      collection(getFirestoreClient(), "workspaceMembers"),
      where("userId", "==", userId),
      where("status", "==", "active"),
    ),
  );
  return snap.docs.map((d) => mapMember(d.id, d.data()));
}

export async function isActiveMember(workspaceId: string, userId: string): Promise<boolean> {
  const snap = await getDoc(
    doc(getFirestoreClient(), "workspaceMembers", memberId(workspaceId, userId)),
  );
  return snap.exists() && snap.data()?.status === "active";
}

export async function joinWorkspaceByInviteCode(
  inviteCode: string,
  learnerUserId: string,
): Promise<{ workspaceId: string; workspaceName: string }> {
  const code = inviteCode.trim().toUpperCase();
  if (code.length < 6) {
    throw new Error("招待コードを入力してください。");
  }

  const inviteSnap = await getDoc(
    doc(getFirestoreClient(), "workspaceInviteCodes", code),
  );
  if (!inviteSnap.exists()) {
    throw new Error("招待コードが見つかりません。クリエイターに確認してください。");
  }
  const workspaceId = String(inviteSnap.data()?.workspaceId ?? "");
  const ownerId = String(inviteSnap.data()?.ownerId ?? "");
  if (!workspaceId) {
    throw new Error("招待コードが無効です。");
  }
  const ref = doc(getFirestoreClient(), "workspaceMembers", memberId(workspaceId, learnerUserId));

  await setDoc(ref, {
    workspaceId,
    userId: learnerUserId,
    role: "learner",
    status: "active",
    invitedBy: ownerId,
    createdAt: serverTimestamp(),
  });

  const workspace = await getWorkspace(workspaceId);
  return {
    workspaceId,
    workspaceName: workspace?.name ?? "教材",
  };
}

/**
 * URL の ws パラメータからワークスペースを解決する。
 * 学習者は workspaces を slug 検索できないため、参加中の教室からも探す。
 */
export async function resolveWorkspaceBySlug(
  workspaceSlug: string,
  userId?: string | null,
): Promise<WorkspaceDoc | null> {
  const normalized = normalizeWorkspaceSlug(workspaceSlug);
  const direct = await getWorkspaceBySlug(normalized);
  if (direct) return direct;
  if (!userId) return null;

  const memberships = await listWorkspacesForLearner(userId);
  for (const m of memberships) {
    const ws = await getWorkspace(m.workspaceId);
    if (ws && normalizeWorkspaceSlug(ws.slug) === normalized) return ws;
  }
  return null;
}

/** slug + uid でメンバー判定（プレイ画面用） */
export async function canLearnerAccessWorkspace(
  workspaceSlug: string,
  userId: string | null,
  visibility: string,
): Promise<boolean> {
  if (visibility === "unlisted" || visibility === "public") return true;
  if (visibility === "private") return false;
  if (!userId) return false;
  const ws = await resolveWorkspaceBySlug(workspaceSlug, userId);
  if (!ws) return false;
  if (ws.ownerId === userId) return true;
  return isActiveMember(ws.id, userId);
}
