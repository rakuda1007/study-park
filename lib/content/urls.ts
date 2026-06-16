/** 公式（従来）Firestore コンテンツのプレイ URL */
export function contentPlayHref(slug: string): string {
  return `/play?slug=${encodeURIComponent(slug)}`;
}

/** ワークスペース配信コンテンツのプレイ URL（wid / cid は学習者プレイ用の確実な解決） */
export function workspacePlayHref(
  workspaceSlug: string,
  contentSlug: string,
  workspaceId?: string,
  contentId?: string,
): string {
  const q = new URLSearchParams({
    ws: workspaceSlug,
    slug: contentSlug,
  });
  if (workspaceId) q.set("wid", workspaceId);
  if (contentId) q.set("cid", contentId);
  return `/play?${q.toString()}`;
}

export function slugFromLegacyHref(href: string): string | null {
  const m = href.match(/^\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}
