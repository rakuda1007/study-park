"use client";

import type { ContentManifest } from "@/lib/content/types";
import { buildSubjectNameMap } from "@/lib/content/subject-names";
import { listPublicSubjects } from "@/lib/content/public-firestore";
import {
  listPublishedContentsForMember,
  type WorkspaceContentDoc,
} from "@/lib/workspaces/content-firestore";
import { enrichWorkspaceContentsFromAdmin } from "@/lib/workspaces/enrich-from-admin";
import { getWorkspace, getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import { listWorkspacesForLearner } from "@/lib/workspaces/members";
import { formatProfileDisplayName } from "@/lib/users/display-name";
import { getUserProfile } from "@/lib/users/firestore";

export type LearnerHomeRow = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  ownerLabel: string;
  isOwnWorkspace: boolean;
  contents: WorkspaceContentDoc[];
};

export type LearnerHomeData = {
  rows: LearnerHomeRow[];
  subjectNames: Map<string, string>;
};

export async function loadLearnerHomeRows(
  userId: string,
  manifest: ContentManifest,
): Promise<LearnerHomeData> {
  const [memberships, subjects, ownedWs] = await Promise.all([
    listWorkspacesForLearner(userId),
    listPublicSubjects(),
    getWorkspaceByOwner(userId),
  ]);
  const subjectNames = buildSubjectNameMap(manifest, subjects);
  const rows: LearnerHomeRow[] = [];
  const seen = new Set<string>();
  const ownerCache = new Map<string, string>();

  async function ownerLabel(ownerId: string): Promise<string> {
    const cached = ownerCache.get(ownerId);
    if (cached) return cached;
    const profile = await getUserProfile(ownerId);
    const label = formatProfileDisplayName(profile);
    ownerCache.set(ownerId, label);
    return label;
  }

  for (const m of memberships) {
    const ws = await getWorkspace(m.workspaceId);
    if (!ws) continue;
    seen.add(m.workspaceId);
    const contents = await enrichWorkspaceContentsFromAdmin(
      await listPublishedContentsForMember(m.workspaceId),
    );
    rows.push({
      workspaceId: m.workspaceId,
      workspaceName: ws.name,
      workspaceSlug: ws.slug,
      ownerLabel: await ownerLabel(ws.ownerId),
      isOwnWorkspace: ws.ownerId === userId,
      contents,
    });
  }

  if (ownedWs && !seen.has(ownedWs.id)) {
    const contents = await enrichWorkspaceContentsFromAdmin(
      await listPublishedContentsForMember(ownedWs.id),
    );
    rows.push({
      workspaceId: ownedWs.id,
      workspaceName: ownedWs.name,
      workspaceSlug: ownedWs.slug,
      ownerLabel: await ownerLabel(ownedWs.ownerId),
      isOwnWorkspace: true,
      contents,
    });
  }

  return { rows, subjectNames };
}
