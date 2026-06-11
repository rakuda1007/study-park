/** 本番の公開オリジン（招待・共有リンクの既定） */
export const PRODUCTION_SITE_ORIGIN = "https://study.tennis-park-community.com";

/** ビルド時・メタデータ用のサイトオリジン */
export function siteOriginFromEnv(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return PRODUCTION_SITE_ORIGIN;
}

/**
 * 学習者へ渡す絶対 URL のオリジン。
 * localhost 開発時のみ現在のオリジンを使い、それ以外は本番ドメインを返す。
 */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
  }
  return PRODUCTION_SITE_ORIGIN;
}

/** パス（先頭 `/`）から共有用の絶対 URL を組み立てる */
export function absoluteSiteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteOrigin()}${normalized}`;
}
