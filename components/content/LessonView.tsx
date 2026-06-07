"use client";

import Link from "next/link";
import { LessonBlocks } from "@/components/content/LessonBlocks";
import { RichTextContent } from "@/lib/content/rich-text-react";
import type { ContentDoc } from "@/lib/content/types";

type Props = {
  content: ContentDoc;
  /** ロゴのリンク先（学習者は /learner） */
  homeHref?: string;
};

export function LessonView({ content, homeHref = "/" }: Props) {
  const intro = content.intro ?? "";
  const sections = content.lesson?.sections ?? [];

  return (
    <div className="lesson-page">
      <header className="app-header app-header--unified">
        <Link
          href={homeHref}
          className="app-header-logo-link"
          aria-label={homeHref === "/learner" ? "学習者ホームへ" : "トップへ"}
        >
          <img
            className="app-header-logo"
            src="/study-park-logo.png?v=8"
            alt=""
            width={48}
            height={48}
          />
        </Link>
        <h1 className="app-header-title">{content.title}</h1>
      </header>
      <main className="lesson-main">
        {intro ? (
          <div className="lesson-intro">
            <RichTextContent text={intro} paragraphClass="lesson-intro-body" />
          </div>
        ) : null}
        {sections.length > 0 ? (
          <nav className="lesson-toc" aria-label="このページの目次">
            <p className="lesson-toc-title">もくじ</p>
            <ol className="lesson-toc-list">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.heading}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {sections.map((s) => (
          <article
            key={s.id}
            id={s.id}
            className="lesson-section"
            aria-labelledby={`heading-${s.id}`}
          >
            <h2 id={`heading-${s.id}`}>{s.heading}</h2>
            <LessonBlocks sectionId={s.id} blocks={s.blocks} />
          </article>
        ))}
      </main>
    </div>
  );
}
