"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
import { sessionModeMeta } from "@/lib/auth/session-display";
import { ShellHamburgerMenu, type ShellMenuItem } from "@/components/shell/ShellHamburgerMenu";
import { PORTAL_MENU_ITEM } from "@/components/shell/portal-menu-item";
import {
  homePathForSession,
  resolveAuthSession,
  signOutUser,
  subscribeAuth,
  waitForAuthReady,
  type AuthSessionKind,
} from "@/lib/firebase/auth-client";

type HomeMenuConfig = {
  items: ShellMenuItem[];
  bottomItems: ShellMenuItem[];
};

function menuItemsForSession(session: AuthSessionKind | null): HomeMenuConfig {
  if (!session) {
    return {
      items: [
        { label: "ログイン", href: "/login" },
        { label: "学習者登録", href: "/signup/learner" },
        { label: "教材を作る", href: "/signup/creator" },
        PORTAL_MENU_ITEM,
      ],
      bottomItems: [],
    };
  }

  const meta = sessionModeMeta(session);
  const items: ShellMenuItem[] = [];
  const bottomItems: ShellMenuItem[] = [];

  if (session === "admin") {
    items.push(
      { label: "コンテンツ一覧", href: "/admin/contents" },
      { label: "教科マスタ", href: "/admin/subjects" },
      { label: "学習者招待", href: "/admin/invitations" },
      { label: "利用者一覧", href: "/admin/users" },
      { label: "学習者ホーム", href: "/learner" },
    );
    bottomItems.push({ label: "プロフィール", href: "/admin/profile" });
  } else if (session === "creator") {
    items.push({ label: meta.dashboardLinkLabel, href: homePathForSession(session) });
    items.push(
      { label: "教科マスタ", href: "/creator/subjects" },
      { label: "参加者", href: "/creator/learners" },
      { label: "利用状況", href: "/creator/usage" },
      { label: "学習者ホーム", href: "/learner" },
    );
    bottomItems.push({ label: "プロフィール", href: "/creator/profile" });
  } else if (session === "learner") {
    items.push({ label: meta.dashboardLinkLabel, href: homePathForSession(session) });
    bottomItems.push({ label: "プロフィール", href: "/learner/profile" });
  }

  items.push(PORTAL_MENU_ITEM);
  bottomItems.push({ label: "別のアカウントでログイン", href: "/login" });
  return { items, bottomItems };
}

export function HomeTopbar() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSessionKind | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsub = subscribeAuth((user) => {
        void resolveAuthSession(user).then((kind) => {
          if (!cancelled) {
            setSession(kind);
            setReady(true);
          }
        });
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const menu = useMemo(() => menuItemsForSession(session), [session]);

  async function logout() {
    await signOutUser();
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="home-topbar">
      <div className="home-topbar__inner home-topbar__header">
        <div className="home-topbar__title-row">
          <h1 className="home-topbar__title">
            <Link href="/" className="home-topbar__brand">
              Study Park
            </Link>
          </h1>
          {ready && session ? <SessionModeBadge kind={session} /> : null}
        </div>
        <div className="home-topbar__actions">
          {!ready ? (
            <span className="home-topbar__auth-muted" role="status">
              …
            </span>
          ) : session ? (
            <>
              {session === "learner" ? (
                <Link href="/learner" className="home-topbar__auth-btn home-topbar__auth-btn--primary">
                  学習者ホーム
                </Link>
              ) : null}
              <button type="button" className="home-topbar__auth-btn" onClick={() => void logout()}>
                ログアウト
              </button>
            </>
          ) : (
            <Link href="/login" className="home-topbar__auth-btn">
              ログイン
            </Link>
          )}
          <ShellHamburgerMenu
            items={menu.items}
            bottomItems={menu.bottomItems}
            ariaLabel="Study Park メニュー"
          />
        </div>
      </div>
    </header>
  );
}
