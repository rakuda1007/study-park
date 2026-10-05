"use client";

import Link from "next/link";
import { useShellSession } from "@/components/shell/useShellSession";
import { homePathForSession } from "@/lib/firebase/auth-client";

export function HomeGuestCta() {
  const { ready, session } = useShellSession();

  if (!ready) return null;

  if (session) {
    return (
      <div className="home-hero__cta-wrap">
        <Link href={homePathForSession(session)} className="home-hero__cta">
          {session === "learner" ? "学習管理を開く" : "マイページを開く"}
        </Link>
      </div>
    );
  }

  return (
    <div className="home-hero__cta-wrap">
      <Link href="/signup/learner" className="home-hero__cta">
        学習管理をはじめる（無料）
      </Link>
      <div className="home-hero__cta-secondary">
        <a href="#home-menu" className="home-hero__cta-link">
          まずは無料コンテンツを試す
        </a>
        <Link href="/signup/creator" className="home-hero__cta-link">
          問題を作って配る
        </Link>
      </div>
    </div>
  );
}
