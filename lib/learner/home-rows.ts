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
import { listWorkspacesForLearner, isActiveMember } from "@/lib/workspaces/members";
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
  options?: { ensureWorkspaceId?: string },
): Promise<LearnerHomeData> {
  const [memberships, subjects, ownedWs] = await Promise.all([
    listWorkspacesForLearner(userId),
    listPublicSubjects(),
    getWorkspaceByOwner(userId),
  ]);

  const ensureWorkspaceId = options?.ensureWorkspaceId?.trim();
  if (
    ensureWorkspaceId &&
    !memberships.some((m) => m.workspaceId === ensureWorkspaceId) &&
    (await isActiveMember(ensureWorkspaceId, userId))
  ) {
    memberships.push({
      id: `${ensureWorkspaceId}_${userId}`,
      workspaceId: ensureWorkspaceId,
      userId,
      role: "learner",
      status: "active",
      invitedBy: "",
      createdAt: new Date().toISOString(),
    });
  }
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

  async function loadMemberContents(workspaceId: string): Promise<WorkspaceContentDoc[]> {
    try {
      return await enrichWorkspaceContentsFromAdmin(
        await listPublishedContentsForMember(workspaceId),
      );
    } catch {
      return [];
    }
  }

  for (const m of memberships) {
    const ws = await getWorkspace(m.workspaceId);
    if (!ws) continue;
    seen.add(m.workspaceId);
    const contents = await loadMemberContents(m.workspaceId);
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
    const contents = await loadMemberContents(ownedWs.id);
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
