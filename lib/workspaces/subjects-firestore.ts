"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { buildSubjectNameMap, subjectSortOrder } from "@/lib/content/subject-names";
import type { ContentManifest, SubjectDoc } from "@/lib/content/types";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { WorkspaceSubjectDoc, WorkspaceSubjectStatus } from "./types";

function contentsCol(workspaceId: string) {
  return collection(getFirestoreClient(), "workspaces", workspaceId, "contents");
}

function subjectsCol(workspaceId: string) {
  return collection(getFirestoreClient(), "workspaces", workspaceId, "subjects");
}

function mapSubject(id: string, data: Record<string, unknown>): WorkspaceSubjectDoc {
  const status = data.status === "published" ? "published" : "draft";
  return {
    id,
    name: String(data.name ?? id),
    order: Number(data.order ?? 999),
    status,
  };
}

export async function listWorkspaceSubjects(
  workspaceId: string,
): Promise<WorkspaceSubjectDoc[]> {
  const snap = await getDocs(subjectsCol(workspaceId));
  return snap.docs
    .map((d) => mapSubject(d.id, d.data()))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ja"));
}

export async function setWorkspaceSubjectStatus(
  workspaceId: string,
  subjectId: string,
  status: WorkspaceSubjectStatus,
): Promise<void> {
  const ref = doc(getFirestoreClient(), "workspaces", workspaceId, "subjects", subjectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("科目が見つかりません。教材を移行してから公開してください。");
  }
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

/** 教材の subjectId からワークスペース科目を同期（新規科目は公開教材があれば published） */
export async function syncWorkspaceSubjectsFromContents(
  workspaceId: string,
  manifest: ContentManifest,
  publicSubjects: SubjectDoc[],
): Promise<void> {
  const nameMap = buildSubjectNameMap(manifest, publicSubjects);
  const snap = await getDocs(query(contentsCol(workspaceId), orderBy("order", "asc")));
  const bySubject = new Map<string, { status: string }[]>();
  for (const d of snap.docs) {
    const data = d.data();
    const subjectId = String(data.subjectId ?? "");
    const list = bySubject.get(subjectId) ?? [];
    list.push({ status: String(data.status ?? "draft") });
    bySubject.set(subjectId, list);
  }

  for (const [subjectId, items] of bySubject) {
    const ref = doc(getFirestoreClient(), "workspaces", workspaceId, "subjects", subjectId);
    const snap = await getDoc(ref);
    const name = nameMap.get(subjectId) ?? subjectId;
    const order = subjectSortOrder(manifest, subjectId);
    const hasPublishedContent = items.some((c) => c.status === "published");

    if (!snap.exists()) {
      await setDoc(ref, {
        name,
        order,
        status: hasPublishedContent ? "published" : "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      continue;
    }

    await updateDoc(ref, {
      name,
      order,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function isWorkspaceSubjectPublished(
  workspaceId: string,
  subjectId: string,
): Promise<boolean> {
  const snap = await getDoc(
    doc(getFirestoreClient(), "workspaces", workspaceId, "subjects", subjectId),
  );
  if (!snap.exists()) return false;
  return snap.data()?.status === "published";
}
