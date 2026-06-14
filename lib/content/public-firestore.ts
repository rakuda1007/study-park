"use client";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import { mapStoredContentPeriod } from "./period";
import type { ContentDoc, LegacyContentDoc, SubjectDoc } from "./types";

function mapSubject(id: string, data: Record<string, unknown>): SubjectDoc {
  return {
    id,
    name: String(data.name ?? ""),
    order: Number(data.order ?? 0),
    enabledInForm: data.enabledInForm === false ? false : true,
  };
}

function mapContent(id: string, data: Record<string, unknown>): ContentDoc {
  const createdAt = String(data.createdAt ?? data.updatedAt ?? "");
  const period = mapStoredContentPeriod(data, createdAt);
  return {
    id,
    subjectId: String(data.subjectId ?? ""),
    type: data.type as ContentDoc["type"],
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    status: (data.status as ContentDoc["status"]) ?? "draft",
    order: Number(data.order ?? 0),
    ready: Boolean(data.ready),
    intro: data.intro ? String(data.intro) : undefined,
    lesson: data.lesson as ContentDoc["lesson"],
    quiz: data.quiz as ContentDoc["quiz"],
    periodYear: period.year,
    periodMonth: period.month,
    pinned: data.pinned === true,
    createdAt,
    updatedAt: String(data.updatedAt ?? ""),
  };
}

/** サイト公開中（メニュー・プレイ画面）のコンテンツ一覧 */
export async function listPublishedContents(): Promise<ContentDoc[]> {
  const col = collection(getFirestoreClient(), "contents");
  try {
    const snap = await getDocs(
      query(col, where("status", "==", "published"), orderBy("order", "asc")),
    );
    return snap.docs.map((d) => mapContent(d.id, d.data()));
  } catch {
    const snap = await getDocs(query(col, where("status", "==", "published")));
    return snap.docs
      .map((d) => mapContent(d.id, d.data()))
      .sort((a, b) => a.order - b.order);
  }
}

/** slug で公開コンテンツを1件取得 */
export async function getPublishedContentBySlug(slug: string): Promise<ContentDoc | null> {
  const snap = await getDocs(
    query(
      collection(getFirestoreClient(), "contents"),
      where("slug", "==", slug),
      where("status", "==", "published"),
      limit(1),
    ),
  );
  const doc = snap.docs[0];
  if (!doc) return null;
  return mapContent(doc.id, doc.data());
}

export async function listPublicSubjects(): Promise<SubjectDoc[]> {
  const snap = await getDocs(collection(getFirestoreClient(), "subjects"));
  return snap.docs.map((d) => mapSubject(d.id, d.data())).sort((a, b) => a.order - b.order);
}

function mapLegacy(id: string, data: Record<string, unknown>): LegacyContentDoc {
  return {
    id,
    subjectId: String(data.subjectId ?? ""),
    label: String(data.label ?? ""),
    href: String(data.href ?? ""),
    slug: String(data.slug ?? ""),
    order: Number(data.order ?? 0),
    ready: Boolean(data.ready ?? true),
  };
}

/** トップメニュー用の静的コンテンツ（公開＝ready） */
export async function listPublishedLegacyContents(): Promise<LegacyContentDoc[]> {
  const col = collection(getFirestoreClient(), "legacyContents");
  try {
    const snap = await getDocs(
      query(col, where("ready", "==", true), orderBy("order", "asc")),
    );
    return snap.docs.map((d) => mapLegacy(d.id, d.data()));
  } catch {
    const snap = await getDocs(query(col, where("ready", "==", true)));
    return snap.docs
      .map((d) => mapLegacy(d.id, d.data()))
      .sort((a, b) => a.order - b.order);
  }
}
