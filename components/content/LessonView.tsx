"use client";

import Link from "next/link";
import type { ContentDoc } from "@/lib/content/types";

type Props = {
  content: ContentDoc;
};

export function LessonView({ content }: Props) {
  const intro = content.intro ?? "";
  const sections = content.lesson?.sections ?? [];

  return (
    <>
      <header className="app-header app-header--unified">
        <Link href="/" className="app-header-logo-link" aria-label="トップへ">
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
        {intro ? <p className="lesson-intro">{intro}</p> : null}
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
            {s.blocks.map((b, i) => {
              if (b.kind === "html") {
                return (
                  <div
                    key={`${s.id}-html-${i}`}
                    className="lesson-html"
                    dangerouslySetInnerHTML={{ __html: b.html }}
                  />
                );
              }
              return (
                <p key={`${s.id}-p-${i}`} className="lesson-body">
                  {b.text}
                </p>
              );
            })}
          </article>
        ))}
      </main>
    </>
  );
}
