"use client";

import Link from "next/link";
import { sessionModeMeta } from "@/lib/auth/session-display";
import { homePathForSession } from "@/lib/firebase/auth-client";
import { useShellSession } from "@/components/shell/useShellSession";

export function PortalHeroCta() {
  const { ready, session } = useShellSession();

  if (!ready || !session) {
    return (
      <Link href="/signup/creator" className="portal-btn portal-btn--primary portal-btn--large">
        今すぐ教材をつくる（無料）
      </Link>
    );
  }

  const meta = sessionModeMeta(session);
  return (
    <Link
      href={homePathForSession(session)}
      className="portal-btn portal-btn--primary portal-btn--large"
    >
      {meta.portalHeroPrimaryLabel}
    </Link>
  );
}

export function PortalHeroNote() {
  const { ready, session } = useShellSession();

  if (!ready || session) return null;

  return (
    <p className="portal-hero__note">
      学習者の方は
      <Link href="/signup/learner"> こちらから参加</Link>
      。九九・県庁所在地など公式コンテンツは
      <Link href="/"> トップ</Link>
      から登録なしで学べます。
    </p>
  );
}

export function PortalClosingActions() {
  const { ready, session } = useShellSession();

  if (!ready || !session) {
    return (
      <div className="portal-closing__actions">
        <Link href="/signup" className="portal-btn portal-btn--primary portal-btn--large">
          今すぐ Study Park をはじめる（無料）
        </Link>
        <Link href="/" className="portal-btn portal-btn--ghost">
          学習メニューへ
        </Link>
      </div>
    );
  }

  const meta = sessionModeMeta(session);
  const homeHref = homePathForSession(session);
  const secondary =
    session === "learner"
      ? { href: "/learner/materials", label: "教材一覧へ" }
      : session === "creator"
        ? { href: "/learner/materials", label: "教材を確認" }
        : { href: "/", label: "学習メニューへ" };

  return (
    <div className="portal-closing__actions">
      <Link href={homeHref} className="portal-btn portal-btn--primary portal-btn--large">
        {meta.portalHeroPrimaryLabel}
      </Link>
      <Link href={secondary.href} className="portal-btn portal-btn--ghost">
        {secondary.label}
      </Link>
    </div>
  );
}
