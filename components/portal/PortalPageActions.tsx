"use client";

import Link from "next/link";
import { sessionModeMeta } from "@/lib/auth/session-display";
import { homePathForSession } from "@/lib/firebase/auth-client";
import { useShellSession } from "@/components/shell/useShellSession";

const PARK_HREF = "/?park=1";

export function PortalHeroCta() {
  const { ready, session } = useShellSession();

  if (!ready || !session) {
    return (
      <Link href="/signup/learner" className="portal-btn portal-btn--primary portal-btn--large">
        学習管理をはじめる（無料）
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

  return (
    <p className="portal-hero__note">
      <Link href={PARK_HREF}>無料で今すぐ試す →</Link>
      {" （九九・県庁所在地など、登録なし）"}
      {ready && !session ? (
        <>
          {" · "}
          問題を作って生徒に配りたい方は
          <Link href="/signup/creator"> こちら</Link>。
        </>
      ) : null}
    </p>
  );
}

export function PortalClosingActions() {
  const { ready, session } = useShellSession();

  if (!ready || !session) {
    return (
      <div className="portal-closing__actions">
        <Link href="/signup/learner" className="portal-btn portal-btn--primary portal-btn--large">
          学習管理をはじめる（無料）
        </Link>
        <Link href={PARK_HREF} className="portal-btn portal-btn--ghost">
          無料で今すぐ試す
        </Link>
        <Link href="/signup/creator" className="portal-btn portal-btn--ghost">
          問題を作って配る
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
        ? { href: "/learner", label: "学習管理を開く" }
        : null;

  return (
    <div className="portal-closing__actions">
      <Link href={homeHref} className="portal-btn portal-btn--primary portal-btn--large">
        {meta.portalHeroPrimaryLabel}
      </Link>
      {secondary ? (
        <Link href={secondary.href} className="portal-btn portal-btn--ghost">
          {secondary.label}
        </Link>
      ) : null}
      <Link href={PARK_HREF} className="portal-btn portal-btn--ghost">
        無料で今すぐ試す
      </Link>
    </div>
  );
}
