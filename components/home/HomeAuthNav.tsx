"use client";

import Link from "next/link";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
import { useShellSession } from "@/components/shell/useShellSession";
import { sessionModeMeta } from "@/lib/auth/session-display";
import { homePathForSession } from "@/lib/firebase/auth-client";

export function HomeAuthNav() {
  const { ready, session } = useShellSession();

  if (!ready) {
    return (
      <nav className="home-footer__nav" aria-label="アカウント">
        <span className="home-footer__status" role="status">
          アカウント確認中…
        </span>
      </nav>
    );
  }

  if (session) {
    const meta = sessionModeMeta(session);
    const dashboardHref = homePathForSession(session);
    return (
      <nav className="home-footer__nav" aria-label="アカウント">
        <div className="home-footer__session">
          <SessionModeBadge kind={session} />
          <p className="home-footer__status">{meta.homeStatus}</p>
        </div>
        <div className="home-footer__links">
          <Link href={dashboardHref} className="home-footer__link">
            {meta.dashboardLinkLabel}
          </Link>
          <Link href="/login" className="home-footer__link">
            別のアカウントでログイン
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="home-footer__nav" aria-label="アカウント">
      <div className="home-footer__links">
        <Link href="/login" className="home-footer__link">
          ログイン
        </Link>
        <Link href="/signup/creator" className="home-footer__link">
          教材を作る（クリエイター）
        </Link>
        <Link href="/signup/learner" className="home-footer__link">
          学習者登録
        </Link>
      </div>
    </nav>
  );
}
