"use client";

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { listContents } from "@/lib/content/firestore";
import type { ContentDoc, ContentStatus } from "@/lib/content/types";
import { getFirestoreClient } from "@/lib/firebase/client";
import {
  createUserProfile,
  getUserProfile,
  updateUserAppPurchase,
} from "@/lib/users/firestore";
import {
  createWorkspaceForCreator,
  getWorkspaceByOwner,
  syncWorkspacePurchaseStatus,
} from "./firestore";
import { ensureWorkspaceSubjects, listWorkspaceContents } from "./content-firestore";
import { countQuestionsInContents } from "@/lib/billing/usage";
import type { ContentVisibility } from "./types";
import type { WorkspaceDoc } from "./types";

export type MigrateResult = {
  copied: number;
  updated: number;
  archived: number;
};

/** 教室用同期時: 管理側の下書き化（旧URL停止）で教室の公開まで消さない */
function resolveWorkspacePublishState(
  c: ContentDoc,
  existing: Record<string, unknown> | undefined,
  archiveOriginal: boolean,
): { status: ContentStatus; ready: boolean } {
  if (archiveOriginal) {
    return { status: c.status, ready: c.ready };
  }
  if (existing) {
    const wsStatus = String(existing.status ?? "draft");
    const wsReady = Boolean(existing.ready);
    if (c.status === "published") {
      return { status: "published", ready: c.ready };
    }
    if (wsStatus === "published") {
      return { status: "published", ready: wsReady };
    }
    if (existing.migratedFrom) {
      return { status: "published", ready: true };
    }
  }
  return { status: c.status, ready: c.ready };
}

function contentToWorkspacePayload(
  c: ContentDoc,
  visibility: ContentVisibility,
  updatedBy: string,
  publish: { status: ContentStatus; ready: boolean },
) {
  return {
    subjectId: c.subjectId,
    type: c.type,
    slug: c.slug,
    title: c.title,
    status: publish.status,
    order: c.order,
    ready: publish.ready,
    visibility,
    intro: c.intro ?? "",
    updatedBy,
    lesson: c.lesson ?? null,
    quiz: c.quiz ?? null,
    createdAt: c.createdAt,
    updatedAt: serverTimestamp(),
    publishedAt: c.publishedAt ?? null,
    migratedFrom: `contents/${c.id}`,
  };
}

/** 管理者アカウントにクリエイター用プロフィールと WS を用意 */
export async function ensureInvitationSetup(
  uid: string,
  email: string,
  opts?: { workspaceName?: string; workspaceSlug?: string },
): Promise<WorkspaceDoc> {
  let profile = await getUserProfile(uid);
  if (!profile) {
    profile = await createUserProfile(uid, email, "creator");
  }
  await updateUserAppPurchase(uid, "active", { provider: "admin" });

  let ws = await getWorkspaceByOwner(uid);
  if (!ws) {
    ws = await createWorkspaceForCreator(
      uid,
      opts?.workspaceName ?? "Study Park 教材",
      opts?.workspaceSlug ?? "study-park",
    );
  }
  await syncWorkspacePurchaseStatus(ws.id, "active");
  await ensureWorkspaceSubjects(ws.id);
  return ws;
}

/** 管理用 contents → workspaces/{wsId}/contents へコピー */
export async function migrateAdminContentsToWorkspace(
  workspaceId: string,
  updatedBy: string,
  options?: { archiveOriginal?: boolean; visibility?: ContentVisibility },
): Promise<MigrateResult> {
  const visibility = options?.visibility ?? "members";
  const archiveOriginal = options?.archiveOriginal ?? true;
  const adminContents = await listContents();
  const wsCol = collection(getFirestoreClient(), "workspaces", workspaceId, "contents");

  const existingSnap = await getDocs(wsCol);
  const existingBySlug = new Map(
    existingSnap.docs.map((d) => [String(d.data().slug ?? ""), { id: d.id, data: d.data() }] as const),
  );

  let copied = 0;
  let updated = 0;
  let archived = 0;

  for (const c of adminContents) {
    const existing = existingBySlug.get(c.slug);
    const publish = resolveWorkspacePublishState(c, existing?.data, archiveOriginal);
    if (existing) {
      await setDoc(
        doc(getFirestoreClient(), "workspaces", workspaceId, "contents", existing.id),
        contentToWorkspacePayload(c, visibility, updatedBy, publish),
      );
      updated += 1;
      if (archiveOriginal && c.status === "published") {
        await updateDoc(doc(getFirestoreClient(), "contents", c.id), {
          status: "draft",
          ready: false,
          updatedBy,
          updatedAt: serverTimestamp(),
        });
        archived += 1;
      }
      continue;
    }

    await setDoc(
      doc(getFirestoreClient(), "workspaces", workspaceId, "contents", c.id),
      contentToWorkspacePayload(c, visibility, updatedBy, publish),
    );
    existingBySlug.set(c.slug, { id: c.id, data: {} });
    copied += 1;

    if (archiveOriginal && c.status === "published") {
      await updateDoc(doc(getFirestoreClient(), "contents", c.id), {
        status: "draft",
        ready: false,
        updatedBy,
        updatedAt: serverTimestamp(),
      });
      archived += 1;
    }
  }

  const items = await listWorkspaceContents(workspaceId);
  const questionCount = countQuestionsInContents(items);
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId), {
    questionCount,
    updatedAt: serverTimestamp(),
  });

  return { copied, updated, archived };
}

/** ワークスペースが既にあるか */
export async function getAdminInvitationWorkspace(
  ownerId: string,
): Promise<WorkspaceDoc | null> {
  return getWorkspaceByOwner(ownerId);
}
