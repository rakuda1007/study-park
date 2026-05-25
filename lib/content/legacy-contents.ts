"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { ContentManifest, LegacyContentDoc } from "./types";
import { slugFromLegacyHref } from "./urls";

const ORDER_STEP = 100;

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

/** 管理画面用（非公開含む全件）。トップは listPublishedLegacyContents を使うこと */
export async function listLegacyContents(subjectId?: string): Promise<LegacyContentDoc[]> {
  const col = collection(getFirestoreClient(), "legacyContents");
  const snap = await getDocs(query(col, orderBy("order", "asc")));
  const items = snap.docs.map((d) => mapLegacy(d.id, d.data()));
  const filtered = subjectId
    ? items.filter((l) => l.subjectId === subjectId)
    : items;
  return filtered.sort((a, b) => a.order - b.order);
}

/** content-manifest.json の項目を Firestore に未登録なら取り込む（既存の order は維持） */
export async function ensureLegacyContentsFromManifest(
  manifest: ContentManifest,
): Promise<void> {
  const existing = await listLegacyContents();
  const byHref = new Map(existing.map((e) => [e.href, e]));

  for (const subject of manifest.subjects) {
    for (let i = 0; i < subject.items.length; i++) {
      const item = subject.items[i];
      if (!item.href) continue;
      if (byHref.has(item.href)) continue;

      const slug = slugFromLegacyHref(item.href) ?? "";
      await addDoc(collection(getFirestoreClient(), "legacyContents"), {
        subjectId: subject.id,
        label: item.label,
        href: item.href,
        slug,
        order: (i + 1) * ORDER_STEP,
        ready: item.ready,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export async function updateLegacyContent(
  id: string,
  patch: Partial<Pick<LegacyContentDoc, "label" | "order" | "ready" | "subjectId">>,
): Promise<void> {
  await updateDoc(doc(getFirestoreClient(), "legacyContents", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export type MenuEntryRef = { kind: "content" | "legacy"; id: string };

export async function listMenuEntryRefs(subjectId: string): Promise<MenuEntryRef[]> {
  const { listContents } = await import("./firestore");
  const [contents, legacy] = await Promise.all([
    listContents(subjectId),
    listLegacyContents(subjectId),
  ]);

  const rows: { kind: "content" | "legacy"; id: string; order: number }[] = [
    ...contents.map((c) => ({ kind: "content" as const, id: c.id, order: c.order })),
    ...legacy.map((l) => ({ kind: "legacy" as const, id: l.id, order: l.order })),
  ];
  rows.sort((a, b) => a.order - b.order);
  return rows.map(({ kind, id }) => ({ kind, id }));
}

export async function reorderMenuEntriesInSubject(
  subjectId: string,
  ordered: MenuEntryRef[],
  updatedBy: string,
): Promise<void> {
  const { updateContent } = await import("./firestore");

  await Promise.all(
    ordered.map((entry, index) => {
      const order = (index + 1) * ORDER_STEP;
      if (entry.kind === "content") {
        return updateContent(entry.id, { order, updatedBy });
      }
      return updateLegacyContent(entry.id, { order });
    }),
  );
}

export async function moveMenuEntryInSubject(
  subjectId: string,
  ref: MenuEntryRef,
  action: "up" | "down" | "top",
  updatedBy: string,
): Promise<void> {
  const ordered = await listMenuEntryRefs(subjectId);
  const idx = ordered.findIndex((e) => e.kind === ref.kind && e.id === ref.id);
  if (idx < 0) {
    throw new Error(
      "並び替え対象が見つかりません。ページを再読み込みしてからもう一度お試しください。",
    );
  }

  if (action === "up" && idx > 0) {
    [ordered[idx - 1], ordered[idx]] = [ordered[idx], ordered[idx - 1]];
  } else if (action === "down" && idx < ordered.length - 1) {
    [ordered[idx], ordered[idx + 1]] = [ordered[idx + 1], ordered[idx]];
  } else if (action === "top" && idx > 0) {
    const [item] = ordered.splice(idx, 1);
    ordered.unshift(item);
  } else {
    throw new Error("これ以上その方向には移動できません。");
  }

  await reorderMenuEntriesInSubject(subjectId, ordered, updatedBy);
}
