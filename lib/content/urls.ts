/** Firestore 配信コンテンツのプレイ URL（静的 export 向け） */
export function contentPlayHref(slug: string): string {
  return `/play?slug=${encodeURIComponent(slug)}`;
}

export function slugFromLegacyHref(href: string): string | null {
  const m = href.match(/^\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}
