import type { NextConfig } from "next";

/** public 配下の静的クイズ（index.html） */
const STATIC_QUIZ_APPS = ["kuku", "kencho", "shokubutsu"] as const;

const isProdBuild = process.env.NODE_ENV === "production";

function quizRedirects() {
  return STATIC_QUIZ_APPS.flatMap((app) => [
    {
      source: `/${app}`,
      destination: `/${app}/index.html`,
      permanent: false,
    },
    {
      source: `/${app}/`,
      destination: `/${app}/index.html`,
      permanent: false,
    },
  ]);
}

/**
 * Middleware は output: "export" と併用不可。
 * 開発: redirects（本番ビルド時は定義しない）
 * 本番: firebase.json の rewrites
 */
const nextConfig: NextConfig = {
  ...(isProdBuild ? { output: "export" as const } : { redirects: async () => quizRedirects() }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
