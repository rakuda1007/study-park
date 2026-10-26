import type { MetadataRoute } from "next";
import { siteOriginFromEnv } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteOriginFromEnv()}/sitemap.xml`,
  };
}
