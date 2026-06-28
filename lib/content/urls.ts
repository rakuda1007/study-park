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

/** クリエイター本人向けプレビュー URL（非公開教材も閲覧可） */
export function workspacePlayPreviewHref(
  workspaceSlug: string,
  workspaceId: string,
  contentId: string,
  contentSlug?: string,
): string {
  const q = new URLSearchParams({
    ws: workspaceSlug,
    wid: workspaceId,
    cid: contentId,
    preview: "1",
  });
  if (contentSlug) q.set("slug", contentSlug.trim().toLowerCase());
  return `/play?${q.toString()}`;
}

export function slugFromLegacyHref(href: string): string | null {
  const m = href.match(/^\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}
