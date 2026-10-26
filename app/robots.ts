import type { MetadataRoute } from "next";
import { siteOriginFromEnv } from "@/lib/site-url";

/** 静的エクスポート（output: "export"）では動的ルートにできない */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteOriginFromEnv()}/sitemap.xml`,
  };
}
