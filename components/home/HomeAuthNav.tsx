"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  homePathForSession,
  resolveAuthSession,
  subscribeAuth,
  waitForAuthReady,
  type AuthSessionKind,
} from "@/lib/firebase/auth-client";

const SESSION_LABEL: Record<AuthSessionKind, string> = {
  admin: "管理者",
  creator: "クリエイター（教材オーナー）",
  learner: "学習者",
};

const DASHBOARD_LABEL: Record<AuthSessionKind, string> = {
  admin: "コンテンツ一覧へ",
  creator: "教材一覧へ",
  learner: "学習者ホームへ",
};

export function HomeAuthNav() {
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
    const dashboardHref = homePathForSession(session);
    return (
      <nav className="home-footer__nav" aria-label="アカウント">
        <p className="home-footer__status">
          ログイン中（{SESSION_LABEL[session]}）
        </p>
        <div className="home-footer__links">
          <Link href={dashboardHref} className="home-footer__link">
            {DASHBOARD_LABEL[session]}
          </Link>
          <Link href="/login" className="home-footer__link">
            別アカウントでログイン
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
