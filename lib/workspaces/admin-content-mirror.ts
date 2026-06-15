"use client";

import {
  collectionGroup,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { ContentDoc } from "@/lib/content/types";

type MirrorPatch = Partial<Pick<ContentDoc, "pinned" | "periodYear" | "periodMonth">>;

/** 管理用 contents の変更をワークスペース側 contents ミラーへ反映 */
export async function syncAdminContentMirrors(
  contentId: string,
  patch: MirrorPatch,
  updatedBy: string,
): Promise<number> {
  const snap = await getDocs(
    query(
      collectionGroup(getFirestoreClient(), "contents"),
      where("migratedFrom", "==", `contents/${contentId}`),
    ),
  );
  if (snap.empty) return 0;
  await Promise.all(
    snap.docs.map((d) =>
      updateDoc(d.ref, {
        ...patch,
        updatedBy,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
  return snap.size;
}
