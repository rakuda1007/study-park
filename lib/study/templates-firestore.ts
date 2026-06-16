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
import type {
  StudyItemDraft,
  StudyPlanWithItems,
  StudyTemplateDoc,
  StudyTemplateInput,
} from "./types";
import { parseStudyDate, formatStudyDate, todayStudyDate } from "./week";

function tsToIso(v: unknown): string {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as Timestamp).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

function templatesCol(userId: string) {
  return collection(getFirestoreClient(), "users", userId, "studyTemplates");
}

function mapContentRef(data: unknown): StudyItemDraft["contentRef"] | undefined {
  if (!data || typeof data !== "object") return undefined;
  const ref = data as Record<string, unknown>;
  if (!ref.workspaceId || !ref.contentId) return undefined;
  return {
    workspaceId: String(ref.workspaceId),
    workspaceSlug: String(ref.workspaceSlug ?? ""),
    contentId: String(ref.contentId),
    contentTitle: String(ref.contentTitle ?? ""),
    contentType: ref.contentType === "lesson" ? "lesson" : "quiz",
    contentSlug: String(ref.contentSlug ?? ""),
  };
}

function mapTemplateItem(data: unknown): StudyItemDraft | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const label = String(row.label ?? "").trim();
  if (!label) return null;
  const source = row.source === "app" ? "app" : "external";
  return {
    source,
    label,
    scopeNote: row.scopeNote ? String(row.scopeNote) : "",
    contentRef: source === "app" ? mapContentRef(row.contentRef) : undefined,
  };
}

function mapTemplate(id: string, data: Record<string, unknown>): StudyTemplateDoc {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems
    .map(mapTemplateItem)
    .filter((item): item is StudyItemDraft => item !== null);

  return {
    id,
    name: String(data.name ?? ""),
    subjectId: String(data.subjectId ?? ""),
    subjectName: String(data.subjectName ?? ""),
    memo: data.memo ? String(data.memo) : undefined,
    durationDays: Math.max(1, Number(data.durationDays ?? 7)),
    items,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export function planDurationDays(startDate: string, dueDate: string): number {
  const start = parseStudyDate(startDate);
  const due = parseStudyDate(dueDate);
  const diff = Math.round((due.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff + 1);
}

export function addDaysToStudyDate(isoDate: string, days: number): string {
  const d = parseStudyDate(isoDate);
  d.setDate(d.getDate() + days);
  return formatStudyDate(d);
}

export async function listStudyTemplates(userId: string): Promise<StudyTemplateDoc[]> {
  const snap = await getDocs(query(templatesCol(userId), orderBy("updatedAt", "desc")));
  return snap.docs.map((d) => mapTemplate(d.id, d.data()));
}

export async function createStudyTemplate(
  userId: string,
  input: StudyTemplateInput,
): Promise<string> {
  const ref = await addDoc(templatesCol(userId), {
    name: input.name.trim(),
    subjectId: input.subjectId.trim(),
    subjectName: input.subjectName.trim(),
    memo: input.memo?.trim() || null,
    durationDays: Math.max(1, input.durationDays),
    items: input.items.map((item) => ({
      source: item.source,
      label: item.label.trim(),
      scopeNote: item.scopeNote.trim() || null,
      contentRef: item.source === "app" && item.contentRef ? item.contentRef : null,
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createStudyTemplateFromPlan(
  userId: string,
  plan: StudyPlanWithItems,
  name: string,
): Promise<string> {
  return createStudyTemplate(userId, {
    name,
    subjectId: plan.subjectId,
    subjectName: plan.subjectName,
    memo: plan.memo,
    durationDays: planDurationDays(plan.startDate, plan.dueDate),
    items: plan.items.map((item) => ({
      source: item.source,
      label: item.label,
      scopeNote: item.scopeNote ?? "",
      contentRef: item.contentRef,
    })),
  });
}

export async function deleteStudyTemplate(userId: string, templateId: string): Promise<void> {
  await deleteDoc(doc(getFirestoreClient(), "users", userId, "studyTemplates", templateId));
}

export async function renameStudyTemplate(
  userId: string,
  templateId: string,
  name: string,
): Promise<void> {
  await updateDoc(doc(getFirestoreClient(), "users", userId, "studyTemplates", templateId), {
    name: name.trim(),
    updatedAt: serverTimestamp(),
  });
}

export function templateToPlanInput(template: StudyTemplateDoc): {
  subjectId: string;
  subjectName: string;
  startDate: string;
  dueDate: string;
  memo?: string;
  items: StudyItemDraft[];
} {
  const startDate = todayStudyDate();
  const dueDate = addDaysToStudyDate(startDate, template.durationDays - 1);
  return {
    subjectId: template.subjectId,
    subjectName: template.subjectName,
    startDate,
    dueDate,
    memo: template.memo,
    items: template.items.map((item) => ({ ...item })),
  };
}
