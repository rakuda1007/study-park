"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
import { sessionModeMeta } from "@/lib/auth/session-display";
import {
  homePathForSession,
  resolveAuthSession,
  signOutUser,
  subscribeAuth,
  waitForAuthReady,
  type AuthSessionKind,
} from "@/lib/firebase/auth-client";

function dashboardLabel(kind: AuthSessionKind): string {
  if (kind === "learner") return "学習者ホーム";
  return sessionModeMeta(kind).dashboardLinkLabel;
}

export function PortalHeader() {
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

  async function logout() {
    await signOutUser();
    router.replace("/portal");
    router.refresh();
  }

  return (
    <header className="portal-header">
      <div className="portal-header__inner">
        <div className="portal-header__brand-row">
          <Link href="/portal" className="portal-brand">
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
              <Link
                href={homePathForSession(session)}
                className="portal-header-btn"
              >
                {dashboardLabel(session)}
              </Link>
              <button
                type="button"
                className="portal-header-btn portal-header-btn--ghost"
                onClick={() => void logout()}
              >
                ログアウト
              </button>
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
