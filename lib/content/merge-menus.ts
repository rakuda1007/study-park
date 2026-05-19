import type { HomeSubjectMenu } from "./manifest-home";
import { manifestToHomeMenus } from "./manifest-home";
import type { ContentDoc, ContentManifest, SubjectDoc } from "./types";
import { contentPlayHref, slugFromLegacyHref } from "./urls";

function buildSubjectNameMap(
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
  return map;
}

/** 静的 manifest と Firestore 公開コンテンツをマージしたトップメニュー */
export function mergeHomeMenus(
  manifest: ContentManifest,
  subjects: SubjectDoc[],
  published: ContentDoc[],
): HomeSubjectMenu[] {
  const base = manifestToHomeMenus(manifest);
  const subjectIdToName = buildSubjectNameMap(manifest, subjects);

  const staticSlugs = new Set<string>();
  for (const group of base) {
    for (const item of group.items) {
      if (item.href) {
        const slug = slugFromLegacyHref(item.href);
        if (slug) staticSlugs.add(slug);
      }
    }
  }

  /** subjectId → 追加メニュー項目 */
  const bySubjectId = new Map<string, ContentDoc[]>();
  for (const c of published) {
    if (staticSlugs.has(c.slug)) continue;
    const list = bySubjectId.get(c.subjectId) ?? [];
    list.push(c);
    bySubjectId.set(c.subjectId, list);
  }

  const subjectOrder = [...manifest.subjects].sort((a, b) => a.order - b.order);
  const firestoreSubjectOrder = [...subjects].sort((a, b) => a.order - b.order);

  const result: HomeSubjectMenu[] = base.map((group) => {
    const manifestSubject = manifest.subjects.find((s) => s.name === group.subject);
    const firestoreSubject = firestoreSubjectOrder.find((s) => s.name === group.subject);
    const subjectId = manifestSubject?.id ?? firestoreSubject?.id;
    const extra = subjectId ? (bySubjectId.get(subjectId) ?? []) : [];

    const extraItems = extra
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        label: c.title,
        href: contentPlayHref(c.slug),
        ready: true,
      }));

    if (subjectId) {
      bySubjectId.delete(subjectId);
    }

    return {
      subject: group.subject,
      items: [...group.items, ...extraItems],
    };
  });

  for (const [subjectId, docs] of bySubjectId) {
    const name = subjectIdToName.get(subjectId) ?? subjectId;
    if (result.some((r) => r.subject === name)) continue;
    result.push({
      subject: name,
      items: docs
        .sort((a, b) => a.order - b.order)
        .map((c) => ({
          label: c.title,
          href: contentPlayHref(c.slug),
          ready: true,
        })),
    });
  }

  return result.sort((a, b) => {
    const oa = subjectOrder.find((s) => s.name === a.subject)?.order ?? 999;
    const ob = subjectOrder.find((s) => s.name === b.subject)?.order ?? 999;
    return oa - ob;
  });
}
