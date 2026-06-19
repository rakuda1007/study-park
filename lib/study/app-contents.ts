import type { StudyWorkspaceOption } from "@/lib/study/subject-options";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";

/** この件数以下ならインライン select、超えると検索モーダル */
export const STUDY_APP_CONTENT_INLINE_LIMIT = 8;

export type StudyAppContentOption = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  content: WorkspaceContentDoc;
};

export function listAppContentsForSubject(
  workspaces: StudyWorkspaceOption[],
  subjectId: string,
): StudyAppContentOption[] {
  const filterSubject = subjectId.startsWith("custom:") ? "" : subjectId;
  const items: StudyAppContentOption[] = [];

  for (const ws of workspaces) {
    for (const content of ws.contents) {
      if (filterSubject && content.subjectId !== filterSubject) continue;
      items.push({
        workspaceId: ws.workspaceId,
        workspaceName: ws.workspaceName,
        workspaceSlug: ws.workspaceSlug,
        content,
      });
    }
  }

  return items.sort((a, b) => {
    const byWorkspace = a.workspaceName.localeCompare(b.workspaceName, "ja");
    if (byWorkspace !== 0) return byWorkspace;
    return a.content.title.localeCompare(b.content.title, "ja");
  });
}

export function appContentOptionKey(option: StudyAppContentOption): string {
  return `${option.workspaceId}:${option.content.id}`;
}

export function findAppContentOption(
  options: StudyAppContentOption[],
  key: string,
): StudyAppContentOption | undefined {
  return options.find((o) => appContentOptionKey(o) === key);
}
