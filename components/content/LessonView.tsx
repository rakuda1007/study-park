"use client";

import Link from "next/link";
import { LessonBlocks } from "@/components/content/LessonBlocks";
import { PlayAppMenu } from "@/components/content/PlayAppMenu";
import { PlayFinishNav } from "@/components/content/PlayFinishNav";
import { materialsHrefForHome, type PlayNav } from "@/lib/content/play-nav";
import { RichTextContent } from "@/lib/content/rich-text-react";
import type { ContentDoc } from "@/lib/content/types";

type Props = {
  content: ContentDoc;
  /** ロゴのリンク先（学習者は /learner） */
  homeHref?: string;
  /** 末尾の次教材ナビ */
  playNav?: PlayNav | null;
};

export function LessonView({ content, homeHref = "/", playNav = null }: Props) {
  const intro = content.intro ?? "";
  const sections = content.lesson?.sections ?? [];
  const finishNav: PlayNav = playNav ?? {
    materialsHref: materialsHrefForHome(homeHref),
    next: null,
    more: [],
  };

  return (
    <div className="lesson-page">
      <header className="app-header app-header--unified app-header--with-menu app-header--no-tools">
        <Link
          href={homeHref}
          className="app-header-logo-link"
          aria-label={homeHref === "/learner" ? "学習管理へ" : "トップへ"}
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
        <PlayAppMenu ariaLabel="学習メニュー" />
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
        <section className="lesson-finish" aria-labelledby="lesson-finish-heading">
          <h2 id="lesson-finish-heading" className="lesson-finish-heading">
            この教材をおわりに
          </h2>
          <PlayFinishNav nav={finishNav} variant="footer" />
        </section>
      </main>
    </div>
  );
}
