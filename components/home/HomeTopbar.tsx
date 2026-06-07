"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
import { sessionModeMeta } from "@/lib/auth/session-display";
import { ShellHamburgerMenu, type ShellMenuItem } from "@/components/shell/ShellHamburgerMenu";
import {
  homePathForSession,
  resolveAuthSession,
  signOutUser,
  subscribeAuth,
  waitForAuthReady,
  type AuthSessionKind,
} from "@/lib/firebase/auth-client";

function menuItemsForSession(session: AuthSessionKind | null): ShellMenuItem[] {
  const freeItems: ShellMenuItem[] = [
    { label: "九九", href: "/kuku" },
    { label: "県庁所在地", href: "/kencho" },
  ];

  if (!session) {
    return [
      ...freeItems,
      { label: "ログイン", href: "/login" },
      { label: "学習者登録", href: "/signup/learner" },
      { label: "教材を作る", href: "/signup/creator" },
    ];
  }

  const meta = sessionModeMeta(session);
  const items: ShellMenuItem[] = [
    { label: meta.dashboardLinkLabel, href: homePathForSession(session) },
    ...freeItems,
  ];

  if (session === "admin") {
    items.push(
      { label: "コンテンツ一覧", href: "/admin/contents" },
      { label: "学習者招待", href: "/admin/invitations" },
      { label: "利用者", href: "/admin/users" },
    );
  } else if (session === "creator") {
    items.push(
      { label: "参加者", href: "/creator/learners" },
      { label: "利用状況", href: "/creator/usage" },
    );
  }

  items.push({ label: "別のアカウントでログイン", href: "/login" });
  return items;
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

  const menuItems = useMemo(() => menuItemsForSession(session), [session]);

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
            <button type="button" className="home-topbar__auth-btn" onClick={() => void logout()}>
              ログアウト
            </button>
          ) : (
            <Link href="/login" className="home-topbar__auth-btn">
              ログイン
            </Link>
          )}
          <ShellHamburgerMenu items={menuItems} ariaLabel="Study Park メニュー" />
        </div>
      </div>
    </header>
  );
}
