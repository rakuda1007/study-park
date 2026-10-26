import type { MetadataRoute } from "next";
import { siteOriginFromEnv } from "@/lib/site-url";

/** 静的エクスポート（output: "export"）では動的ルートにできない */
export const dynamic = "force-static";

/**
 * 検索エンジン向けの公開 URL。
 * 学習者・クリエイター・管理画面は noindex のため含めない。
 * 静的エクスポート時はビルド時点の sitemap.xml になる。
 */
const PUBLIC_PAGES: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/portal", changeFrequency: "monthly", priority: 0.9 },
  { path: "/portal/study-management", changeFrequency: "monthly", priority: 0.8 },
  { path: "/portal/quiz-modes", changeFrequency: "monthly", priority: 0.8 },
  { path: "/portal/create-and-share", changeFrequency: "monthly", priority: 0.8 },
  { path: "/kuku", changeFrequency: "monthly", priority: 0.8 },
  { path: "/kencho", changeFrequency: "monthly", priority: 0.8 },
  { path: "/signup", changeFrequency: "monthly", priority: 0.7 },
  { path: "/signup/learner", changeFrequency: "monthly", priority: 0.7 },
  { path: "/signup/creator", changeFrequency: "monthly", priority: 0.7 },
  { path: "/login", changeFrequency: "yearly", priority: 0.4 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/commerce-disclosure", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOriginFromEnv();
  const lastModified = new Date();

  return PUBLIC_PAGES.map((page) => ({
    url: `${origin}${page.path === "/" ? "" : page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
