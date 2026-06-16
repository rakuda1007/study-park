"use client";

import { getContent } from "@/lib/content/firestore";
import type { WorkspaceContentDoc } from "./content-firestore";

export function migratedAdminContentId(migratedFrom?: string): string | null {
  if (!migratedFrom?.startsWith("contents/")) return null;
  const id = migratedFrom.slice("contents/".length).trim();
  return id || null;
}

/** 教室WSへ移行した教材は、管理側 contents の常設・作成年月を表示用に反映する */
export async function enrichWorkspaceContentsFromAdmin(
  contents: WorkspaceContentDoc[],
): Promise<WorkspaceContentDoc[]> {
  const adminIds = [
    ...new Set(
      contents
        .map((c) => migratedAdminContentId(c.migratedFrom))
        .filter((id): id is string => !!id),
    ),
  ];
  if (adminIds.length === 0) return contents;

  const adminById = new Map<string, Awaited<ReturnType<typeof getContent>>>();
  await Promise.all(
    adminIds.map(async (id) => {
      try {
        const admin = await getContent(id);
        if (admin) adminById.set(id, admin);
      } catch {
        /* 学習者は下書きの管理用 contents を読めない。WS 側の値をそのまま使う */
      }
    }),
  );
  if (adminById.size === 0) return contents;

  return contents.map((c) => {
    const adminId = migratedAdminContentId(c.migratedFrom);
    if (!adminId) return c;
    const admin = adminById.get(adminId);
    if (!admin) return c;
    return {
      ...c,
      pinned: admin.pinned === true,
      periodYear: admin.periodYear,
      periodMonth: admin.periodMonth,
    };
  });
}
