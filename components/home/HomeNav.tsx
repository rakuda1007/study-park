"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { HomeSubjectMenu } from "@/lib/content/manifest-home";
import { manifestToHomeMenus } from "@/lib/content/manifest-home";
import { mergeHomeMenus } from "@/lib/content/merge-menus";
import {
  listPublicSubjects,
  listPublishedContents,
  listPublishedLegacyContents,
} from "@/lib/content/public-firestore";
import type { ContentManifest } from "@/lib/content/types";

type MenuItem = {
  label: string;
  href?: string;
  ready: boolean;
};

function MenuItemButton({ item }: { item: MenuItem }) {
  const inner = (
    <>
      <span className="menu-item-label">{item.label}</span>
      {item.ready ? (
        <span className="menu-item-arrow" aria-hidden="true">
          →
        </span>
      ) : (
        <span className="menu-item-badge">工事中</span>
      )}
    </>
  );

  if (item.ready && item.href) {
    return (
      <Link href={item.href} className="menu-item menu-item--active">
        {inner}
      </Link>
    );
  }

  return (
    <span className="menu-item menu-item--disabled" aria-disabled="true">
      {inner}
    </span>
  );
}

function SubjectSection({ group }: { group: HomeSubjectMenu }) {
  const readyCount = group.items.filter((item) => item.ready).length;

  if (group.items.length === 1) {
    return (
      <section className="home-subject" aria-labelledby={`subject-${group.subject}`}>
        <h2 id={`subject-${group.subject}`} className="home-subject-name">
          {group.subject}
        </h2>
        <ul className="home-item-list">
          <li>
            <MenuItemButton item={group.items[0]} />
          </li>
        </ul>
      </section>
    );
  }

  return (
    <details className="home-subject home-subject-dropdown" open>
      <summary className="home-subject-dropdown-trigger">
        <span id={`subject-${group.subject}`} className="home-subject-name">
          {group.subject}
        </span>
        <span className="home-subject-dropdown-meta">
          <span className="home-subject-dropdown-count">{readyCount}件</span>
          <span className="home-subject-dropdown-chevron" aria-hidden="true" />
        </span>
      </summary>
      <ul
        className="home-item-list home-subject-dropdown-panel"
        aria-labelledby={`subject-${group.subject}`}
      >
        {group.items.map((item) => (
          <li key={`${group.subject}-${item.label}-${item.href ?? ""}`}>
            <MenuItemButton item={item} />
          </li>
        ))}
      </ul>
    </details>
  );
}

export function HomeNav({ manifest }: { manifest: ContentManifest }) {
  const staticMenus = useMemo(() => manifestToHomeMenus(manifest), [manifest]);
  const [menus, setMenus] = useState<HomeSubjectMenu[]>(staticMenus);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const [subjects, published, legacy] = await Promise.all([
        listPublicSubjects(),
        listPublishedContents(),
        listPublishedLegacyContents(),
      ]);
      setMenus(mergeHomeMenus(manifest, subjects, published, legacy));
      setLoadState("ok");
    } catch (e) {
      console.error("HomeNav: Firestore メニュー取得失敗", e);
      setMenus(staticMenus);
      setLoadError(
        e instanceof Error
          ? e.message
          : "公開コンテンツを読み込めませんでした。Firestore ルールとインデックスを確認してください。",
      );
      setLoadState("error");
    }
  }, [manifest, staticMenus]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isRefreshing = loadState === "loading";

  return (
    <nav className="home-nav" aria-label="学習メニュー">
      <div className="home-nav-toolbar">
        <button
          type="button"
          className="home-refresh-btn"
          onClick={() => void refresh()}
          disabled={isRefreshing}
          aria-busy={isRefreshing}
        >
          {isRefreshing ? "更新中…" : "更新"}
        </button>
      </div>
      {loadState === "error" && loadError ? (
        <p className="home-menu-notice home-menu-notice--error" role="status">
          {loadError}
        </p>
      ) : null}
      <div className="home-subject-list">
        {menus.map((group) => (
          <SubjectSection key={group.subject} group={group} />
        ))}
      </div>
    </nav>
  );
}
