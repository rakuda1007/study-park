"use client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { ContentDoc, ContentStatus } from "@/lib/content/types";
import { getFirestoreClient } from "@/lib/firebase/client";
import { ensureWorkspaceSubjects, listWorkspaceContents } from "./content-firestore";
import { getWorkspaceByOwner } from "./firestore";
import { publishWorkspaceSubjectForContent } from "./subjects-firestore";
import type { ContentVisibility } from "./types";

/** 教室用同期時: 管理側の下書き化で教室の公開まで消さない */
function resolveWorkspacePublishState(
  c: ContentDoc,
  existing: Record<string, unknown> | undefined,
): { status: ContentStatus; ready: boolean } {
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
    periodYear: c.periodYear,
    periodMonth: c.periodMonth,
    pinned: c.pinned === true,
    updatedBy,
    lesson: c.lesson ?? null,
    quiz: c.quiz ?? null,
    createdAt: c.createdAt,
    updatedAt: serverTimestamp(),
    publishedAt: c.publishedAt ?? null,
    migratedFrom: `contents/${c.id}`,
  };
}

/** 管理用 contents を学習者向けワークスペースへ upsert */
export async function upsertAdminContentInWorkspace(
  workspaceId: string,
  c: ContentDoc,
  updatedBy: string,
  options?: { visibility?: ContentVisibility },
): Promise<"created" | "updated"> {
  await ensureWorkspaceSubjects(workspaceId);
  const visibility = options?.visibility ?? "members";
  const items = await listWorkspaceContents(workspaceId);
  const existing = items.find(
    (item) => item.migratedFrom === `contents/${c.id}` || item.slug === c.slug,
  );
  const publish = resolveWorkspacePublishState(
    c,
    existing
      ? {
          status: existing.status,
          ready: existing.ready,
          migratedFrom: existing.migratedFrom,
        }
      : undefined,
  );
  const docId = existing?.id ?? c.id;
  await setDoc(
    doc(getFirestoreClient(), "workspaces", workspaceId, "contents", docId),
    contentToWorkspacePayload(c, visibility, updatedBy, publish),
  );
  if (publish.status === "published") {
    await publishWorkspaceSubjectForContent(workspaceId, c.subjectId);
  }
  return existing ? "updated" : "created";
}

/** 管理者の保存内容を招待用ワークスペースへ反映（学習者ホーム用） */
export async function syncAdminContentToInvitationWorkspace(
  c: ContentDoc,
  updatedBy: string,
): Promise<boolean> {
  const ws = await getWorkspaceByOwner(updatedBy);
  if (!ws) return false;
  await upsertAdminContentInWorkspace(ws.id, c, updatedBy);
  return true;
}
