import type { Metadata, Viewport } from "next";
import "./play.css";

export const metadata: Metadata = {
  title: "学習 | Study Park",
};

export const viewport: Viewport = {
  themeColor: "#6d4fc7",
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* public 配下の既存クイズ CSS（静的アセット） */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/shared/quiz-header.css?v=16" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/shared/quiz-character-fx.css?v=10" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/shared/quiz-blank-style.css?v=1" />
        <link rel="stylesheet" href="/shared/quiz-review-style.css?v=1" />
      <link rel="stylesheet" href="/shared/lesson-theme.css?v=2" />
      {children}
    </>
  );
}
