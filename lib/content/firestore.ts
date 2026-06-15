"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import { syncAdminContentMirrors } from "@/lib/workspaces/admin-content-mirror";
import { DEFAULT_SUBJECTS } from "./subject-defaults";
import { currentContentPeriod, mapStoredContentPeriod } from "./period";
import { DEFAULT_QUIZ_BLANK_ANSWERS } from "./quiz-answers";
import { DEFAULT_QUIZ_QUESTION_BODY } from "./quiz-question";
import { defaultQuizBlankMarker } from "./quiz-markers";
import type {
  ContentDoc,
  ContentStatus,
  ContentType,
  LessonSection,
  QuizQuestion,
  SubjectDoc,
} from "./types";

function tsToIso(v: unknown): string {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as Timestamp).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

function mapSubject(id: string, data: Record<string, unknown>): SubjectDoc {
  return {
    id,
    name: String(data.name ?? ""),
    order: Number(data.order ?? 0),
    enabledInForm: data.enabledInForm === false ? false : true,
  };
}

function subjectsForForm(
  subjects: SubjectDoc[],
  currentSubjectId?: string,
): SubjectDoc[] {
  const enabled = subjects.filter((s) => s.enabledInForm !== false);
  if (!currentSubjectId || enabled.some((s) => s.id === currentSubjectId)) {
    return enabled;
  }
  const current = subjects.find((s) => s.id === currentSubjectId);
  return current ? [...enabled, current] : enabled;
}

function mapContent(id: string, data: Record<string, unknown>): ContentDoc {
  const createdAt = tsToIso(data.createdAt);
  const period = mapStoredContentPeriod(data, createdAt);
  return {
    id,
    subjectId: String(data.subjectId ?? ""),
    type: data.type as ContentDoc["type"],
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    status: (data.status as ContentStatus) ?? "draft",
    order: Number(data.order ?? 0),
    ready: Boolean(data.ready),
    intro: data.intro ? String(data.intro) : undefined,
    lesson: data.lesson as ContentDoc["lesson"],
    quiz: data.quiz as ContentDoc["quiz"],
    periodYear: period.year,
    periodMonth: period.month,
    pinned: data.pinned === true,
    createdAt,
    updatedAt: tsToIso(data.updatedAt),
    publishedAt: data.publishedAt ? tsToIso(data.publishedAt) : undefined,
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
  };
}

export async function listSubjects(): Promise<SubjectDoc[]> {
  const snap = await getDocs(collection(getFirestoreClient(), "subjects"));
  return snap.docs.map((d) => mapSubject(d.id, d.data())).sort((a, b) => a.order - b.order);
}

/** コンテンツ作成フォーム用（表示ONの教科のみ。編集中の教科は常に含む） */
export async function listSubjectsForForm(
  currentSubjectId?: string,
): Promise<SubjectDoc[]> {
  const subjects = await listSubjects();
  return subjectsForForm(subjects, currentSubjectId);
}

export async function createSubject(input: {
  id: string;
  name: string;
  order?: number;
  enabledInForm?: boolean;
}): Promise<void> {
  const ref = doc(getFirestoreClient(), "subjects", input.id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    throw new Error("この教科 ID は既に使われています。");
  }
  await setDoc(ref, {
    name: input.name.trim(),
    order: input.order ?? 999,
    enabledInForm: input.enabledInForm !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSubject(
  id: string,
  patch: { name?: string; order?: number; enabledInForm?: boolean },
): Promise<void> {
  const ref = doc(getFirestoreClient(), "subjects", id);
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

export async function deleteSubject(id: string): Promise<void> {
  const ref = doc(getFirestoreClient(), "subjects", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const contents = await listContents();
  if (contents.some((c) => c.subjectId === id)) {
    throw new Error("この教科に紐づくコンテンツがあるため削除できません。");
  }
  await deleteDoc(ref);
}

export async function listContents(subjectId?: string): Promise<ContentDoc[]> {
  const col = collection(getFirestoreClient(), "contents");
  const snap = await getDocs(query(col, orderBy("order", "asc")));
  const items = snap.docs.map((d) => mapContent(d.id, d.data()));
  const filtered = subjectId
    ? items.filter((c) => c.subjectId === subjectId)
    : items;
  return filtered.sort((a, b) => a.order - b.order);
}

export async function getContent(id: string): Promise<ContentDoc | null> {
  const snap = await getDoc(doc(getFirestoreClient(), "contents", id));
  if (!snap.exists()) return null;
  return mapContent(snap.id, snap.data());
}

export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const snap = await getDocs(
    query(collection(getFirestoreClient(), "contents"), where("slug", "==", slug)),
  );
  return snap.docs.some((d) => d.id !== excludeId);
}

export type CreateContentInput = {
  subjectId: string;
  type: ContentType;
  slug: string;
  title: string;
  intro?: string;
  periodYear?: number;
  periodMonth?: number;
  updatedBy: string;
};

export async function createContent(input: CreateContentInput): Promise<string> {
  const now = serverTimestamp();
  const period =
    input.periodYear && input.periodMonth
      ? { year: input.periodYear, month: input.periodMonth }
      : currentContentPeriod();
  const base = {
    subjectId: input.subjectId,
    type: input.type,
    slug: input.slug,
    title: input.title,
    status: "draft" as const,
    order: Date.now(),
    ready: false,
    intro: input.intro ?? "",
    periodYear: period.year,
    periodMonth: period.month,
    updatedBy: input.updatedBy,
    createdAt: now,
    updatedAt: now,
  };

  if (input.type === "lesson") {
    const ref = await addDoc(collection(getFirestoreClient(), "contents"), {
      ...base,
      lesson: {
        sections: [
          {
            id: "section-1",
            heading: "はじめに",
            blocks: [{ kind: "paragraph", text: "ここに本文を書きます。" }],
          },
        ],
      },
    });
    return ref.id;
  }

  const ref = await addDoc(collection(getFirestoreClient(), "contents"), {
    ...base,
    quiz: {
      quizKind: "blank",
      questions: [
        {
          id: "q01",
          number: 1,
          label: "問1",
          blocks: [
            {
              kind: "paragraph",
              text: DEFAULT_QUIZ_QUESTION_BODY,
            },
          ],
          template: DEFAULT_QUIZ_QUESTION_BODY,
          blanks: [{ marker: defaultQuizBlankMarker(0), answers: DEFAULT_QUIZ_BLANK_ANSWERS }],
        },
      ],
    },
  });
  return ref.id;
}

export async function updateContent(
  id: string,
  patch: Partial<
    Pick<
      ContentDoc,
      | "title"
      | "slug"
      | "subjectId"
      | "status"
      | "ready"
      | "order"
      | "intro"
      | "lesson"
      | "quiz"
      | "periodYear"
      | "periodMonth"
      | "pinned"
    >
  > & { updatedBy: string },
): Promise<void> {
  const { updatedBy, ...rest } = patch;
  await updateDoc(doc(getFirestoreClient(), "contents", id), {
    ...rest,
    updatedBy,
    updatedAt: serverTimestamp(),
    ...(rest.status === "published" ? { publishedAt: serverTimestamp() } : {}),
  });

  const mirrorPatch: Partial<
    Pick<ContentDoc, "pinned" | "periodYear" | "periodMonth">
  > = {};
  if (rest.pinned !== undefined) mirrorPatch.pinned = rest.pinned;
  if (rest.periodYear !== undefined) mirrorPatch.periodYear = rest.periodYear;
  if (rest.periodMonth !== undefined) mirrorPatch.periodMonth = rest.periodMonth;
  if (Object.keys(mirrorPatch).length > 0) {
    await syncAdminContentMirrors(id, mirrorPatch, updatedBy);
  }
}

export async function deleteContent(id: string): Promise<void> {
  await deleteDoc(doc(getFirestoreClient(), "contents", id));
}

const CONTENT_ORDER_STEP = 100;

/** 教科内の表示順を一括更新（トップメニュー・一覧の並びに反映） */
export async function reorderContentsInSubject(
  subjectId: string,
  orderedIds: string[],
  updatedBy: string,
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      updateContent(id, { order: (index + 1) * CONTENT_ORDER_STEP, updatedBy }),
    ),
  );
}

export type ContentReorderAction = "up" | "down" | "top";

/** 教科内で1件のコンテンツを並び替え */
export async function moveContentInSubject(
  subjectId: string,
  contentId: string,
  action: ContentReorderAction,
  updatedBy: string,
): Promise<void> {
  const items = await listContents(subjectId);
  const ids = items.map((c) => c.id);
  const idx = ids.indexOf(contentId);
  if (idx < 0) {
    throw new Error(
      "並び替え対象が見つかりません。ページを再読み込みしてからもう一度お試しください。",
    );
  }

  if (action === "up" && idx > 0) {
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
  } else if (action === "down" && idx < ids.length - 1) {
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
  } else if (action === "top" && idx > 0) {
    ids.splice(idx, 1);
    ids.unshift(contentId);
  } else {
    throw new Error("これ以上その方向には移動できません。");
  }

  await reorderContentsInSubject(subjectId, ids, updatedBy);
}

export async function saveLessonSections(
  id: string,
  sections: LessonSection[],
  updatedBy: string,
): Promise<void> {
  await updateDoc(doc(getFirestoreClient(), "contents", id), {
    lesson: { sections },
    updatedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function saveQuizQuestions(
  id: string,
  questions: QuizQuestion[],
  updatedBy: string,
): Promise<void> {
  await updateDoc(doc(getFirestoreClient(), "contents", id), {
    quiz: { quizKind: "blank", questions },
    updatedBy,
    updatedAt: serverTimestamp(),
  });
}

/** 初期教科データ（存在しなければ作成） */
export async function ensureDefaultSubjects(): Promise<void> {
  for (const s of DEFAULT_SUBJECTS) {
    const ref = doc(getFirestoreClient(), "subjects", s.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name: s.name,
        order: s.order,
        enabledInForm: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}
