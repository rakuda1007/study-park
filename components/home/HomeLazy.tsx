"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { mergeHomeMenus } from "@/lib/content/merge-menus";
import type { ContentManifest } from "@/lib/content/types";

function HomeNavFallback({ manifest }: { manifest: ContentManifest }) {
  const menus = mergeHomeMenus(manifest, [], [], null);
  return (
    <nav className="home-nav" aria-label="学習メニュー">
      <div className="home-subject-list">
        {menus.map((group) => (
          <section
            key={group.subject}
            className="home-subject"
            aria-labelledby={`subject-fallback-${group.subject}`}
          >
            <h2 id={`subject-fallback-${group.subject}`} className="home-subject-name">
              <span className="home-subject-icon" aria-hidden="true">
                {group.subject.slice(0, 1)}
              </span>
              {group.subject}
            </h2>
            <ul className="home-item-list">
              {group.items.map((item) => (
                <li key={`${group.subject}-${item.label}`}>
                  {item.ready && item.href ? (
                    <Link href={item.href} className="menu-item menu-item--active">
                      <span className="menu-item__body">
                        <span className="menu-item-label">{item.label}</span>
                      </span>
                      <span className="menu-item-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  ) : (
                    <span className="menu-item menu-item--disabled" aria-disabled="true">
                      <span className="menu-item__body">
                        <span className="menu-item-label">{item.label}</span>
                      </span>
                      <span className="menu-item-badge">準備中</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}

const HomeTopbar = dynamic(
  () => import("@/components/home/HomeTopbar").then((m) => m.HomeTopbar),
  {
    ssr: false,
    loading: () => (
      <header className="home-topbar" aria-hidden>
        <div className="home-topbar__inner home-topbar__header">
          <div className="home-topbar__title-row">
            <h1 className="home-topbar__title">Study Park</h1>
          </div>
        </div>
      </header>
    ),
  },
);

const HomeGuestCta = dynamic(
  () => import("@/components/home/HomeGuestCta").then((m) => m.HomeGuestCta),
  { ssr: false },
);

const HomeNav = dynamic(
  () => import("@/components/home/HomeNav").then((m) => m.HomeNav),
  { ssr: false },
);

export function HomeTopbarLazy() {
  return <HomeTopbar />;
}

export function HomeGuestCtaLazy() {
  return <HomeGuestCta />;
}

export function HomeNavLazy({ manifest }: { manifest: ContentManifest }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <HomeNavFallback manifest={manifest} />;
  }

  return <HomeNav manifest={manifest} />;
}
