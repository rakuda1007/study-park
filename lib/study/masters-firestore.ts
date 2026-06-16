"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { StudyItemMasterDoc, StudyItemMasterInput } from "./types";

function tsToIso(v: unknown): string {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as Timestamp).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

function mastersCol(userId: string) {
  return collection(getFirestoreClient(), "users", userId, "studyItemMasters");
}

function mapMaster(id: string, data: Record<string, unknown>): StudyItemMasterDoc {
  return {
    id,
    subjectId: String(data.subjectId ?? ""),
    subjectName: data.subjectName ? String(data.subjectName) : undefined,
    name: String(data.name ?? ""),
    defaultUnit: data.defaultUnit ? String(data.defaultUnit) : undefined,
    order: Number(data.order ?? 0),
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export async function listStudyItemMasters(userId: string): Promise<StudyItemMasterDoc[]> {
  const snap = await getDocs(query(mastersCol(userId), orderBy("order", "asc")));
  return snap.docs.map((d) => mapMaster(d.id, d.data()));
}

export function filterMastersForSubject(
  masters: StudyItemMasterDoc[],
  subjectId: string,
): StudyItemMasterDoc[] {
  return masters.filter((m) => !m.subjectId || m.subjectId === subjectId);
}

export async function createStudyItemMaster(
  userId: string,
  input: StudyItemMasterInput,
): Promise<string> {
  const existing = await listStudyItemMasters(userId);
  const ref = await addDoc(mastersCol(userId), {
    subjectId: input.subjectId.trim(),
    subjectName: input.subjectName?.trim() || null,
    name: input.name.trim(),
    defaultUnit: input.defaultUnit?.trim() || null,
    order: input.order ?? existing.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStudyItemMaster(
  userId: string,
  masterId: string,
  patch: Partial<StudyItemMasterInput>,
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.subjectId !== undefined) data.subjectId = patch.subjectId.trim();
  if (patch.subjectName !== undefined) data.subjectName = patch.subjectName.trim() || null;
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.defaultUnit !== undefined) data.defaultUnit = patch.defaultUnit.trim() || null;
  if (patch.order !== undefined) data.order = patch.order;
  await updateDoc(
    doc(getFirestoreClient(), "users", userId, "studyItemMasters", masterId),
    data,
  );
}

export async function deleteStudyItemMaster(userId: string, masterId: string): Promise<void> {
  await deleteDoc(doc(getFirestoreClient(), "users", userId, "studyItemMasters", masterId));
}
