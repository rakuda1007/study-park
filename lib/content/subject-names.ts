import type { ContentManifest, SubjectDoc } from "./types";

/** manifest + Firestore subjects から教科 ID → 表示名 */
export function buildSubjectNameMap(
  manifest: ContentManifest,
  subjects: SubjectDoc[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of manifest.subjects) {
    map.set(s.id, s.name);
  }
  for (const s of subjects) {
    map.set(s.id, s.name);
  }
  map.set("general", map.get("general") ?? "教材");
  return map;
}

export function subjectDisplayName(
  map: Map<string, string>,
  subjectId: string,
): string {
  return map.get(subjectId) ?? subjectId;
}

export function subjectSortOrder(manifest: ContentManifest, subjectId: string): number {
  const found = manifest.subjects.find((s) => s.id === subjectId);
  return found?.order ?? 999;
}
