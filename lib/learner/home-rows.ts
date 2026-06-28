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

export async function loadLearnerWorkspaceContents(
  workspaceId: string,
): Promise<WorkspaceContentDoc[]> {
  let items: WorkspaceContentDoc[];
  try {
    items = await listPublishedContentsForMember(workspaceId);
  } catch {
    return [];
  }
  try {
    return await enrichWorkspaceContentsFromAdmin(items);
  } catch {
    return items;
  }
}

async function buildLearnerMembershipList(
  userId: string,
  ensureWorkspaceId?: string,
) {
  const [memberships, subjects, ownedWs] = await Promise.all([
    listWorkspacesForLearner(userId),
    listPublicSubjects(),
    getWorkspaceByOwner(userId),
  ]);

  const trimmedEnsureId = ensureWorkspaceId?.trim();
  if (
    trimmedEnsureId &&
    !memberships.some((m) => m.workspaceId === trimmedEnsureId) &&
    (await isActiveMember(trimmedEnsureId, userId))
  ) {
    memberships.push({
      id: `${trimmedEnsureId}_${userId}`,
      workspaceId: trimmedEnsureId,
      userId,
      role: "learner",
      status: "active",
      invitedBy: "",
      createdAt: new Date().toISOString(),
    });
  }

  return { memberships, subjects, ownedWs };
}

export async function loadLearnerHomeScaffold(
  userId: string,
  manifest: ContentManifest,
  options?: { ensureWorkspaceId?: string },
): Promise<LearnerHomeData> {
  const { memberships, subjects, ownedWs } = await buildLearnerMembershipList(
    userId,
    options?.ensureWorkspaceId,
  );
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

  const membershipRows = await Promise.all(
    memberships.map(async (m) => {
      const ws = await getWorkspace(m.workspaceId);
      if (!ws) return null;
      const label = await ownerLabel(ws.ownerId);
      return {
        workspaceId: m.workspaceId,
        workspaceName: ws.name,
        workspaceSlug: ws.slug,
        ownerLabel: label,
        isOwnWorkspace: ws.ownerId === userId,
        contents: [],
      } satisfies LearnerHomeRow;
    }),
  );

  for (const row of membershipRows) {
    if (!row) continue;
    seen.add(row.workspaceId);
    rows.push(row);
  }

  if (ownedWs && !seen.has(ownedWs.id)) {
    rows.push({
      workspaceId: ownedWs.id,
      workspaceName: ownedWs.name,
      workspaceSlug: ownedWs.slug,
      ownerLabel: await ownerLabel(ownedWs.ownerId),
      isOwnWorkspace: true,
      contents: [],
    });
  }

  return { rows, subjectNames };
}

export async function loadLearnerHomeRows(
  userId: string,
  manifest: ContentManifest,
  options?: { ensureWorkspaceId?: string },
): Promise<LearnerHomeData> {
  const { rows, subjectNames } = await loadLearnerHomeScaffold(userId, manifest, options);
  const withContents = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      contents: await loadLearnerWorkspaceContents(row.workspaceId),
    })),
  );
  return { rows: withContents, subjectNames };
}
