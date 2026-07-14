import { contentPlayHref, workspacePlayHref } from "@/lib/content/urls";
import type { ContentType } from "@/lib/content/types";

export type PlayNavItem = {
  id: string;
  title: string;
  href: string;
  type: ContentType;
};

export type PlayNav = {
  materialsHref: string;
  next: PlayNavItem | null;
  more: PlayNavItem[];
};

type NavSourceItem = {
  id: string;
  title: string;
  type: ContentType;
  slug: string;
  order: number;
  workspaceId?: string;
};

function toNavItem(
  item: NavSourceItem,
  workspaceSlug: string | null,
): PlayNavItem {
  const href =
    workspaceSlug && item.workspaceId
      ? workspacePlayHref(workspaceSlug, item.slug, item.workspaceId, item.id)
      : contentPlayHref(item.slug);
  return {
    id: item.id,
    title: item.title,
    href,
    type: item.type,
  };
}

/** シェルのホーム先から教材一覧へのリンクを決める */
export function materialsHrefForHome(homeHref: string): string {
  if (!homeHref || homeHref === "/") return "/";
  return "/learner/materials";
}

/**
 * 同じ教科内の教材から「次の教材」と候補リストを組み立てる。
 * order 昇順で現在の次を優先し、末尾なら先頭側の他教材を候補にする。
 */
export function buildPlayNav(
  subjectItems: NavSourceItem[],
  currentId: string,
  materialsHref: string,
  workspaceSlug: string | null = null,
): PlayNav {
  const sorted = [...subjectItems].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((c) => c.id === currentId);

  let next: PlayNavItem | null = null;
  if (currentIndex >= 0 && currentIndex < sorted.length - 1) {
    next = toNavItem(sorted[currentIndex + 1], workspaceSlug);
  }

  const after =
    currentIndex >= 0
      ? sorted.slice(currentIndex + (next ? 2 : 1))
      : sorted.filter((c) => c.id !== currentId);
  const before =
    currentIndex > 0 ? [...sorted.slice(0, currentIndex)].reverse() : [];

  const moreIds = new Set<string>([currentId]);
  if (next) moreIds.add(next.id);

  const more: PlayNavItem[] = [];
  for (const item of [...after, ...before]) {
    if (moreIds.has(item.id)) continue;
    more.push(toNavItem(item, workspaceSlug));
    moreIds.add(item.id);
    if (more.length >= 3) break;
  }

  return { materialsHref, next, more };
}
