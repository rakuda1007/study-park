/** 公式（従来）Firestore コンテンツのプレイ URL */
export function contentPlayHref(slug: string): string {
  return `/play?slug=${encodeURIComponent(slug)}`;
}

/** ワークスペース配信コンテンツのプレイ URL */
export function workspacePlayHref(workspaceSlug: string, contentSlug: string): string {
  return `/play?ws=${encodeURIComponent(workspaceSlug)}&slug=${encodeURIComponent(contentSlug)}`;
}

export function slugFromLegacyHref(href: string): string | null {
  const m = href.match(/^\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}
