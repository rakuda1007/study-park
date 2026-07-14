"use client";

import Link from "next/link";
import type { PlayNav } from "@/lib/content/play-nav";

type Props = {
  nav: PlayNav;
  /** modal: クイズ完了モーダル内 / footer: レッスン末尾 */
  variant: "modal" | "footer";
};

function typeLabel(type: "quiz" | "lesson"): string {
  return type === "quiz" ? "クイズ" : "レッスン";
}

export function PlayFinishNav({ nav, variant }: Props) {
  const hasChoices = Boolean(nav.next) || nav.more.length > 0;

  return (
    <div
      className={`play-finish-nav play-finish-nav--${variant}`}
      aria-label="次の教材を選ぶ"
    >
      {variant === "footer" ? (
        <p className="play-finish-nav__lead">読みおわったら、次の教材へ進めます</p>
      ) : hasChoices ? (
        <p className="play-finish-nav__lead">つぎの教材を選ぶ</p>
      ) : null}

      {nav.next ? (
        <Link href={nav.next.href} className="play-finish-nav__next">
          <span className="play-finish-nav__next-label">次の教材</span>
          <span className="play-finish-nav__next-title">{nav.next.title}</span>
          <span className="play-finish-nav__next-meta">{typeLabel(nav.next.type)}</span>
        </Link>
      ) : null}

      {nav.more.length > 0 ? (
        <div className="play-finish-nav__more">
          <p className="play-finish-nav__more-heading">
            {nav.next ? "ほかの教材" : "同じ教科の教材"}
          </p>
          <ul className="play-finish-nav__list">
            {nav.more.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="play-finish-nav__link">
                  <span className="play-finish-nav__link-title">{item.title}</span>
                  <span className="play-finish-nav__link-meta">{typeLabel(item.type)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Link href={nav.materialsHref} className="play-finish-nav__materials">
        教材一覧へ
      </Link>
    </div>
  );
}
