"use client";

import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import { STUDY_ACTIVE_PLAN_LIMIT, StudyPlanLimitError } from "./limits";
import { planOverlapsWeek, formatStudyDate } from "./week";
import type {
  StudyItemDoc,
  StudyItemDraft,
  StudyPlanDoc,
  StudyPlanInput,
  StudyPlanStatus,
  StudyPlanWithItems,
} from "./types";

function tsToIso(v: unknown): string {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as Timestamp).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

function plansCol(userId: string) {
  return collection(getFirestoreClient(), "users", userId, "studyPlans");
}

function itemsCol(userId: string, planId: string) {
  return collection(getFirestoreClient(), "users", userId, "studyPlans", planId, "items");
}

function mapPlan(id: string, data: Record<string, unknown>): StudyPlanDoc {
  const status = data.status as StudyPlanStatus;
  return {
    id,
    subjectId: String(data.subjectId ?? ""),
    subjectName: String(data.subjectName ?? ""),
    startDate: String(data.startDate ?? ""),
    dueDate: String(data.dueDate ?? ""),
    memo: data.memo ? String(data.memo) : undefined,
    status:
      status === "completed" || status === "archived" ? status : "active",
    completedAt: data.completedAt ? tsToIso(data.completedAt) : undefined,
    archivedAt: data.archivedAt ? tsToIso(data.archivedAt) : undefined,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export async function countActiveStudyPlans(userId: string): Promise<number> {
  const snap = await getCountFromServer(
    query(plansCol(userId), where("status", "==", "active")),
  );
  return snap.data().count;
}

async function assertCanAddActivePlan(userId: string): Promise<void> {
  const activeCount = await countActiveStudyPlans(userId);
  if (activeCount >= STUDY_ACTIVE_PLAN_LIMIT) {
    throw new StudyPlanLimitError(activeCount);
  }
}

function mapContentRef(data: unknown): StudyItemDoc["contentRef"] | undefined {
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

function mapItem(planId: string, id: string, data: Record<string, unknown>): StudyItemDoc {
  const source = data.source === "app" ? "app" : "external";
  return {
    id,
    planId,
    order: Number(data.order ?? 0),
    source,
    label: String(data.label ?? ""),
    scopeNote: data.scopeNote ? String(data.scopeNote) : undefined,
    progressPercent: Math.max(0, Math.min(100, Number(data.progressPercent ?? 0))),
    contentRef: source === "app" ? mapContentRef(data.contentRef) : undefined,
  };
}

export async function listStudyPlans(userId: string): Promise<StudyPlanDoc[]> {
  const snap = await getDocs(query(plansCol(userId), orderBy("dueDate", "asc")));
  return snap.docs.map((d) => mapPlan(d.id, d.data()));
}

/** 期限が指定日以降の計画のみ取得（週ビュー向け・古い完了計画を省略） */
export async function listStudyPlansDueOnOrAfter(
  userId: string,
  dueDateMin: string,
): Promise<StudyPlanDoc[]> {
  try {
    const snap = await getDocs(
      query(
        plansCol(userId),
        where("dueDate", ">=", dueDateMin),
        orderBy("dueDate", "asc"),
      ),
    );
    return snap.docs.map((d) => mapPlan(d.id, d.data()));
  } catch {
    return listStudyPlans(userId);
  }
}

async function attachItemsToPlans(
  userId: string,
  plans: StudyPlanDoc[],
): Promise<StudyPlanWithItems[]> {
  return Promise.all(
    plans.map(async (plan) => {
      const items = await listStudyItems(userId, plan.id);
      return { ...plan, items };
    }),
  );
}

export async function listStudyItems(
  userId: string,
  planId: string,
): Promise<StudyItemDoc[]> {
  const snap = await getDocs(query(itemsCol(userId, planId), orderBy("order", "asc")));
  return snap.docs.map((d) => mapItem(planId, d.id, d.data()));
}

export async function getStudyPlanWithItems(
  userId: string,
  planId: string,
): Promise<StudyPlanWithItems | null> {
  const planSnap = await getDoc(doc(getFirestoreClient(), "users", userId, "studyPlans", planId));
  if (!planSnap.exists()) return null;
  const plan = mapPlan(planSnap.id, planSnap.data());
  const items = await listStudyItems(userId, planId);
  return { ...plan, items };
}

export async function listStudyPlansWithItems(userId: string): Promise<StudyPlanWithItems[]> {
  const plans = await listStudyPlans(userId);
  return attachItemsToPlans(userId, plans);
}

/** 週ビュー向け：期限で絞ってから items を取得 */
export async function listStudyPlansWithItemsForWeek(
  userId: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<StudyPlanWithItems[]> {
  const weekStartIso = formatStudyDate(weekStart);
  const plans = (await listStudyPlansDueOnOrAfter(userId, weekStartIso)).filter(
    (plan) =>
      plan.status !== "archived" && planOverlapsWeek(plan, weekStart, weekEnd),
  );
  return attachItemsToPlans(userId, plans);
}

export async function createStudyPlan(
  userId: string,
  input: StudyPlanInput,
): Promise<string> {
  await assertCanAddActivePlan(userId);

  const planRef = await addDoc(plansCol(userId), {
    subjectId: input.subjectId.trim(),
    subjectName: input.subjectName.trim(),
    startDate: input.startDate,
    dueDate: input.dueDate,
    memo: input.memo?.trim() || null,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const batch = writeBatch(getFirestoreClient());
  input.items.forEach((item, index) => {
    const itemRef = doc(itemsCol(userId, planRef.id));
    batch.set(itemRef, {
      order: index,
      source: item.source,
      label: item.label.trim(),
      scopeNote: item.scopeNote.trim() || null,
      progressPercent: 0,
      contentRef: item.source === "app" && item.contentRef ? item.contentRef : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return planRef.id;
}

export async function updateStudyPlanMeta(
  userId: string,
  planId: string,
  patch: {
    subjectId?: string;
    subjectName?: string;
    startDate?: string;
    dueDate?: string;
    memo?: string;
    status?: StudyPlanStatus;
  },
): Promise<void> {
  if (patch.status === "active") {
    const current = await getDoc(doc(getFirestoreClient(), "users", userId, "studyPlans", planId));
    const currentStatus = current.exists()
      ? (current.data().status as StudyPlanStatus | undefined)
      : undefined;
    if (currentStatus && currentStatus !== "active") {
      await assertCanAddActivePlan(userId);
    }
  }

  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.subjectId !== undefined) data.subjectId = patch.subjectId.trim();
  if (patch.subjectName !== undefined) data.subjectName = patch.subjectName.trim();
  if (patch.startDate !== undefined) data.startDate = patch.startDate;
  if (patch.dueDate !== undefined) data.dueDate = patch.dueDate;
  if (patch.memo !== undefined) data.memo = patch.memo.trim() || null;
  if (patch.status !== undefined) {
    data.status = patch.status;
    if (patch.status === "completed") {
      data.completedAt = serverTimestamp();
    } else if (patch.status === "active") {
      data.completedAt = null;
      data.archivedAt = null;
    } else if (patch.status === "archived") {
      data.archivedAt = serverTimestamp();
    }
  }
  await updateDoc(doc(getFirestoreClient(), "users", userId, "studyPlans", planId), data);
}

export async function replaceStudyItems(
  userId: string,
  planId: string,
  items: StudyItemDraft[],
  existingItems: StudyItemDoc[],
): Promise<void> {
  const batch = writeBatch(getFirestoreClient());
  const db = getFirestoreClient();
  const existingById = new Map(existingItems.map((item) => [item.id, item]));
  const keptIds = new Set(
    items.map((item) => item.id).filter((id): id is string => Boolean(id)),
  );

  for (const existing of existingItems) {
    if (!keptIds.has(existing.id)) {
      batch.delete(doc(db, "users", userId, "studyPlans", planId, "items", existing.id));
    }
  }

  items.forEach((item, index) => {
    const matched = item.id ? existingById.get(item.id) : undefined;
    const progress = matched?.progressPercent ?? 0;
    const payload = {
      order: index,
      source: item.source,
      label: item.label.trim(),
      scopeNote: item.scopeNote.trim() || null,
      progressPercent: progress,
      contentRef: item.source === "app" && item.contentRef ? item.contentRef : null,
      updatedAt: serverTimestamp(),
    };

    if (item.id && existingById.has(item.id)) {
      batch.update(
        doc(db, "users", userId, "studyPlans", planId, "items", item.id),
        payload,
      );
      return;
    }

    const itemRef = doc(itemsCol(userId, planId));
    batch.set(itemRef, {
      ...payload,
      createdAt: serverTimestamp(),
    });
  });

  batch.update(doc(db, "users", userId, "studyPlans", planId), {
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function updateStudyItemProgress(
  userId: string,
  planId: string,
  itemId: string,
  progressPercent: number,
): Promise<void> {
  const value = Math.max(0, Math.min(100, Math.round(progressPercent)));
  const batch = writeBatch(getFirestoreClient());
  const db = getFirestoreClient();
  batch.update(doc(db, "users", userId, "studyPlans", planId, "items", itemId), {
    progressPercent: value,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "users", userId, "studyPlans", planId), {
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function deleteStudyPlan(userId: string, planId: string): Promise<void> {
  const items = await listStudyItems(userId, planId);
  const batch = writeBatch(getFirestoreClient());
  const db = getFirestoreClient();
  for (const item of items) {
    batch.delete(doc(db, "users", userId, "studyPlans", planId, "items", item.id));
  }
  batch.delete(doc(db, "users", userId, "studyPlans", planId));
  await batch.commit();
}
