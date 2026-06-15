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
  deleteDoc,
} from "firebase/firestore";
import { buildSubjectNameMap, subjectSortOrder } from "@/lib/content/subject-names";
import { DEFAULT_SUBJECTS } from "@/lib/content/subject-defaults";
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
    enabledInForm: data.enabledInForm === false ? false : true,
  };
}

function subjectsForForm(
  subjects: WorkspaceSubjectDoc[],
  currentSubjectId?: string,
): WorkspaceSubjectDoc[] {
  const enabled = subjects.filter((s) => s.enabledInForm !== false);
  if (!currentSubjectId || enabled.some((s) => s.id === currentSubjectId)) {
    return enabled;
  }
  const current = subjects.find((s) => s.id === currentSubjectId);
  return current ? [...enabled, current] : enabled;
}

export async function listWorkspaceSubjects(
  workspaceId: string,
): Promise<WorkspaceSubjectDoc[]> {
  const snap = await getDocs(subjectsCol(workspaceId));
  return snap.docs
    .map((d) => mapSubject(d.id, d.data()))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ja"));
}

/** コンテンツ作成フォーム用（表示ONの教科のみ。編集中の教科は常に含む） */
export async function listWorkspaceSubjectsForForm(
  workspaceId: string,
  currentSubjectId?: string,
): Promise<WorkspaceSubjectDoc[]> {
  const subjects = await listWorkspaceSubjects(workspaceId);
  return subjectsForForm(subjects, currentSubjectId);
}

export async function createWorkspaceSubject(
  workspaceId: string,
  input: { id: string; name: string; order?: number; enabledInForm?: boolean },
): Promise<void> {
  const ref = doc(getFirestoreClient(), "workspaces", workspaceId, "subjects", input.id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    throw new Error("この教科 ID は既に使われています。");
  }
  await setDoc(ref, {
    name: input.name.trim(),
    order: input.order ?? 999,
    status: "draft",
    enabledInForm: input.enabledInForm !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateWorkspaceSubject(
  workspaceId: string,
  subjectId: string,
  patch: { name?: string; order?: number; enabledInForm?: boolean },
): Promise<void> {
  const ref = doc(getFirestoreClient(), "workspaces", workspaceId, "subjects", subjectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("教科が見つかりません。");
  }
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.order !== undefined) data.order = patch.order;
  if (patch.enabledInForm !== undefined) data.enabledInForm = patch.enabledInForm;
  await updateDoc(ref, data);
}

export async function deleteWorkspaceSubject(
  workspaceId: string,
  subjectId: string,
): Promise<void> {
  const ref = doc(getFirestoreClient(), "workspaces", workspaceId, "subjects", subjectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const contentSnap = await getDocs(query(contentsCol(workspaceId), orderBy("order", "asc")));
  if (contentSnap.docs.some((d) => String(d.data().subjectId ?? "") === subjectId)) {
    throw new Error("この教科に紐づく教材があるため削除できません。");
  }
  await deleteDoc(ref);
}

/** ワークスペース内のデフォルト教科（算数・社会・理科）を用意 */
export async function ensureWorkspaceSubjects(workspaceId: string): Promise<void> {
  for (const s of DEFAULT_SUBJECTS) {
    const ref = doc(getFirestoreClient(), "workspaces", workspaceId, "subjects", s.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name: s.name,
        order: s.order,
        status: "published",
        enabledInForm: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

/** 教材を公開したとき、学習者ホームに出るよう教科も公開する */
export async function publishWorkspaceSubjectForContent(
  workspaceId: string,
  subjectId: string,
): Promise<void> {
  if (!subjectId) return;
  const ref = doc(getFirestoreClient(), "workspaces", workspaceId, "subjects", subjectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  if (snap.data()?.status === "published") return;
  await updateDoc(ref, { status: "published", updatedAt: serverTimestamp() });
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

    const patch: Record<string, unknown> = {
      name,
      order,
      updatedAt: serverTimestamp(),
    };
    if (snap.data()?.status !== "published" && hasPublishedContent) {
      patch.status = "published";
    }
    await updateDoc(ref, patch);
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
