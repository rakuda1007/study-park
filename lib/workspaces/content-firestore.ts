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
import { countQuestionsInContents } from "@/lib/billing/usage";
import { DEFAULT_QUIZ_BLANK_ANSWERS } from "@/lib/content/quiz-answers";
import { DEFAULT_QUIZ_QUESTION_BODY } from "@/lib/content/quiz-question";
import { defaultQuizBlankMarker } from "@/lib/content/quiz-markers";
import type {
  ContentDoc,
  ContentStatus,
  ContentType,
  LessonSection,
  QuizQuestion,
} from "@/lib/content/types";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { ContentVisibility } from "./types";
import { resolveWorkspaceBySlug } from "./members";
import { updateWorkspaceUsageCounts } from "./firestore";

function contentsCol(workspaceId: string) {
  return collection(getFirestoreClient(), "workspaces", workspaceId, "contents");
}

function tsToIso(v: unknown): string {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as Timestamp).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

export type WorkspaceContentDoc = ContentDoc & {
  visibility: ContentVisibility;
  workspaceId: string;
};

function mapContent(workspaceId: string, id: string, data: Record<string, unknown>): WorkspaceContentDoc {
  const vis = data.visibility as ContentVisibility;
  return {
    workspaceId,
    id,
    subjectId: String(data.subjectId ?? ""),
    type: data.type as ContentDoc["type"],
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    status: (data.status as ContentStatus) ?? "draft",
    order: Number(data.order ?? 0),
    ready: Boolean(data.ready),
    visibility:
      vis === "members" || vis === "unlisted" || vis === "public" ? vis : "private",
    intro: data.intro ? String(data.intro) : undefined,
    lesson: data.lesson as ContentDoc["lesson"],
    quiz: data.quiz as ContentDoc["quiz"],
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
    publishedAt: data.publishedAt ? tsToIso(data.publishedAt) : undefined,
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
  };
}

async function syncQuestionCount(workspaceId: string): Promise<void> {
  const items = await listWorkspaceContents(workspaceId);
  const count = countQuestionsInContents(items);
  await updateWorkspaceUsageCounts(workspaceId, { questionCount: count });
}

export async function listWorkspaceContents(
  workspaceId: string,
  subjectId?: string,
): Promise<WorkspaceContentDoc[]> {
  const snap = await getDocs(query(contentsCol(workspaceId), orderBy("order", "asc")));
  const items = snap.docs.map((d) => mapContent(workspaceId, d.id, d.data()));
  const filtered = subjectId ? items.filter((c) => c.subjectId === subjectId) : items;
  return filtered.sort((a, b) => a.order - b.order);
}

export async function getWorkspaceContent(
  workspaceId: string,
  contentId: string,
): Promise<WorkspaceContentDoc | null> {
  const snap = await getDoc(doc(getFirestoreClient(), "workspaces", workspaceId, "contents", contentId));
  if (!snap.exists()) return null;
  return mapContent(workspaceId, snap.id, snap.data());
}

export async function isWorkspaceSlugTaken(
  workspaceId: string,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const snap = await getDocs(
    query(contentsCol(workspaceId), where("slug", "==", slug)),
  );
  return snap.docs.some((d) => d.id !== excludeId);
}

export type CreateWorkspaceContentInput = {
  subjectId: string;
  type: ContentType;
  slug: string;
  title: string;
  intro?: string;
  updatedBy: string;
  visibility?: ContentVisibility;
};

export async function createWorkspaceContent(
  workspaceId: string,
  input: CreateWorkspaceContentInput,
): Promise<string> {
  const now = serverTimestamp();
  const base = {
    subjectId: input.subjectId,
    type: input.type,
    slug: input.slug,
    title: input.title,
    status: "draft" as const,
    order: Date.now(),
    ready: false,
    visibility: input.visibility ?? ("members" as const),
    intro: input.intro ?? "",
    updatedBy: input.updatedBy,
    createdAt: now,
    updatedAt: now,
  };

  if (input.type === "lesson") {
    const ref = await addDoc(contentsCol(workspaceId), {
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

  const ref = await addDoc(contentsCol(workspaceId), {
    ...base,
    quiz: {
      quizKind: "blank",
      questions: [
        {
          id: "q01",
          number: 1,
          label: "問1",
          blocks: [{ kind: "paragraph", text: DEFAULT_QUIZ_QUESTION_BODY }],
          template: DEFAULT_QUIZ_QUESTION_BODY,
          blanks: [{ marker: defaultQuizBlankMarker(0), answers: DEFAULT_QUIZ_BLANK_ANSWERS }],
        },
      ],
    },
  });
  await syncQuestionCount(workspaceId);
  return ref.id;
}

export async function updateWorkspaceContent(
  workspaceId: string,
  id: string,
  patch: Partial<
    Pick<
      WorkspaceContentDoc,
      | "title"
      | "slug"
      | "subjectId"
      | "status"
      | "ready"
      | "order"
      | "intro"
      | "lesson"
      | "quiz"
      | "visibility"
    >
  > & { updatedBy: string },
): Promise<void> {
  const { updatedBy, ...rest } = patch;
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId, "contents", id), {
    ...rest,
    updatedBy,
    updatedAt: serverTimestamp(),
    ...(rest.status === "published" ? { publishedAt: serverTimestamp() } : {}),
  });
  if (rest.quiz !== undefined) {
    await syncQuestionCount(workspaceId);
  }
}

export async function deleteWorkspaceContent(workspaceId: string, id: string): Promise<void> {
  await deleteDoc(doc(getFirestoreClient(), "workspaces", workspaceId, "contents", id));
  await syncQuestionCount(workspaceId);
}

export async function saveWorkspaceLessonSections(
  workspaceId: string,
  id: string,
  sections: LessonSection[],
  updatedBy: string,
): Promise<void> {
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId, "contents", id), {
    lesson: { sections },
    updatedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function saveWorkspaceQuizQuestions(
  workspaceId: string,
  id: string,
  questions: QuizQuestion[],
  updatedBy: string,
): Promise<void> {
  await updateDoc(doc(getFirestoreClient(), "workspaces", workspaceId, "contents", id), {
    quiz: { quizKind: "blank", questions },
    updatedBy,
    updatedAt: serverTimestamp(),
  });
  await syncQuestionCount(workspaceId);
}

/** workspaceId + slug で公開教材を取得（学習者ホームと同じ経路） */
export async function getPublishedWorkspaceContentInWorkspace(
  workspaceId: string,
  contentSlug: string,
): Promise<WorkspaceContentDoc | null> {
  const normalized = contentSlug.trim().toLowerCase();
  const items = await listPublishedContentsForMember(workspaceId);
  return items.find((c) => c.slug.trim().toLowerCase() === normalized) ?? null;
}

/** 公開コンテンツを ws slug + content slug で取得 */
export async function getPublishedWorkspaceContentBySlug(
  workspaceSlug: string,
  contentSlug: string,
  userId?: string | null,
): Promise<WorkspaceContentDoc | null> {
  const ws = await resolveWorkspaceBySlug(workspaceSlug, userId);
  if (!ws) return null;
  return getPublishedWorkspaceContentInWorkspace(ws.id, contentSlug);
}

/** 学習者向け: 紐づき ws の公開教材一覧 */
export async function listPublishedContentsForMember(
  workspaceId: string,
): Promise<WorkspaceContentDoc[]> {
  const snap = await getDocs(
    query(contentsCol(workspaceId), where("status", "==", "published"), orderBy("order", "asc")),
  );
  return snap.docs
    .map((d) => mapContent(workspaceId, d.id, d.data()))
    .filter((c) => c.visibility === "members" || c.visibility === "unlisted" || c.visibility === "public");
}

/** ワークスペース内の教科（簡易: デフォルト教科を doc 化） */
export async function ensureWorkspaceSubjects(workspaceId: string): Promise<void> {
  const defaults = [
    { id: "general", name: "教材", order: 1 },
  ];
  for (const s of defaults) {
    const ref = doc(getFirestoreClient(), "workspaces", workspaceId, "subjects", s.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { name: s.name, order: s.order });
    }
  }
}
