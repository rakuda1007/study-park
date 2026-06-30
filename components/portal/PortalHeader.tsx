"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
import { ShellHamburgerMenu } from "@/components/shell/ShellHamburgerMenu";
import { useShellSession } from "@/components/shell/useShellSession";
import { sessionModeMeta } from "@/lib/auth/session-display";
import { homePathForSession, signOutUser } from "@/lib/firebase/auth-client";
import { getShellMenu } from "@/lib/shell/menu-config";

export function PortalHeader() {
  const router = useRouter();
  const { ready, session } = useShellSession();
  const menu = useMemo(() => (session ? getShellMenu(session) : null), [session]);
  const brandHref = session ? homePathForSession(session) : "/portal";

  async function logout() {
    await signOutUser();
    router.replace("/portal");
    router.refresh();
  }

  return (
    <header className="portal-header">
      <div className="portal-header__inner">
        <div className="portal-header__brand-row">
          <Link href={brandHref} className="portal-brand" title={session ? "アプリに戻る" : undefined}>
            <img
              src="/study-park-logo.png?v=8"
              alt=""
              width={40}
              height={40}
              className="portal-brand__logo"
              decoding="async"
            />
            <span className="portal-brand__name">Study Park</span>
          </Link>
          {ready && session ? <SessionModeBadge kind={session} /> : null}
        </div>
        <nav className="portal-header-nav" aria-label="ポータルメニュー">
          {!ready ? (
            <span className="portal-header-muted" role="status">
              …
            </span>
          ) : session ? (
            <>
              {session === "creator" ? (
                <Link
                  href={homePathForSession(session)}
                  className="portal-header-btn"
                >
                  {sessionModeMeta(session).dashboardBackLinkLabel}
                </Link>
              ) : null}
              <ShellHamburgerMenu
                items={menu?.items ?? []}
                bottomItems={menu?.bottomItems ?? []}
                ariaLabel="Study Park メニュー"
                onLogout={() => void logout()}
              />
            </>
          ) : (
            <>
              <Link href="/login" className="portal-header-link">
                ログイン
              </Link>
              <Link href="/signup" className="portal-header-btn">
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
