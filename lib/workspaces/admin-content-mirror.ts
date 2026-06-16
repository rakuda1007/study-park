"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { ContentDoc } from "@/lib/content/types";
import { listWorkspaceContents } from "./content-firestore";
import { getWorkspaceByOwner } from "./firestore";

type MirrorPatch = Partial<Pick<ContentDoc, "pinned" | "periodYear" | "periodMonth">>;

/** 管理用 contents の変更をワークスペース側 contents ミラーへ反映 */
export async function syncAdminContentMirrors(
  contentId: string,
  patch: MirrorPatch,
  updatedBy: string,
): Promise<number> {
  const migratedFrom = `contents/${contentId}`;
  const ws = await getWorkspaceByOwner(updatedBy);
  if (!ws) return 0;

  const items = await listWorkspaceContents(ws.id);
  const mirrors = items.filter((c) => c.migratedFrom === migratedFrom);
  if (mirrors.length === 0) return 0;

  await Promise.all(
    mirrors.map((c) =>
      updateDoc(doc(getFirestoreClient(), "workspaces", ws.id, "contents", c.id), {
        ...patch,
        updatedBy,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  return mirrors.length;
}
