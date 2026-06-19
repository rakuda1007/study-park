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

/** 学習計画の科目選択から除外する教科 ID */
const EXCLUDED_STUDY_SUBJECT_IDS = new Set(["general"]);

/** 学習計画フォームの初期選択 */
export const DEFAULT_STUDY_SUBJECT_ID = "kokugo";

/** 学習計画で常に選べる科目（参加教材に国語がなくても選択可能） */
const STUDY_BUILTIN_SUBJECTS: StudySubjectOption[] = [
  { id: DEFAULT_STUDY_SUBJECT_ID, name: "国語" },
];

export function defaultStudySubjectOption(
  subjects: StudySubjectOption[],
): StudySubjectOption {
  return (
    subjects.find((s) => s.id === DEFAULT_STUDY_SUBJECT_ID) ??
    subjects.find((s) => !isCustomSubjectId(s.id)) ??
    customSubjectOption()
  );
}

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

  for (const s of STUDY_BUILTIN_SUBJECTS) {
    seen.set(s.id, s.name);
  }

  const subjects = [...seen.entries()]
    .filter(([id]) => !EXCLUDED_STUDY_SUBJECT_IDS.has(id))
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
