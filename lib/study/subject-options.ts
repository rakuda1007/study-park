"use client";

import type { ContentManifest } from "@/lib/content/types";
import { buildSubjectNameMap } from "@/lib/content/subject-names";
import { listPublicSubjects } from "@/lib/content/public-firestore";
import { loadLearnerHomeRows } from "@/lib/learner/home-rows";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";

export type StudySubjectOption = {
  id: string;
  name: string;
};

export type StudyWorkspaceOption = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  contents: WorkspaceContentDoc[];
};

export type StudySubjectData = {
  subjects: StudySubjectOption[];
  workspaces: StudyWorkspaceOption[];
};

const CUSTOM_SUBJECT_ID = "__custom__";

export function customSubjectOption(): StudySubjectOption {
  return { id: CUSTOM_SUBJECT_ID, name: "その他（自由入力）" };
}

export function isCustomSubjectId(subjectId: string): boolean {
  return subjectId === CUSTOM_SUBJECT_ID;
}

export async function loadStudySubjectData(
  userId: string,
  manifest: ContentManifest,
): Promise<StudySubjectData> {
  const [home, publicSubjects] = await Promise.all([
    loadLearnerHomeRows(userId, manifest),
    listPublicSubjects(),
  ]);

  const subjectNames = buildSubjectNameMap(manifest, publicSubjects);
  const seen = new Map<string, string>();

  for (const [id, name] of subjectNames) {
    seen.set(id, name);
  }

  for (const row of home.rows) {
    for (const content of row.contents) {
      if (!seen.has(content.subjectId)) {
        seen.set(content.subjectId, subjectNames.get(content.subjectId) ?? content.subjectId);
      }
    }
  }

  const subjects = [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));

  subjects.push(customSubjectOption());

  const workspaces: StudyWorkspaceOption[] = home.rows
    .filter((row) => row.contents.length > 0)
    .map((row) => ({
      workspaceId: row.workspaceId,
      workspaceName: row.workspaceName,
      workspaceSlug: row.workspaceSlug,
      contents: row.contents,
    }));

  return { subjects, workspaces };
}
