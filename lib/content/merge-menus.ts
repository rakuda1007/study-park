import type { HomeSubjectMenu } from "./manifest-home";
import { manifestToHomeMenus } from "./manifest-home";
import type { ContentDoc, ContentManifest, LegacyContentDoc, SubjectDoc } from "./types";
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

/** manifest の静的項目（Firestore 未同期時のフォールバック） */
function manifestLegacyItems(manifest: ContentManifest): LegacyContentDoc[] {
  const out: LegacyContentDoc[] = [];
  for (const subject of manifest.subjects) {
    subject.items.forEach((item, index) => {
      if (!item.href) return;
      const slug = slugFromLegacyHref(item.href);
      if (!slug) return;
      out.push({
        id: `manifest:${slug}`,
        subjectId: subject.id,
        label: item.label,
        href: item.href,
        slug,
        order: (index + 1) * 100,
        ready: item.ready,
      });
    });
  }
  return out;
}

function resolveLegacyItems(
  manifest: ContentManifest,
  fromFirestore: LegacyContentDoc[],
): LegacyContentDoc[] {
  return fromFirestore.length > 0 ? fromFirestore : manifestLegacyItems(manifest);
}

/** 静的メニューと Firestore 公開コンテンツをマージしたトップメニュー */
export function mergeHomeMenus(
  manifest: ContentManifest,
  subjects: SubjectDoc[],
  published: ContentDoc[],
  legacyItems: LegacyContentDoc[],
): HomeSubjectMenu[] {
  const legacy = resolveLegacyItems(manifest, legacyItems);
  const legacyReady = legacy.filter((l) => l.ready);
  const subjectIdToName = buildSubjectNameMap(manifest, subjects);

  const staticSlugs = new Set(legacyReady.map((l) => l.slug).filter(Boolean));

  const legacyBySubject = new Map<string, LegacyContentDoc[]>();
  for (const item of legacyReady) {
    const list = legacyBySubject.get(item.subjectId) ?? [];
    list.push(item);
    legacyBySubject.set(item.subjectId, list);
  }
  for (const [, list] of legacyBySubject) {
    list.sort((a, b) => a.order - b.order);
  }

  const firestoreBySubject = new Map<string, ContentDoc[]>();
  for (const c of published) {
    if (staticSlugs.has(c.slug)) continue;
    const list = firestoreBySubject.get(c.subjectId) ?? [];
    list.push(c);
    firestoreBySubject.set(c.subjectId, list);
  }

  const subjectOrder = [...manifest.subjects].sort((a, b) => a.order - b.order);
  const seenSubjects = new Set<string>();

  const result: HomeSubjectMenu[] = [];

  for (const ms of subjectOrder) {
    seenSubjects.add(ms.id);
    const legacyMenu = (legacyBySubject.get(ms.id) ?? []).map((l) => ({
      label: l.label,
      href: l.href,
      ready: l.ready,
    }));
    const extra = (firestoreBySubject.get(ms.id) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        label: c.title,
        href: contentPlayHref(c.slug),
        ready: true,
      }));

    firestoreBySubject.delete(ms.id);

    const items = [...legacyMenu, ...extra];
    if (items.length === 0) continue;

    result.push({
      subject: ms.name,
      items,
    });
  }

  for (const [subjectId, docs] of firestoreBySubject) {
    const name = subjectIdToName.get(subjectId) ?? subjectId;
    if (result.some((r) => r.subject === name)) continue;
    const legacyMenu = (legacyBySubject.get(subjectId) ?? []).map((l) => ({
      label: l.label,
      href: l.href,
      ready: l.ready,
    }));
    result.push({
      subject: name,
      items: [
        ...legacyMenu,
        ...docs
          .sort((a, b) => a.order - b.order)
          .map((c) => ({
            label: c.title,
            href: contentPlayHref(c.slug),
            ready: true,
          })),
      ],
    });
  }

  return result.sort((a, b) => {
    const oa = subjectOrder.find((s) => s.name === a.subject)?.order ?? 999;
    const ob = subjectOrder.find((s) => s.name === b.subject)?.order ?? 999;
    return oa - ob;
  });
}

/** @deprecated manifest のみのフォールバック */
export function mergeHomeMenusFromManifestOnly(manifest: ContentManifest): HomeSubjectMenu[] {
  return manifestToHomeMenus(manifest);
}
